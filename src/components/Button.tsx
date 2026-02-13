import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  focused?: boolean;
  style?: {
    fg?: number;
    bg?: number;
    bold?: boolean;
    focusedFg?: number;
    focusedBg?: number;
  };
  x?: number;
  y?: number;
}

/**
 * Button - A clickable button component
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  focused = false,
  style,
  x = 0,
  y = 0,
}) => {
  // Use focused style if focused
  const activeStyle = focused
    ? {
        ...style,
        fg: style?.focusedFg || style?.fg || 0,
        bg: style?.focusedBg || style?.bg || 7,
      }
    : style;

  const props: ButtonProps = {
    children: `[ ${children} ]`,
    onClick,
    focused,
    style: activeStyle,
    x,
    y,
  };

  return React.createElement('BUTTON', props);
};

Button.displayName = 'Button';
