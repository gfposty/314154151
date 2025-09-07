import { useEffect, useRef } from 'react';

export function useAutoSave<T>(key: string, value: T, delay = 500) {
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handler = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, delay);
    return () => clearTimeout(handler);
  }, [key, value, delay]);
}
