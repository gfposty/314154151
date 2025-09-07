import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Mic, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSend: (audio: { blob: Blob; url: string; duration: number }) => void;
  disabled?: boolean;
}

// Utility to format seconds as mm:ss
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const SWIPE_CANCEL_THRESHOLD = 80; // px to the left

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [cancelSwipe, setCancelSwipe] = useState({ active: false, dx: 0, cancelled: false });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Audio visualization
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const [levels, setLevels] = useState<number[]>(() => new Array(16).fill(0));

  const resetState = useCallback(() => {
    setIsRecording(false);
    setHasRecording(false);
    setRecordedUrl(null);
    setRecordedBlob(null);
    setSeconds(0);
    setCancelSwipe({ active: false, dx: 0, cancelled: false });
    chunksRef.current = [];
  }, []);

  const stopVisualization = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      // Close context to release resources (best-effort; may throw in some browsers)
      try { audioCtxRef.current.close(); } catch { /* noop */ }
    }
    audioCtxRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch { /* noop */ }
    }
    mediaRecorderRef.current = null;
    // Stop all tracks
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    stopVisualization();
  }, [stopVisualization]);

  const startVisualization = useCallback((stream: MediaStream) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    analyserRef.current = analyser;
    audioCtxRef.current = ctx;
    dataArrayRef.current = dataArray;

    const bars = 16;

    const tick = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      // Compute average deviation from 128 (midline)
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = dataArrayRef.current[i] - 128;
        sum += Math.abs(v);
      }
      const avg = sum / dataArrayRef.current.length; // 0..128
      // Map to 0..1
      const intensity = Math.min(1, avg / 40);
      // Create a smooth symmetrical levels array
      const next = new Array(bars).fill(0).map((_, i) => {
        const center = (bars - 1) / 2;
        const dist = Math.abs(i - center);
        const falloff = 1 - dist / center; // 0..1
        return Math.max(0.08, intensity * (0.6 + 0.4 * falloff));
      });
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setHasRecording(true);
      };

      recorder.start();
      setIsRecording(true);
      setHasRecording(false);
      setSeconds(0);

      // timer
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // visualization
      startVisualization(stream);
    } catch (err) {
      console.error("Microphone permission or recording error", err);
    }
  }, [disabled, isRecording, startVisualization]);

  const finishRecording = useCallback(() => {
    if (!isRecording) return;
    stopAll();
  }, [isRecording, stopAll]);

  const cancelRecording = useCallback(() => {
    stopAll();
    resetState();
  }, [resetState, stopAll]);

  const sendRecording = useCallback(() => {
    if (!recordedBlob || !recordedUrl) return;
    onSend({ blob: recordedBlob, url: recordedUrl, duration: seconds });
    // cleanup
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    resetState();
  }, [onSend, recordedBlob, recordedUrl, seconds, resetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl, stopAll]);

  // Pointer (hold-to-record) handling
  const pressTimeoutRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isHoldingRef.current = true;
    // Start immediately on press for better UX
    startRecording();
    setCancelSwipe({ active: true, dx: 0, cancelled: false });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isHoldingRef.current || !isRecording) return;
    const dx = e.movementX;
    setCancelSwipe((prev) => {
      const nextDx = Math.max(-200, Math.min(40, (prev.dx + dx)));
      const cancelled = nextDx <= -SWIPE_CANCEL_THRESHOLD;
      return { active: true, dx: nextDx, cancelled };
    });
  };

  const onPointerUp = () => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setCancelSwipe((prev) => ({ ...prev, active: false, dx: 0 }));
    if (cancelSwipe.cancelled) {
      cancelRecording();
    } else {
      finishRecording();
    }
  };

  const micBtn = (
    <button
      type="button"
      aria-label="Записать голосовое"
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        "relative inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-primary text-white shadow-glow transition-transform",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      <Mic className="h-5 w-5" />
      {isRecording && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/80">Удерживайте</span>
      )}
    </button>
  );

  const sendBtn = (
    <button
      type="button"
      aria-label="Отправить голосовое"
      onClick={sendRecording}
      className={cn(
        "inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-primary text-white shadow-glow",
        "hover:scale-105 active:scale-95 transition-transform"
      )}
    >
      <Send className="h-5 w-5" />
    </button>
  );

  const RecordingUI = useMemo(() => {
    if (!isRecording) return null;
    return (
      <div className="relative flex-1 min-w-[180px]">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <span className="tabular-nums text-sm text-foreground w-12">{formatDuration(seconds)}</span>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-end gap-1 h-10 w-full max-w-[220px]">
              {levels.map((v, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.max(6, Math.floor(v * 36))}px` }}
                  className="w-[6px] rounded-full bg-gradient-primary shadow-soft transition-all duration-75"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className={cn(
              "px-2 py-1 rounded-md text-xs",
              cancelSwipe.cancelled ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-muted-foreground"
            )}>
              {cancelSwipe.cancelled ? "Отпустите, чтобы отменить" : "Свайп влево — отмена"}
            </div>
          </div>
        </div>
        {cancelSwipe.active && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-y-0 left-0 w-24 flex items-center justify-center text-red-400/80"
              style={{ transform: `translateX(${cancelSwipe.dx}px)` }}
            >
              <Trash2 className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>
    );
  }, [isRecording, seconds, levels, cancelSwipe]);

  const ReadyToSendUI = useMemo(() => {
    if (!hasRecording || isRecording || !recordedUrl) return null;
    return (
      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-full bg-gradient-primary/20 border border-[rgba(120,110,255,0.35)] flex items-center justify-center text-primary-foreground/90">
            <Mic className="h-4 w-4" />
          </div>
          <span className="tabular-nums text-sm text-muted-foreground">{formatDuration(seconds)}</span>
          <audio src={recordedUrl} className="hidden" />
          <div className="ml-auto text-xs text-muted-foreground">Прослушайте и отправ��те</div>
        </div>
      </div>
    );
  }, [hasRecording, isRecording, recordedUrl, seconds]);

  return (
    <div className="flex items-center gap-3 w-full">
      {RecordingUI || ReadyToSendUI}
      {hasRecording ? sendBtn : micBtn}
      {!isRecording && hasRecording && (
        <button
          type="button"
          aria-label="Отменить"
          className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-background/60 border border-border/60 hover:bg-background/80"
          onClick={resetState}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;
