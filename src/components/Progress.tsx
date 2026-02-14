import React from 'react';

export interface ProgressProps {
  value: number;
  max?: number;
  style?: {
    fg?: number;
    bg?: number;
    filledFg?: number;
    filledBg?: number;
  };
  x?: number;
  y?: number;
  width?: number;
  label?: string;
}

/**
 * Progress - A progress bar component
 */
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  style,
  x = 0,
  y = 0,
  width = 20,
  label,
}) => {
  const props: ProgressProps = {
    value,
    max,
    style,
    x,
    y,
    width,
    label,
  };

  return React.createElement('PROGRESS', props);
};

Progress.displayName = 'Progress';
