import React from 'react';
import { BoxProps } from './Box.js';

export interface FlexProps extends BoxProps {
  grow?: number;
  shrink?: number;
  basis?: number;
}

/**
 * Flex - A flex container for flexible layouts
 */
export const Flex: React.FC<FlexProps> = ({
  children,
  grow = 0,
  shrink = 1,
  basis = 'auto',
  ...boxProps
}) => {
  const props: BoxProps = {
    ...boxProps,
    children,
  };

  return React.createElement('FLEX', props);
};

Flex.displayName = 'Flex';
