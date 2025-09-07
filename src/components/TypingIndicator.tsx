import React from 'react';
import '../App.css';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1">
    <span className="typing-dot" />
    <span className="typing-dot" />
    <span className="typing-dot" />
    <span className="ml-2 text-xs text-muted-foreground">печатает...</span>
  </div>
);

export default TypingIndicator;
