import { useState, useCallback } from 'react';

type AppState = 'idle' | 'loading' | 'success' | 'error';

/**
 * useAppState - Hook for managing application state
 */
export const useAppState = (initialState: AppState = 'idle') => {
  const [state, setState] = useState<AppState>(initialState);
  const [error, setError] = useState<Error | null>(null);

  const setLoading = useCallback(() => {
    setState('loading');
    setError(null);
  }, []);

  const setSuccess = useCallback(() => {
    setState('success');
    setError(null);
  }, []);

  const setErrorState = useCallback((err: Error) => {
    setState('error');
    setError(err);
  }, []);

  const setIdle = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isIdle = state === 'idle';

  return {
    state,
    error,
    isLoading,
    isSuccess,
    isError,
    isIdle,
    setLoading,
    setSuccess,
    setError: setErrorState,
    setIdle,
  };
};
