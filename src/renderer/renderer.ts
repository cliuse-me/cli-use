import { Buffer, Size } from './types.js';
import { Terminal } from './terminal.js';

/**
 * Renderer - manages the rendering lifecycle
 */
export class Renderer {
  private terminal: Terminal;
  private buffer?: Buffer;
  private previousBuffer?: Buffer;
  private currentSize: Size;
  private running = false;

  constructor(terminal = new Terminal()) {
    this.terminal = terminal;
    this.currentSize = terminal.size;
  }

  /**
   * Start the renderer
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    // Setup terminal
    this.terminal.enableRawMode();
    this.terminal.enableAlternateScreen();
    this.terminal.hideCursor();
    this.terminal.clear();

    // Initialize buffer
    this.buffer = new Buffer(this.currentSize.cols, this.currentSize.rows);

    // Handle resize
    this.terminal.onResize((size) => {
      this.currentSize = size;
      this.buffer?.resize(size.cols, size.rows);
    });
  }

  /**
   * Stop the renderer
   */
  stop(): void {
    if (!this.running) return;
    this.running = false;

    this.terminal.restore();
  }

  /**
   * Get a writable buffer for the current frame
   */
  getBuffer(): Buffer {
    if (!this.buffer) {
      throw new Error('Renderer not started');
    }
    return this.buffer;
  }

  /**
   * Present the current buffer to the terminal
   */
  present(): void {
    if (!this.buffer) return;

    // For now, just write the entire buffer
    // TODO: Implement differential rendering for performance
    this.terminal.write(this.buffer);

    // Store for next frame comparison
    this.previousBuffer = this.buffer.clone();

    // Clear buffer for next frame
    this.buffer.clear();
  }

  /**
   * Get the current terminal size
   */
  getSize(): Size {
    return this.currentSize;
  }

  /**
   * Get the terminal instance for direct access
   */
  getTerminal(): Terminal {
    return this.terminal;
  }
}
