import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp: number;
}

const ChatBubble = ({ message, isOwn, timestamp }: ChatBubbleProps) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn(
      "flex w-full mb-3",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative group",
        isOwn 
          ? "bg-chat-own text-white rounded-br-sm" 
          : "bg-chat-other text-foreground rounded-bl-sm"
      )}>
        <p className="text-sm break-words">{message}</p>
        <span className={cn(
          "text-xs opacity-70 mt-1 block",
          isOwn ? "text-right text-white/70" : "text-left text-muted-foreground"
        )}>
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;