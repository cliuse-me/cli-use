import { useEffect, useCallback, DependencyList, useMemo } from 'react';
import readline from 'node:readline';

interface InputEvent {
  key: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  sequence: string;
}

interface ReadlineKey {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  sequence?: string;
}

type InputCallback = (input: InputEvent) => void;

/**
 * useInput - Hook for capturing keyboard input
 */
export const useInput = (callback: InputCallback, deps: DependencyList = []) => {
  useEffect(() => {
    const handler = (chunk: Buffer, key: ReadlineKey) => {
      if (!key) return;

      callback({
        key: key.name || '',
        name: key.name || '',
        ctrl: key.ctrl || false,
        meta: key.meta || false,
        shift: key.shift || false,
        sequence: key.sequence || '',
      });
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    readline.emitKeypressEvents(process.stdin);

    process.stdin.on('keypress', handler);

    return () => {
      process.stdin.off('keypress', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps]);
};

/**
 * useKey - Hook for capturing specific key presses
 */
export const useKey = (
  keyName: string | string[],
  callback: () => void,
  deps: DependencyList = []
) => {
  const keyNameString = Array.isArray(keyName) ? keyName.join(',') : keyName;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const keys = useMemo(() => (Array.isArray(keyName) ? keyName : [keyName]), [keyNameString]);

  useInput(
    useCallback(
      ({ key, ctrl, meta }) => {
        // Don't trigger if modifier keys are pressed (unless specified)
        if (ctrl || meta) return;

        if (keys.includes(key)) {
          callback();
        }
      },
      [callback, keys]
    ),
    deps
  );
};
