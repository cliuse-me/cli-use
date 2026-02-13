import stringWidth from 'string-width';

/**
 * Measure the display width of text in terminal cells
 */
export function measureText(text: string): number {
  return stringWidth(text);
}

/**
 * Truncate text to fit within a given width
 */
export function truncateText(text: string, maxWidth: number): string {
  const width = measureText(text);

  if (width <= maxWidth) {
    return text;
  }

  // Simple truncation with ellipsis
  const ellipsis = '…';
  const ellipsisWidth = measureText(ellipsis);

  let truncated = text;
  let currentWidth = width;

  for (let i = text.length - 1; i >= 0; i--) {
    if (currentWidth - ellipsisWidth <= maxWidth) {
      break;
    }

    const char = text[i];
    currentWidth -= measureText(char);
    truncated = text.slice(0, i);
  }

  return truncated + ellipsis;
}

/**
 * Wrap text to fit within a given width
 */
export function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;

  for (const word of words) {
    const wordWidth = measureText(word);

    if (currentWidth + wordWidth + (currentLine ? 1 : 0) <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
      currentWidth += wordWidth + (currentLine ? 1 : 0) - wordWidth;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
      currentWidth = wordWidth;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
