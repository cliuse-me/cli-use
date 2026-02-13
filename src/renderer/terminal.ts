import type { ReadStream, WriteStream } from 'node:tty';
import { Buffer, Size } from './types.js';
import * as readline from 'node:readline';

type ProcessStdin = ReadStream & NodeJS.ReadStream;
type ProcessStdout = WriteStream & NodeJS.WriteStream;

/**
 * ANSI escape codes for terminal control
 */
export const ANSI = {
  // Screen control
  CLEAR_SCREEN: '\x1b[2J',
  RESET_CURSOR: '\x1b[H',
  ALTERNATE_SCREEN_ENABLE: '\x1b[?1049h',
  ALTERNATE_SCREEN_DISABLE: '\x1b[?1049l',

  // Cursor control
  HIDE_CURSOR: '\x1b[?25l',
  SHOW_CURSOR: '\x1b[?25h',
  MOVE_CURSOR: (x: number, y: number) => `\x1b[${y + 1};${x + 1}H`,

  // Colors
  RESET_STYLE: '\x1b[0m',
  FG_COLOR_256: (color: number) => `\x1b[38;5;${color}m`,
  BG_COLOR_256: (color: number) => `\x1b[48;5;${color}m`,
  FG_COLOR_RGB: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  BG_COLOR_RGB: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,

  // Text styles
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  ITALIC: '\x1b[3m',
  UNDERLINE: '\x1b[4m',
  STRIKETHROUGH: '\x1b[9m',

  // Reset individual styles
  BOLD_OFF: '\x1b[22m',
  DIM_OFF: '\x1b[22m',
  ITALIC_OFF: '\x1b[23m',
  UNDERLINE_OFF: '\x1b[24m',
  STRIKETHROUGH_OFF: '\x1b[29m',
} as const;

/**
 * Terminal interface - handles low-level terminal I/O
 */
export class Terminal {
  private stdin: ProcessStdin;
  private stdout: ProcessStdout;
  private _size: Size;
  private rawMode = false;
  private alternateScreen = false;

  constructor(stdin: ProcessStdin = process.stdin as ProcessStdin, stdout: ProcessStdout = process.stdout as ProcessStdout) {
    this.stdin = stdin;
    this.stdout = stdout;
    this._size = { cols: stdout.columns || 80, rows: stdout.rows || 24 };
  }

  get size(): Size {
    return this._size;
  }

  /**
   * Enable raw mode for character-by-character input
   */
  enableRawMode(): void {
    if (this.rawMode) return;
    this.rawMode = true;
    readline.emitKeypressEvents(this.stdin);
    (this.stdin as NodeJS.ReadStream).setRawMode(true);
  }

  /**
   * Disable raw mode
   */
  disableRawMode(): void {
    if (!this.rawMode) return;
    this.rawMode = false;
    (this.stdin as NodeJS.ReadStream).setRawMode(false);
  }

  /**
   * Enable alternate screen buffer
   */
  enableAlternateScreen(): void {
    if (this.alternateScreen) return;
    this.alternateScreen = true;
    this.stdout.write(ANSI.ALTERNATE_SCREEN_ENABLE);
  }

  /**
   * Disable alternate screen buffer
   */
  disableAlternateScreen(): void {
    if (!this.alternateScreen) return;
    this.alternateScreen = false;
    this.stdout.write(ANSI.ALTERNATE_SCREEN_DISABLE);
  }

  /**
   * Hide cursor
   */
  hideCursor(): void {
    this.stdout.write(ANSI.HIDE_CURSOR);
  }

  /**
   * Show cursor
   */
  showCursor(): void {
    this.stdout.write(ANSI.SHOW_CURSOR);
  }

  /**
   * Clear the entire screen
   */
  clear(): void {
    this.stdout.write(ANSI.CLEAR_SCREEN + ANSI.RESET_CURSOR);
  }

  /**
   * Write buffer to terminal
   */
  write(buffer: Buffer): void {
    let output = ANSI.RESET_STYLE;
    let lastStyle: string | null = null;

    for (let y = 0; y < buffer.height; y++) {
      for (let x = 0; x < buffer.width; x++) {
        const cell = buffer.getCell(x, y);
        if (!cell) continue;

        // Build style string
        const style = this.buildStyleString(cell);
        if (style !== lastStyle) {
          output += style;
          lastStyle = style;
        }

        // Add character
        output += cell.char;
      }
      // New line after each row
      output += '\r\n';
    }

    this.stdout.write(output);
  }

  /**
   * Build ANSI style string from cell
   */
  private buildStyleString(cell: { fg?: number; bg?: number; bold?: boolean; dim?: boolean }): string {
    let style = '';

    if (cell.fg !== undefined) {
      style += ANSI.FG_COLOR_256(cell.fg);
    }
    if (cell.bg !== undefined) {
      style += ANSI.BG_COLOR_256(cell.bg);
    }
    if (cell.bold) {
      style += ANSI.BOLD;
    }
    if (cell.dim) {
      style += ANSI.DIM;
    }

    return style;
  }

  /**
   * Set up SIGWINCH handler for terminal resize
   */
  onResize(callback: (size: Size) => void): () => void {
    const handler = () => {
      this._size = { cols: this.stdout.columns || 80, rows: this.stdout.rows || 24 };
      callback(this._size);
    };

    process.on('SIGWINCH', handler);

    return () => {
      process.off('SIGWINCH', handler);
    };
  }

  /**
   * Set up input handler
   */
  onInput(callback: (chunk: Buffer, key: readline.Key) => void): () => void {
    const handler = (chunk: Buffer, key: readline.Key) => {
      callback(chunk, key);
    };

    this.stdin.on('keypress', handler as any);

    return () => {
      this.stdin.off('keypress', handler as any);
    };
  }

  /**
   * Clean up terminal state
   */
  restore(): void {
    this.showCursor();
    this.disableAlternateScreen();
    this.disableRawMode();
    this.stdout.write(ANSI.RESET_STYLE);
  }
}
