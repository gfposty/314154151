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
      <div className="flex items-center gap-2">
        {isOwn && <span className="text-xs text-white/70">{formatTime(timestamp)}</span>}
        <div className={cn(
          "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group transition-all duration-200 hover:scale-105",
          isOwn
            ? "bg-gradient-primary text-white rounded-br-sm shadow-glow"
            : "bg-card/80 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50"
        )}>
          <p className="text-sm break-words leading-relaxed">{message}</p>
        </div>
        {!isOwn && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        {isOwn && <span className="text-[10px] leading-none px-2 py-1 rounded-full border border-white/40 text-white/80 bg-white/5">Вы</span>}
      </div>
    </div>
  );
};

export default ChatBubble;
