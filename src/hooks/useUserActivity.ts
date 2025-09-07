import { useEffect, useState } from 'react';

export function useUserActivity(inactiveDelay = 60000) {
  const [isInactive, setIsInactive] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const reset = () => {
      setIsInactive(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsInactive(true), inactiveDelay);
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    reset();
    return () => {
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      clearTimeout(timeout);
    };
  }, [inactiveDelay]);
  return isInactive;
}
