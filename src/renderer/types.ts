/**
 * Terminal cell representation
 */
export interface Cell {
  char: string;
  fg?: number; // Foreground color (ANSI 256 or RGB)
  bg?: number; // Background color
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

/**
 * Terminal buffer - a 2D grid of cells
 */
export class Buffer {
  constructor(
    public width: number,
    public height: number,
    public cells: Cell[][] = []
  ) {
    // Initialize empty buffer
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ char: ' ' }))
    );
  }

  setCell(x: number, y: number, cell: Cell): void {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      this.cells[y][x] = cell;
    }
  }

  getCell(x: number, y: number): Cell | undefined {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      return this.cells[y][x];
    }
    return undefined;
  }

  clear(): void {
    this.cells = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({ char: ' ' }))
    );
  }

  resize(width: number, height: number): void {
    const newCells: Cell[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ char: ' ' }))
    );

    // Copy existing content
    for (let y = 0; y < Math.min(this.height, height); y++) {
      for (let x = 0; x < Math.min(this.width, width); x++) {
        newCells[y][x] = this.cells[y][x];
      }
    }

    this.cells = newCells;
    this.width = width;
    this.height = height;
  }

  clone(): Buffer {
    const newBuffer = new Buffer(this.width, this.height);
    newBuffer.cells = this.cells.map((row) => row.map((cell) => ({ ...cell })));
    return newBuffer;
  }
}

/**
 * Terminal size
 */
export interface Size {
  cols: number;
  rows: number;
}

/**
 * Position in terminal
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Rectangle area
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
