import { useEffect } from 'react';

type ShortcutHandler = (event: KeyboardEvent) => void;

export function useKeyboardShortcuts(handlers: { [combo: string]: ShortcutHandler }) {
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const combo = [event.ctrlKey ? 'Ctrl' : '', event.key].filter(Boolean).join('+');
      if (handlers[combo]) {
        handlers[combo](event);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handlers]);
}
