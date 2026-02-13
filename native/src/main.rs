use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode, KeyEventKind, KeyModifiers},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Alignment, Constraint, Direction, Layout},
    style::{Color, Modifier, Style, Stylize},
    text::{Line, Span, Text},
    widgets::{Block, BorderType, Borders, List, ListItem, Paragraph},
    Terminal,
};
use std::io::{stdout, Stdout};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;
use std::time::Duration;

// --- Colors & Constants ---
const CLAUDE_ORANGE: Color = Color::Rgb(217, 119, 87); // #D97757
const DARK_BG: Color = Color::Rgb(21, 21, 21); // #151515
const FOOTER_TEXT: Color = Color::Rgb(112, 128, 144); // Slate Gray
const FOOTER_HIGHLIGHT: Color = Color::Rgb(255, 255, 255); // White

pub const LOGO_TEXT: [&str; 12] = [
    " ██████╗██╗     ██╗     ",
    "██╔════╝██║     ██║     ",
    "██║     ██║     ██║     ",
    "██║     ██║     ██║     ",
    "╚██████╗███████╗██║     ",
    " ╚═════╝╚══════╝╚═╝     ",
    " ██████╗ ██████╗ ██████╗ ███████╗",
    "██╔════╝██╔═══██╗██╔══██╗██╔════╝",
    "██║     ██║   ██║██║  ██║█████╗  ",
    "██║     ██║   ██║██║  ██║██╔══╝  ",
    "╚██████╗╚██████╔╝██████╔╝███████╗",
    " ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝",
];

// --- Data Structures ---

enum AppState {
    Splash,
    Chat,
}

#[derive(Clone)]
enum MessageType {
    User,
    Thinking,
    ToolCall,
    Output,
    System,
}

#[derive(Clone)]
struct Message {
    content: String,
    msg_type: MessageType,
}

struct App {
    state: AppState,
    input: String,
    messages: Vec<Message>,
    tx_ai: mpsc::Sender<String>, // Channel to send prompts to AI
    rx_ai: mpsc::Receiver<String>, // Channel to receive responses from AI
    waiting_for_response: bool,
}

impl App {
    fn new(tx_ai: mpsc::Sender<String>, rx_ai: mpsc::Receiver<String>) -> App {
        App {
            state: AppState::Splash,
            input: String::new(),
            messages: vec![
                Message {
                    content: "Welcome to CLI CODE.".to_string(),
                    msg_type: MessageType::System,
                },
                Message {
                    content: "I am ready to assist. Type anything to chat with Google Gemini.".to_string(),
                    msg_type: MessageType::System,
                },
            ],
            tx_ai,
            rx_ai,
            waiting_for_response: false,
        }
    }

    async fn submit_message(&mut self) {
        if self.input.trim().is_empty() {
            return;
        }

        let prompt = self.input.trim().to_string();

        // Add user message to UI
        self.messages.push(Message {
            content: self.input.clone(),
            msg_type: MessageType::User,
        });

        // Add thinking indicator
        self.messages.push(Message {
            content: "Consulting Gemini...".to_string(),
            msg_type: MessageType::Thinking,
        });

        // Send to AI worker
        if let Err(e) = self.tx_ai.send(prompt).await {
            self.messages.push(Message {
                content: format!("Error communicating with AI worker: {}", e),
                msg_type: MessageType::System,
            });
        } else {
            self.waiting_for_response = true;
        }

        self.input.clear();
    }
}

// --- Main Execution ---

