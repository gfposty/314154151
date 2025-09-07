import React from 'react';

type Reaction = {
  emoji: string;
  userId: string;
};

type Props = {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
};

const EMOJIS = ['👍', '😂', '😍', '😮', '😢', '🔥'];

export const QuickReactions: React.FC<Props> = ({ reactions, onReact }) => (
  <div className="flex gap-1 items-center">
    {EMOJIS.map((emoji) => (
      <button
        key={emoji}
        className="hover:scale-110 transition-transform rounded-full px-1"
        onClick={() => onReact(emoji)}
        type="button"
      >
        {emoji}
        <span className="text-xs ml-0.5">
          {reactions.filter(r => r.emoji === emoji).length || ''}
        </span>
      </button>
    ))}
  </div>
);

export default QuickReactions;
