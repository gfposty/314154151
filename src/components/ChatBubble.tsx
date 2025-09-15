import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message?: string;
  audioUrl?: string;
  audioDuration?: number; // seconds
  isOwn: boolean;
  timestamp: number;
}

const ChatBubble = ({ message, audioUrl, audioDuration, isOwn, timestamp }: ChatBubbleProps) => {
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (!a.duration || isNaN(a.duration)) return;
      setProgress(a.currentTime / a.duration);
    };
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.play();
    } else {
      a.pause();
    }
  }, [playing]);

  const bars = useMemo(() => {
    return [0.4, 0.8, 0.6, 0.9, 0.5, 0.7, 0.55, 0.85];
  }, []);

  return (
    <div className={cn("flex w-full mb-4", isOwn ? "justify-end" : "justify-start")}>
      <div className="flex items-center gap-2">
        {isOwn && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        <div
          className={cn(
            "max-w-xs lg:max-w-md px-3 py-2 rounded-2xl relative group transition-all duration-200 hover:scale-[1.02]",
            isOwn
              ? "bg-gradient-primary text-white rounded-br-sm shadow-glow-subtle"
              : "bg-card/80 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50"
          )}
        >
          {audioUrl ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={playing ? "Пауза" : "Воспроизвести"}
                onClick={() => setPlaying((p) => !p)}
                className={cn(
                  "inline-flex items-center justify-center h-9 w-9 rounded-full",
                  isOwn ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                )}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="flex-1 flex items-center gap-2 min-w-[140px]">
                <div className="flex items-end gap-[3px] h-9">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-[5px] rounded-full",
                        isOwn ? "bg-white/80" : "bg-primary/80",
                        playing ? "animate-pulse" : "opacity-70"
                      )}
                      style={{ height: `${Math.round(10 + h * 20)}px` }}
                    />
                  ))}
                </div>
                <div className="h-[3px] flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className={cn("h-full", isOwn ? "bg-white" : "bg-primary")}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <span className={cn("tabular-nums text-xs", isOwn ? "text-white/90" : "text-muted-foreground")}>
                  {formatDuration(audioDuration || 0)}
                </span>
              </div>
              <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
            </div>
          ) : (
            <p className="text-sm break-words leading-relaxed px-1 py-1">{message}</p>
          )}
        </div>
        {!isOwn && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        {isOwn && <span className="text-[10px] leading-none px-2 py-1 rounded-full border border-primary text-primary-foreground bg-primary">Вы</span>}
      </div>
    </div>
  );
};

export default ChatBubble;
