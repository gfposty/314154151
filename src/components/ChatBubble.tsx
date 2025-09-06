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
      "flex w-full mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group transition-all duration-200 hover:scale-105",
        isOwn 
          ? "bg-gradient-primary text-white rounded-br-sm shadow-glow" 
          : "bg-card/80 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50"
      )}>
        <p className="text-sm break-words leading-relaxed">{message}</p>
        <span className={cn(
          "text-xs opacity-70 mt-2 block",
          isOwn ? "text-right text-white/70" : "text-left text-muted-foreground"
        )}>
          {formatTime(timestamp)}
        </span>
        {isOwn && (
          <span className="text-xs opacity-70 mt-1 block text-right text-white/70">Вы</span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
