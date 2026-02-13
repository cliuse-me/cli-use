import { useState, useCallback, useRef, useEffect } from 'react';

interface FocusableElement {
  id: string;
  index: number;
}

interface KeyPressEvent {
  name?: string;
}

/**
 * useFocus - Hook for managing focus state in forms and lists
 */
export const useFocus = (initialFocus = 0, itemCount: number) => {
  const [focusedIndex, setFocusedIndex] = useState(initialFocus);
  const focusableRefs = useRef<Map<number, HTMLElement>>(new Map());

  const focusNext = useCallback(() => {
    setFocusedIndex((current) => (current + 1) % itemCount);
  }, [itemCount]);

  const focusPrevious = useCallback(() => {
    setFocusedIndex((current) => (current - 1 + itemCount) % itemCount);
  }, [itemCount]);

  const setFocus = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setFocusedIndex(index);
    }
  }, [itemCount]);

  const isFocused = useCallback(
    (index: number) => index === focusedIndex,
    [focusedIndex]
  );

  // Keyboard navigation
  useEffect(() => {
    const readline = require('node:readline');
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    const handleKeyPress = (_chunk: Buffer, key: KeyPressEvent) => {
      if (key.name === 'tab' || key.name === 'right') {
        focusNext();
      } else if (key.name === 'left') {
        focusPrevious();
      }
    };

    process.stdin.on('keypress', handleKeyPress);

    return () => {
      process.stdin.off('keypress', handleKeyPress);
    };
  }, [focusNext, focusPrevious]);

  return {
    focusedIndex,
    focusNext,
    focusPrevious,
    setFocus,
    isFocused,
  };
};
