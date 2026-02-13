/**
 * Default configuration values
 */
export const DEFAULTS = {
  TERMINAL_WIDTH: 80,
  TERMINAL_HEIGHT: 24,
  DEFAULT_FG_COLOR: 7,
  DEFAULT_BG_COLOR: 0,
  DEFAULT_PADDING: 0,
  TAB_SIZE: 4,
} as const;

/**
 * Key codes
 */
export const KEYS = {
  ENTER: 'enter',
  ESCAPE: 'escape',
  TAB: 'tab',
  BACKSPACE: 'backspace',
  DELETE: 'delete',
  SPACE: 'space',
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  HOME: 'home',
  END: 'end',
  PAGE_UP: 'pageup',
  PAGE_DOWN: 'pagedown',
} as const;

/**
 * Common ANSI escape sequences
 */
export const ANSI_SEQUENCES = {
  CLEAR_SCREEN: '\x1b[2J',
  RESET_CURSOR: '\x1b[H',
  HIDE_CURSOR: '\x1b[?25l',
  SHOW_CURSOR: '\x1b[?25h',
  ALT_SCREEN_ENABLE: '\x1b[?1049h',
  ALT_SCREEN_DISABLE: '\x1b[?1049l',
  RESET_STYLE: '\x1b[0m',
} as const;
