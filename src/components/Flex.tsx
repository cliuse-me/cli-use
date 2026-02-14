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
export const Flex: React.FC<FlexProps> = ({ children, ...boxProps }) => {
  const props: BoxProps & FlexProps = {
    ...boxProps,
    children,
  };

  return React.createElement('FLEX', props);
};

Flex.displayName = 'Flex';
