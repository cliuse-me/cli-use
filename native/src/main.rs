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

enum MessageType {
    User,
    Thinking,
    ToolCall,
    Output,
    System,
}

struct Message {
    content: String,
    msg_type: MessageType,
}

struct App {
    state: AppState,
    input: String,
    messages: Vec<Message>,
}

impl App {
    fn new() -> App {
        App {
            state: AppState::Splash,
            input: String::new(),
            messages: vec![
                Message {
                    content: "Welcome to CLI CODE.".to_string(),
                    msg_type: MessageType::System,
                },
                Message {
                    content: "I am ready to assist. Type 'help' for commands.".to_string(),
                    msg_type: MessageType::System,
                },
            ],
        }
    }

    fn submit_message(&mut self) {
        if self.input.trim().is_empty() {
            return;
        }

        self.messages.push(Message {
            content: self.input.clone(),
            msg_type: MessageType::User,
        });

        let cmd = self.input.trim().to_lowercase();
        self.input.clear();

        match cmd.as_str() {
            "status" => {
                self.messages.push(Message {
                    content: "Checking project status...".to_string(),
                    msg_type: MessageType::Thinking,
                });
                self.messages.push(Message {
                    content: "git status".to_string(),
                    msg_type: MessageType::ToolCall,
                });
                self.messages.push(Message {
                    content: "On branch main\nYour branch is up to date with origin/main.".to_string(),
                    msg_type: MessageType::Output,
                });
            }
            "analyze" => {
                self.messages.push(Message {
                    content: "Analyzing codebase structure...".to_string(),
                    msg_type: MessageType::Thinking,
                });
                self.messages.push(Message {
                    content: "ls -R src".to_string(),
                    msg_type: MessageType::ToolCall,
                });
                self.messages.push(Message {
                    content: "src/cli\nsrc/components\nsrc/hooks".to_string(),
                    msg_type: MessageType::Output,
                });
            }
            "help" => {
                 self.messages.push(Message {
                    content: "Available commands: status, analyze, help, exit".to_string(),
                    msg_type: MessageType::Output,
                });
            }
            "quit" | "exit" => {
                // Handled in main loop
            }
            _ => {
                self.messages.push(Message {
                    content: "I'm thinking about that...".to_string(),
                    msg_type: MessageType::Thinking,
                });
                self.messages.push(Message {
                    content: format!("echo Processing: {}", cmd),
                    msg_type: MessageType::ToolCall,
                });
                self.messages.push(Message {
                    content: "Done.".to_string(),
                    msg_type: MessageType::Output,
                });
            }
        }
    }
}

// --- Main Execution ---

fn main() -> Result<()> {
    enable_raw_mode()?;
    let mut stdout = stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new();
    let res = run_app(&mut terminal, &mut app);

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("{:?}", err);
    }

    Ok(())
}

fn run_app(terminal: &mut Terminal<CrosstermBackend<Stdout>>, app: &mut App) -> Result<()> {
    loop {
        terminal.draw(|f| {
            let size = f.size();
            // Background for entire app
            let main_block = Block::default().style(Style::default().bg(DARK_BG));
            f.render_widget(main_block, size);

            match app.state {
                AppState::Splash => {
                    let vertical_chunks = Layout::default()
                        .direction(Direction::Vertical)
                        .constraints([
                            Constraint::Percentage(15), // Top spacing
                            Constraint::Length(5),      // Header
                            Constraint::Length(15),     // Logo
                            Constraint::Length(3),      // Footer
                            Constraint::Min(0),         // Bottom spacing
                        ])
                        .margin(2)
                        .split(size);

                    // --- Header (Centered Horizontal Box) ---
                    let header_area = vertical_chunks[1];
                    let header_layout = Layout::default()
                        .direction(Direction::Horizontal)
                        .constraints([
                            Constraint::Fill(1),
                            Constraint::Length(54), // Fixed width for "Welcome..." box
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

                    // --- Logo (Full Width Center) ---
                    let logo_lines: Vec<Line> = LOGO_TEXT.iter()
                        .map(|line| Line::from(Span::styled(*line, Style::default().fg(CLAUDE_ORANGE))))
                        .collect();
                    
                    let logo = Paragraph::new(Text::from(logo_lines))
                        .alignment(Alignment::Center);
                        
                    f.render_widget(logo, vertical_chunks[2]);

                    // --- Footer ---
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
                            Constraint::Min(1), // Messages
                            Constraint::Length(3), // Input
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

        if event::poll(Duration::from_millis(100))? {
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
                                    app.submit_message();
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
