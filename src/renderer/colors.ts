/**
 * ANSI Color palette for terminal UI
 */
export const Colors = {
  // Standard colors
  Black: 0,
  Red: 1,
  Green: 2,
  Yellow: 3,
  Blue: 4,
  Magenta: 5,
  Cyan: 6,
  White: 7,

  // High-intensity colors
  BrightBlack: 8,
  BrightRed: 9,
  BrightGreen: 10,
  BrightYellow: 11,
  BrightBlue: 12,
  BrightMagenta: 13,
  BrightCyan: 14,
  BrightWhite: 15,

  // Semantic aliases
  Foreground: 7,
  Background: 0,
  Primary: 4,
  Secondary: 6,
  Success: 2,
  Warning: 3,
  Error: 1,
  Info: 6,
  Muted: 8,
} as const;

export type Color = (typeof Colors)[keyof typeof Colors];
