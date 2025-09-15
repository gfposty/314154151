export interface MessageWithStatus {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read' | 'error';
  reactions?: Reaction[];
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface UserActivity {
  userId: string;
  isTyping: boolean;
  lastActive: number;
  isInactive: boolean;
}

// Temporary declaration to satisfy TypeScript before packages are installed
// (socket.io-client includes its own types; this avoids editor error until install)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module 'socket.io-client' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const io: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Socket = any;
}