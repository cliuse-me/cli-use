import { useState, useCallback } from 'react';

interface ListOptions<T> {
  initialItems?: T[];
  initialIndex?: number;
  loop?: boolean;
}

/**
 * useList - Hook for managing list navigation
 */
export const useList = <T>({
  initialItems = [],
  initialIndex = 0,
  loop = true,
}: ListOptions<T> = {}) => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [index, setIndex] = useState(initialIndex);

  const next = useCallback(() => {
    setIndex((current) => {
      if (items.length === 0) return 0;

      const nextIndex = current + 1;

      if (nextIndex >= items.length) {
        return loop ? 0 : items.length - 1;
      }

      return nextIndex;
    });
  }, [items.length, loop]);

  const previous = useCallback(() => {
    setIndex((current) => {
      if (items.length === 0) return 0;

      const prevIndex = current - 1;

      if (prevIndex < 0) {
        return loop ? items.length - 1 : 0;
      }

      return prevIndex;
    });
  }, [items.length, loop]);

  const select = useCallback((item: T) => {
    const newIndex = items.indexOf(item);
    if (newIndex !== -1) {
      setIndex(newIndex);
    }
  }, [items]);

  const selectedIndex = index;
  const selectedItem = items[index] ?? null;

  return {
    items,
    setItems,
    index: selectedIndex,
    setIndex,
    selectedItem,
    next,
    previous,
    select,
  };
};
