import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce функция
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Анимационные константы
export const ANIMATION = {
  TYPING_DOTS: 'typing-dots',
  MESSAGE_BOUNCE: 'message-bounce',
  CONNECTION_PULSE: 'connection-pulse',
};

// Пути к звуковым файлам (заглушки)
export const SOUND_PATHS = {
  NEW_MESSAGE: '/sounds/new-message.mp3',
  TYPING: '/sounds/typing.mp3',
  CONNECT: '/sounds/connect.mp3',
  DISCONNECT: '/sounds/disconnect.mp3',
};