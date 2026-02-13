import React from 'react';

export interface TextProps {
  children: React.ReactNode;
  style?: {
    fg?: number;
    bg?: number;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  x?: number;
  y?: number;
}

/**
 * Text - A text component
 */
export const Text: React.FC<TextProps> = ({ children, style, x = 0, y = 0 }) => {
  const props: TextProps = {
    children: String(children),
    style,
    x,
    y,
  };

  return React.createElement('TEXT', props);
};

Text.displayName = 'Text';
