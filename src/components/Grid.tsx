import React from 'react';

export interface GridProps {
  children?: React.ReactNode;
  columns?: number;
  rows?: number;
  gap?: number;
  style?: {
    fg?: number;
    bg?: number;
    bold?: boolean;
    dim?: boolean;
  };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Grid - A grid layout component
 */
export const Grid: React.FC<GridProps> = ({
  children,
  columns = 2,
  rows,
  gap = 1,
  style,
  x = 0,
  y = 0,
  width,
  height,
}) => {
  const props: GridProps = {
    children,
    columns,
    rows,
    gap,
    style,
    x,
    y,
    width,
    height,
  };

  return React.createElement('GRID', props, children);
};

Grid.displayName = 'Grid';
