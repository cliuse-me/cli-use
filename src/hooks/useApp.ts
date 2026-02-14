import { Renderer } from '../renderer/index.js';
import { useEffect, useState, useRef } from 'react';

interface AppOptions {
  fullscreen?: boolean;
  alternateScreen?: boolean;
  mouseCapture?: boolean;
}

/**
 * useApp - Hook for managing the application lifecycle
 */
export const useApp = (_options: AppOptions = {}) => {
  const rendererRef = useRef<Renderer | null>(null);
  const [size] = useState({ cols: 80, rows: 24 });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Note: Renderer is not fully implemented yet, this is a skeleton
    // const renderer = new Renderer();
    // rendererRef.current = renderer;
    //
    // renderer.start();
    //
    // // Set initial size
    // setSize(renderer.getSize());
    //
    // // Setup resize handler
    // const cleanupResize = renderer.getTerminal().onResize((newSize) => {
    //   setSize(newSize);
    // });
    //
    // setRunning(true);

    const cleanupResize = () => {
      // Cleanup function
    };

    setRunning(true);

    return () => {
      setRunning(false);
      cleanupResize();
      // renderer.stop();
    };
  }, []);

  const exit = () => {
    if (rendererRef.current) {
      // rendererRef.current.stop();
      setRunning(false);
    }
  };

  return {
    renderer: rendererRef.current,
    size,
    running,
    exit,
  };
};
