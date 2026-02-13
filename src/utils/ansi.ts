/**
 * Strip ANSI escape codes from a string
 */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Check if a string contains ANSI codes
 */
export function hasAnsi(text: string): boolean {
  return /\x1b\[[0-9;]*m/.test(text);
}

/**
 * Get the visible length of text (excluding ANSI codes)
 */
export function getVisibleLength(text: string): number {
  return stripAnsi(text).length;
}
