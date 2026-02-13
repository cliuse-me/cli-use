import { useEffect, useRef } from 'react';

/**
 * useInterval - Hook for setting up intervals
 */
export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();

    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
};

/**
 * useTimeout - Hook for setting up timeouts
 */
export const useTimeout = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();

    const id = setTimeout(tick, delay);

    return () => clearTimeout(id);
  }, [delay]);
};
