use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Alignment, Constraint, Direction, Layout},
    style::{Color, Style, Stylize},
    text::{Line, Span, Text},
    widgets::{Block, BorderType, Borders, Paragraph},
    Terminal,
};
use std::io::{stdout, Stdout};
use std::time::Duration;

// --- Colors ---
// Using custom RGB colors for the "Claude Code" theme
const CLAUDE_ORANGE: Color = Color::Rgb(217, 119, 87); // Coral/Burnt Orange (#D97757)
const DARK_BG: Color = Color::Rgb(21, 21, 21); // Dark Gray (#151515)
const FOOTER_TEXT: Color = Color::Rgb(112, 128, 144); // Slate Blue/Gray (#708090)
const FOOTER_HIGHLIGHT: Color = Color::Rgb(255, 255, 255); // White (#FFFFFF)

fn main() -> Result<()> {
    enable_raw_mode()?;
    let mut stdout = stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let res = run_app(&mut terminal);

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("{:?}", err);
    }

    Ok(())
}

fn run_app(terminal: &mut Terminal<CrosstermBackend<Stdout>>) -> Result<()> {
    loop {
        terminal.draw(|f| {
            let size = f.size();
            
            // Main block with dark background
            let main_block = Block::default().style(Style::default().bg(DARK_BG));
            f.render_widget(main_block, size);

            // Create a vertical layout with percentage constraints
            let chunks = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Percentage(20), // Top spacing
                    Constraint::Length(5),      // Header Box
                    Constraint::Length(10),     // Logo Area
                    Constraint::Length(3),      // Footer
                    Constraint::Min(0),         // Remaining space
                ])
                .margin(2)
                .split(size);

            // --- Header ---
            let header_text = "* Welcome to the Claude Code research preview!";
            let header = Paragraph::new(Line::from(vec![
                Span::styled(header_text, Style::default().fg(CLAUDE_ORANGE).add_modifier(ratatui::style::Modifier::BOLD)),
            ]))
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .border_type(BorderType::Rounded)
                    .border_style(Style::default().fg(CLAUDE_ORANGE))
            )
            .alignment(Alignment::Center);
            
            f.render_widget(header, chunks[1]);

            // --- Logo ---
            // Constructing "CLAUDE" and "CODE" with block characters
            // Let's create a custom ASCII art style using blocks
            // Note: This is a simplified "chunky" representation
            let logo_art = vec![
                " ██████  ██       ██████  ██   ██ ██████  ███████",
                "██       ██      ██    ██ ██   ██ ██   ██ ██     ",
                "██       ██      ████████ ██   ██ ██   ██ █████  ",
                "██       ██      ██    ██ ██   ██ ██   ██ ██     ",
                " ██████  ███████ ██    ██  ██████ ██████  ███████",
                "",
                "        ██████   ██████  ██████  ███████        ",
                "       ██       ██    ██ ██   ██ ██             ",
                "       ██       ██    ██ ██   ██ █████          ",
                "       ██       ██    ██ ██   ██ ██             ",
                "        ██████   ██████  ██████  ███████        ",
            ];

            // Convert strings to styled text
            let logo_lines: Vec<Line> = logo_art.iter().map(|line| {
                Line::from(Span::styled(*line, Style::default().fg(CLAUDE_ORANGE).add_modifier(ratatui::style::Modifier::BOLD)))
            }).collect();
            
            let logo = Paragraph::new(Text::from(logo_lines))
                .alignment(Alignment::Center);

            f.render_widget(logo, chunks[2]);

            // --- Footer ---
            let footer_text = Line::from(vec![
                Span::styled("🎉 Login successful. Press ", Style::default().fg(FOOTER_TEXT)),
                Span::styled("Enter", Style::default().fg(FOOTER_HIGHLIGHT).add_modifier(ratatui::style::Modifier::BOLD)),
                Span::styled(" to continue", Style::default().fg(FOOTER_TEXT)),
            ]);

            let footer = Paragraph::new(footer_text)
                .alignment(Alignment::Center);

            f.render_widget(footer, chunks[3]);

        })?;

        // Handle events
        if event::poll(Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    match key.code {
                        KeyCode::Enter | KeyCode::Esc | KeyCode::Char('q') => return Ok(()),
                        KeyCode::Char('c') if key.modifiers.contains(event::KeyModifiers::CONTROL) => return Ok(()),
                        _ => {}
                    }
                }
            }
        }
    }
}
