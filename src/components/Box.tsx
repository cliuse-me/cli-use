import React from 'react';

export interface BoxProps {
  children?: React.ReactNode;
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
  width?: number;
  height?: number;
  border?: boolean;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  padding?: number;
}

/**
 * Box - A flexible container component for layout
 */
export const Box: React.FC<BoxProps> = ({
  children,
  style,
  x = 0,
  y = 0,
  width,
  height,
  border = false,
  flexDirection = 'column',
  justifyContent = 'flex-start',
  alignItems = 'flex-start',
  padding = 0,
}) => {
  const props: BoxProps = {
    children,
    style,
    x,
    y,
    width,
    height,
    border,
    flexDirection,
    justifyContent,
    alignItems,
    padding,
  };

  return React.createElement('BOX', props, children);
};

Box.displayName = 'Box';
