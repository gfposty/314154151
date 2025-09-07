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
