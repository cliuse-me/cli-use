import { useCallback, useEffect, useState } from 'react';

/**
 * useStdoutDimensions - Hook for getting terminal dimensions
 */
export const useStdoutDimensions = () => {
  const [dimensions, setDimensions] = useState(() => ({
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        columns: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
      });
    };

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  return dimensions;
};

/**
 * useStdout - Hook for stdout operations
 */
export const useStdout = () => {
  const write = useCallback((data: string) => {
    process.stdout.write(data);
  }, []);

  return { write };
};
