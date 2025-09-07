import { useRef } from 'react';
import { SOUND_PATHS } from '../lib/utils';

export function useSoundEffects() {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const play = (type: keyof typeof SOUND_PATHS, volume = 1) => {
    if (!audioRefs.current[type]) {
      audioRefs.current[type] = new Audio(SOUND_PATHS[type]);
    }
    audioRefs.current[type].volume = volume;
    audioRefs.current[type].currentTime = 0;
    audioRefs.current[type].play();
  };

  const stop = (type: keyof typeof SOUND_PATHS) => {
    if (audioRefs.current[type]) {
      audioRefs.current[type].pause();
      audioRefs.current[type].currentTime = 0;
    }
  };

  return { play, stop };
}