#[tokio::main]
async fn main() -> Result<()> {
    enable_raw_mode()?;
    let mut stdout = stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // --- Spawn Node.js AI Worker ---
    // We use a channel to communicate between the UI loop and the worker tasks
    let (tx_to_worker, mut rx_from_ui) = mpsc::channel::<String>(100);
    let (tx_to_ui, rx_from_worker) = mpsc::channel::<String>(100);

    let mut child = Command::new("node")
        .arg("scripts/ai-worker.ts")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped()) // Capture stderr to debug
        .spawn()
        .expect("Failed to spawn Node.js AI worker");

    let mut stdin = child.stdin.take().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let stderr = child.stderr.take().expect("Failed to open stderr");

    // Task: Write to Node process
    tokio::spawn(async move {
        while let Some(prompt) = rx_from_ui.recv().await {
            if let Err(e) = stdin.write_all(format!("{}
", prompt).as_bytes()).await {
                eprintln!("Failed to write to AI worker: {}", e);
                break;
            }
            if let Err(e) = stdin.flush().await {
                eprintln!("Failed to flush to AI worker: {}", e);
                break;
            }
        }
    });

    // Task: Read from Node process
    let tx_to_ui_clone = tx_to_ui.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            // Replace our serialized newlines back to real ones if we did that, 
            // or just pass through. For now, assume simple text.
            let _ = tx_to_ui_clone.send(line.replace("\n", "
")).await;
        }
    });
    
    // Task: Log stderr for debugging
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            // In a real app we might show this in the UI, 
            // but for now we just let it be or print to a log file if we had one.
            // Using eprintln here might mess up the TUI.
        }
    });

    let mut app = App::new(tx_to_worker, rx_from_worker);
    let res = run_app(&mut terminal, &mut app).await;

    // Cleanup
    let _ = child.kill().await;

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("{:?}", err);
    }

    Ok(())
}

