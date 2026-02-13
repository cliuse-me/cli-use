import { useEffect, useCallback } from 'react';

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
export const useInput = (callback: InputCallback, deps: any[] = []) => {
  useEffect(() => {
    const readline = require('node:readline');

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

    process.stdin.setRawMode(true);
    readline.emitKeypressEvents(process.stdin);

    process.stdin.on('keypress', handler);

    return () => {
      process.stdin.off('keypress', handler);
    };
  }, [callback, ...deps]);
};

/**
 * useKey - Hook for capturing specific key presses
 */
export const useKey = (
  keyName: string | string[],
  callback: () => void,
  deps: any[] = []
) => {
  const keys = Array.isArray(keyName) ? keyName : [keyName];

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
