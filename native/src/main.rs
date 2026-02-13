use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode, KeyEventKind, KeyModifiers},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Alignment, Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
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
const INPUT_BG: Color = Color::Rgb(30, 30, 30); // Slightly lighter than background for input area
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
    #[allow(dead_code)]
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
    // Add scroll tracking
    scroll_offset: usize,
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
            scroll_offset: 0,
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

    // Get worker path from arguments
    let args: Vec<String> = std::env::args().collect();
    let worker_path = if args.len() > 1 {
        args[1].clone()
    } else {
        // Fallback for dev mode
        "scripts/ai-worker.ts".to_string()
    };

    // --- Spawn Node.js AI Worker ---
    let (tx_to_worker, mut rx_from_ui) = mpsc::channel::<String>(100);
    let (tx_to_ui, rx_from_worker) = mpsc::channel::<String>(100);

    // Determine command based on extension
    let cmd_exec = if worker_path.ends_with(".ts") { 
        "tsx" 
    } else {
        "node"
    };

    let mut child = Command::new(cmd_exec)
        .arg(&worker_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to spawn Node.js AI worker");

    let mut stdin = child.stdin.take().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let stderr = child.stderr.take().expect("Failed to open stderr");

    // Task: Write to Node process
    tokio::spawn(async move {
        while let Some(prompt) = rx_from_ui.recv().await {
            if let Err(e) = stdin.write_all(format!("{}\n", prompt).as_bytes()).await {
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
            let _ = tx_to_ui_clone.send(line.replace("\\n", "\n")).await;
        }
    });
    
    // Task: Log stderr
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(_line)) = reader.next_line().await {
             // Ignore stderr for now
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
    let mut interval = tokio::time::interval(Duration::from_millis(33));

    loop {
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
                            Constraint::Length(5),      // Header
                            Constraint::Length(15),     // Logo
                            Constraint::Min(1),         // Spacer
                            Constraint::Length(3),      // Input
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

                    // Render Input on Splash Screen
                    let input_text = format!("> {}_", app.input);
                    let input = Paragraph::new(input_text)
                        .style(Style::default().fg(Color::White).add_modifier(Modifier::BOLD)) // Bold White font
                        .block(Block::default()
                            .borders(Borders::ALL)
                            .border_style(Style::default().fg(Color::DarkGray))
                            .style(Style::default().bg(INPUT_BG))); // Darker Background
                    f.render_widget(input, vertical_chunks[4]);
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
                    
                    // Simple auto-scroll
                    let mut state = ratatui::widgets::ListState::default();
                    if !app.messages.is_empty() {
                         state.select(Some(app.messages.len() - 1));
                    }
                    
                    f.render_stateful_widget(messages_list, chunks[0], &mut state);

                    let input = Paragraph::new(format!("> {}_", app.input))
                        .style(Style::default().fg(Color::White).add_modifier(Modifier::BOLD)) // Bold White font
                        .block(Block::default()
                            .borders(Borders::TOP) // Separator line
                            .border_style(Style::default().fg(Color::DarkGray))
                            .style(Style::default().bg(INPUT_BG))); // Darker Background
                    f.render_widget(input, chunks[1]);
                }
            }
        })?;

        // 2. Handle Events (Keyboard + AI Channel)
        tokio::select! {
            _ = interval.tick() => {
                // Just for redraw frequency
            }

            else => {} 
        }
        
        while let Ok(response) = app.rx_ai.try_recv() {
             // Remove the thinking message if it exists
             if app.waiting_for_response {
                 if let Some(last) = app.messages.last() {
                     if matches!(last.msg_type, MessageType::Thinking) {
                         app.messages.pop();
                     }
                 }
                 app.waiting_for_response = false;
             }
             
             app.messages.push(Message {
                content: response,
                msg_type: MessageType::Output,
            });
        }

        if event::poll(Duration::from_millis(10))? {
             if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    match app.state {
                        AppState::Splash => {
                             match key.code {
                                KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => return Ok(()),
                                KeyCode::Enter => {
                                    if !app.input.trim().is_empty() {
                                        app.state = AppState::Chat;
                                        app.submit_message().await;
                                    } else {
                                        app.state = AppState::Chat;
                                    }
                                }
                                KeyCode::Char(c) => app.input.push(c),
                                KeyCode::Backspace => { app.input.pop(); },
                                KeyCode::Esc => return Ok(()),
                                _ => {}
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