async fn run_app(terminal: &mut Terminal<CrosstermBackend<Stdout>>, app: &mut App) -> Result<()> {
    // We use a poll interval for drawing
    let mut interval = tokio::time::interval(Duration::from_millis(33)); // ~30 FPS

    loop {
        // 1. Draw UI
        terminal.draw(|f| {
            let size = f.size();
            let main_block = Block::default().style(Style::default().bg(DARK_BG));
            f.render_widget(main_block, size);

            match app.state {
                AppState::Splash => {
                    let vertical_chunks = Layout::default()
                        .direction(Direction::Vertical)
                        .constraints([
                            Constraint::Percentage(15), 
                            Constraint::Length(5),      
                            Constraint::Length(15),     
                            Constraint::Length(3),      
                            Constraint::Min(0),         
                        ])
                        .margin(2)
                        .split(size);

                    let header_area = vertical_chunks[1];
                    let header_layout = Layout::default()
                        .direction(Direction::Horizontal)
                        .constraints([
                            Constraint::Fill(1),
                            Constraint::Length(54), 
                            Constraint::Fill(1),
                        ])
                        .split(header_area);
                    
                    let header_text = "Welcome to the Claude Code research preview!";
                    let header = Paragraph::new(Line::from(vec![
                        Span::styled(header_text, Style::default().fg(CLAUDE_ORANGE).add_modifier(Modifier::BOLD)),
                    ]))
                    .block(
                        Block::default()
                            .borders(Borders::ALL)
                            .border_type(BorderType::Rounded)
                            .border_style(Style::default().fg(CLAUDE_ORANGE))
                    )
                    .alignment(Alignment::Center);
                    f.render_widget(header, header_layout[1]);

                    let logo_lines: Vec<Line> = LOGO_TEXT.iter()
                        .map(|line| Line::from(Span::styled(*line, Style::default().fg(CLAUDE_ORANGE))))
                        .collect();
                    let logo = Paragraph::new(Text::from(logo_lines)).alignment(Alignment::Center);
                    f.render_widget(logo, vertical_chunks[2]);

                    let footer_text = Line::from(vec![
                        Span::styled("🎉 Login successful. Press ", Style::default().fg(FOOTER_TEXT)),
                        Span::styled("Enter", Style::default().fg(FOOTER_HIGHLIGHT).add_modifier(Modifier::BOLD)),
                        Span::styled(" to continue", Style::default().fg(FOOTER_TEXT)),
                    ]);
                    let footer = Paragraph::new(footer_text).alignment(Alignment::Center);
                    f.render_widget(footer, vertical_chunks[3]);
                }
                AppState::Chat => {
                    let chunks = Layout::default()
                        .direction(Direction::Vertical)
                        .constraints([
                            Constraint::Min(1), 
                            Constraint::Length(3), 
                        ].as_ref())
                        .split(size);

                    let messages: Vec<ListItem> = app.messages
                        .iter()
                        .map(|m| {
                            let (symbol, style) = match m.msg_type {
                                MessageType::User => (">", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)),
                                MessageType::Thinking => ("⏺", Style::default().fg(Color::Yellow)),
                                MessageType::ToolCall => ("⏺ Call", Style::default().fg(Color::Blue)),
                                MessageType::Output => ("⎿", Style::default().fg(Color::DarkGray)),
                                MessageType::System => ("*", Style::default().fg(Color::Magenta)),
                            };

                            let mut lines = vec![];
                            let first_line_content = m.content.lines().next().unwrap_or("");
                            
                            lines.push(Line::from(vec![
                                Span::styled(symbol, style),
                                Span::raw(" "),
                                Span::styled(first_line_content, if matches!(m.msg_type, MessageType::Output) { Style::default().fg(Color::DarkGray) } else { Style::default() }),
                            ]));

                            for line in m.content.lines().skip(1) {
                                lines.push(Line::from(vec![
                                    Span::raw("  "),
                                    Span::styled(line, if matches!(m.msg_type, MessageType::Output) { Style::default().fg(Color::DarkGray) } else { Style::default() }),
                                ]));
                            }
                            ListItem::new(lines)
                        })
                        .collect();

                    let messages_list = List::new(messages)
                        .block(Block::default().style(Style::default().bg(DARK_BG)));
                    f.render_widget(messages_list, chunks[0]);

                    let input = Paragraph::new(format!("> {}_", app.input))
                        .style(Style::default().fg(Color::White))
                        .block(Block::default().style(Style::default().bg(DARK_BG)));
                    f.render_widget(input, chunks[1]);
                }
            }
        })?;

        // 2. Handle Events (Keyboard + AI Channel)
        tokio::select! {
            _ = interval.tick() => {
                // Just for redraw frequency
            }

            // Handle AI Responses
            Some(response) = app.rx_ai.recv() => {
                // Find the last "Thinking" message and replace it, or append
                if app.waiting_for_response {
                    // Remove the "Thinking..." or just append
                    // For simplicity, we just add the response as Output
                    app.messages.push(Message {
                        content: response,
                        msg_type: MessageType::Output,
                    });
                    app.waiting_for_response = false;
                }
            }

            // Handle Keyboard Input
            // Note: event::poll is sync, but blocking in tokio::select is bad.
            // Ideally we would use EventStream, but for this demo, we can use a very short poll duration
            // inside the loop, effectively checking it on every tick.
            // However, inside select!, we can not easily poll sync functions.
            // 
            // Better approach for select loop:
            // Run input reading in a separate task sending to a channel?
            // Or just poll with 0 timeout here. But select! expects futures.
            //
            // Fallback: We will check event::poll *outside* select! if we use a timeout there?
            // Actually, let us keep it simple: We used a dedicated task for AI.
            // We can just check `app.rx_ai.try_recv()` inside the normal loop.
            // Reverting to the sync loop structure but with try_recv for the async channel.
            else => {} 
        }
        
        // Manual Polling Mix (Sync + Async Channel)
        // Check for AI messages
        while let Ok(response) = app.rx_ai.try_recv() {
             app.messages.push(Message {
                content: response,
                msg_type: MessageType::Output,
            });
            app.waiting_for_response = false;
        }

        // Check for Keyboard
        if event::poll(Duration::from_millis(10))? {
             if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    match app.state {
                        AppState::Splash => {
                             if key.code == KeyCode::Enter {
                                 app.state = AppState::Chat;
                             } else if key.code == KeyCode::Esc || key.code == KeyCode::Char('q') {
                                 return Ok(());
                             }
                        }
                        AppState::Chat => {
                             match key.code {
                                KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => return Ok(()),
                                KeyCode::Enter => {
                                    if app.input.trim().eq_ignore_ascii_case("quit") || app.input.trim().eq_ignore_ascii_case("exit") {
                                        return Ok(());
                                    }
                                    app.submit_message().await;
                                }
                                KeyCode::Char(c) => app.input.push(c),
                                KeyCode::Backspace => { app.input.pop(); },
                                _ => {}
                             }
                        }
                    }
                }
            }
        }
    }
}
