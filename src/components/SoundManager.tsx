import React, { createContext, useContext, useState } from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface SoundManagerContextProps {
  play: (type: string, volume?: number) => void;
  stop: (type: string) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
}

const SoundManagerContext = createContext<SoundManagerContextProps | undefined>(undefined);

export const SoundManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { play, stop } = useSoundEffects();
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const playSound = (type: string, v?: number) => {
    if (!muted) play(type as any, v ?? volume);
  };

  return (
    <SoundManagerContext.Provider value={{ play: playSound, stop, muted, setMuted, volume, setVolume }}>
      {children}
    </SoundManagerContext.Provider>
  );
};

export function useSoundManager() {
  const ctx = useContext(SoundManagerContext);
  if (!ctx) throw new Error('useSoundManager must be used within SoundManagerProvider');
  return ctx;
}
