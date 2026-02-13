import React from 'react';

export interface InputProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  focused?: boolean;
  mask?: boolean;
  style?: {
    fg?: number;
    bg?: number;
    bold?: boolean;
    placeholderFg?: number;
  };
  x?: number;
  y?: number;
  width?: number;
  maxLength?: number;
}

/**
 * Input - A text input component
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = '',
  focused = false,
  mask = false,
  style,
  x = 0,
  y = 0,
  width = 20,
  maxLength,
}) => {
  const displayValue = mask ? '*'.repeat(value.length) : value;
  const displayText =
    value.length > 0 ? displayValue : focused ? placeholder : '';

  const props: InputProps = {
    value: displayText,
    onChange,
    placeholder,
    focused,
    mask,
    style: focused
      ? style
      : {
          ...style,
          fg: style?.placeholderFg || 8,
        },
    x,
    y,
    width,
    maxLength,
  };

  return React.createElement('INPUT', props);
};

Input.displayName = 'Input';
