import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Send, Mic, Trash2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSend: (audio: { blob: Blob; url: string; duration: number }) => void;
  disabled?: boolean;
  hasText?: boolean;
  onSendText?: () => void;
  onRecordingState?: (state: { isRecording: boolean; seconds: number; cancelHint: boolean; cancelled: boolean }) => void;
  onBindApi?: (api: { cancel: () => void; finish: () => void }) => void;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const SWIPE_CANCEL_THRESHOLD = 80;

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, disabled, hasText, onSendText, onRecordingState, onBindApi }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [cancelSwipe, setCancelSwipe] = useState({ active: false, dx: 0, cancelled: false });

  // Preview playback for just-recorded note
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Recorder
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Visualization
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const [levels, setLevels] = useState<number[]>(() => new Array(16).fill(0));
  // Preview waveform state and analyser refs
  const [previewLevels, setPreviewLevels] = useState<number[]>(() => new Array(48).fill(0));
  const previewAnalyserRef = useRef<AnalyserNode | null>(null);
  const previewAudioCtxRef = useRef<AudioContext | null>(null);
  const previewDataRef = useRef<Uint8Array | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const resetState = useCallback(() => {
    setIsRecording(false);
    setHasRecording(false);
    setRecordedUrl(null);
    setRecordedBlob(null);
    setSeconds(0);
    setCancelSwipe({ active: false, dx: 0, cancelled: false });
    setPreviewPlaying(false);
    setPreviewProgress(0);
    chunksRef.current = [];
  }, []);

  const stopVisualization = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
    }
    audioCtxRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Stop recorder first — allow ondataavailable/onstop to run and gather data
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    // Delay stopping tracks slightly to let browser emit dataavailable/onstop events
    setTimeout(() => {
      try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      mediaStreamRef.current = null;
    }, 120);
    stopVisualization();
  }, [stopVisualization]);

  const startVisualization = useCallback((stream: MediaStream) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048; // larger FFT for smoother per-bar data
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyserRef.current = analyser;
    audioCtxRef.current = ctx;
    dataArrayRef.current = dataArray;

    const bars = 16;
    const tick = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      // split time domain data into bars and compute average magnitude per bar
      const chunkSize = Math.floor(dataArrayRef.current.length / bars) || 1;
      const nextRaw = new Array(bars).fill(0).map((_, bi) => {
        let sum = 0;
        const start = bi * chunkSize;
        for (let i = 0; i < chunkSize; i++) {
          const v = Math.abs(dataArrayRef.current[start + i] - 128);
          sum += v;
        }
        const avg = sum / chunkSize;
        // normalize roughly to 0..1
        return Math.min(1, avg / 40);
      });
      // apply slight smoothing to previous values for nicer animation
      setLevels((prev) => nextRaw.map((v, i) => {
        const p = prev[i] ?? 0;
        return p * 0.7 + v * 0.3;
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || isRecording) return;
    try {
      if (typeof MediaRecorder === 'undefined') {
        console.error('MediaRecorder API is not supported in this browser');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!stream) {
        console.error('No media stream obtained');
        return;
      }
      mediaStreamRef.current = stream;
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream);
      } catch (err) {
        console.error('Failed to create MediaRecorder', err);
        // try using a different mimeType fallback
        try {
          recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        } catch (err2) {
          console.error('Fallback MediaRecorder creation failed', err2);
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
      }
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          chunksRef.current = [];
          return;
        }
        const blob = new Blob(chunksRef.current, { type: chunksRef.current.length ? chunksRef.current[0].type || 'audio/webm' : 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setHasRecording(true);
        setPreviewPlaying(false);
        setPreviewProgress(0);
        // mark recording finished so UI can show preview
        setIsRecording(false);
      };
      try {
        recorder.start();
      } catch (err) {
        console.error('Failed to start MediaRecorder', err);
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      cancelledRef.current = false;
      setIsRecording(true);
      setHasRecording(false);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
      startVisualization(stream);
    } catch (err) {
      console.error("Microphone permission or recording error", err);
    }
  }, [disabled, isRecording, startVisualization, cancelSwipe.active, cancelSwipe.cancelled]);

  const finishRecording = useCallback(() => {
    if (!isRecording) return;
    stopAll();
  }, [isRecording, stopAll]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    stopAll();
    resetState();
  }, [resetState, stopAll]);

  const sendRecording = useCallback(() => {
    if (!recordedBlob || !recordedUrl) return;
    onSend({ blob: recordedBlob, url: recordedUrl, duration: seconds });
    resetState();
  }, [onSend, recordedBlob, recordedUrl, seconds, resetState]);

  useEffect(() => {
    return () => {
      stopAll();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl, stopAll]);

  // Hold-to-record handlers
  const isHoldingRef = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    // no-op: hold-to-record disabled in favor of click-to-record
  };
  const onPointerMove = (_e: React.PointerEvent) => {
    // swipe-to-cancel removed for click-to-record mode
  };
  const onPointerUp = () => {
    // no-op in click-to-record mode
  };

  // Preview play/pause wiring
  useEffect(() => {
    const a = previewAudioRef.current;
    if (!a) return;
    const onTime = () => {
      if (!a.duration || isNaN(a.duration)) return;
      setPreviewProgress(a.currentTime / a.duration);
    };
    const onEnded = () => setPreviewPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
  }, [recordedUrl]);
  useEffect(() => {
    const a = previewAudioRef.current;
    if (!a) return;
    if (previewPlaying) a.play(); else a.pause();
  }, [previewPlaying]);

  const micBtn = (
    <div className="relative">
      <button
        type="button"
        aria-label="Записать голосовое"
        disabled={disabled || isRecording || hasRecording}
        onClick={() => startRecording()}
        className={cn(
          "inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-primary text-white shadow-glow transition-transform",
          "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Mic className="h-4 w-4" />
      </button>
      {isRecording && (
        <button
          type="button"
          aria-label="Остановить запись"
          onClick={finishRecording}
          className="absolute -top-11 right-0 h-8 w-8 rounded-full bg-background/80 border border-border/60 flex items-center justify-center hover:bg-background"
        >
          <Pause className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const sendVoiceBtn = (
    <button
      type="button"
      aria-label="Отправить голосовое"
      onClick={sendRecording}
      className={cn(
        "inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-primary text-white shadow-glow",
        "hover:scale-105 active:scale-95 transition-transform"
      )}
    >
      <Send className="h-4 w-4" />
    </button>
  );

  const sendTextBtn = (
    <button
      type="button"
      aria-label="Отправить"
      onClick={() => onSendText && onSendText()}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-primary text-white shadow-glow",
        "hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
      )}
    >
      <Send className="h-4 w-4" />
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
          <div className={cn(
            "px-2 py-1 rounded-md text-xs",
            cancelSwipe.cancelled ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-muted-foreground"
          )}>
            {cancelSwipe.cancelled ? "Отпустите, чтобы отменить" : "Свайп влево — отмена"}
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

    const ui = (
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-transparent border border-[rgba(124,58,237,0.06)] max-w-3xl w-full mx-auto">
          {/* Trash on the far left */}
          <button onClick={resetState} aria-label="Удалить запись" className="flex-none p-2 rounded-md bg-transparent text-white/70 hover:text-white transition-colors">
            <Trash2 className="h-5 w-5" />
          </button>

          {/* Waveform container */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-full max-w-[820px]">
              <div className="relative h-10 rounded-md bg-[rgba(255,255,255,0.02)] overflow-hidden">
                {/* progress overlay */}
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${Math.round(previewProgress * 100)}%`, transition: 'width 120ms linear', opacity: 0.45 }} />

                {/* dynamic bars */}
                <div className="relative z-10 h-full flex items-end justify-center px-2">
                  <div className="flex items-end gap-[6px] w-full overflow-hidden justify-center">
                    {previewLevels.map((lvl, i) => (
                      <div
                        key={i}
                        style={{ height: `${Math.max(6, Math.round(lvl * 36))}px`, width: 6 }}
                        className={`inline-block bg-gradient-to-t from-primary to-primary/60 rounded-sm transition-all ${previewPlaying ? 'opacity-100' : 'opacity-70'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* centered play button (overlay) */}
                <button
                  type="button"
                  aria-label={previewPlaying ? "Пауза" : "Воспроизвести"}
                  onClick={() => setPreviewPlaying((p) => !p)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/6 text-white/90 hover:bg-white/8 transition-colors"
                >
                  {previewPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-white/80">
                <span className="tabular-nums">{formatDuration(seconds)}</span>
                {/* no send button per request - delete icon handles removal */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    try {
      const target = typeof document !== 'undefined' && document.getElementById('voice-preview-root');
      if (target) return createPortal(ui, target);
    } catch (e) {
      // fall back to inline
    }

    return ui;
  }, [hasRecording, isRecording, recordedUrl, seconds, previewPlaying, previewProgress, resetState]);

  useEffect(() => {
    onRecordingState?.({ isRecording, seconds, cancelHint: cancelSwipe.active, cancelled: cancelSwipe.cancelled, hasRecording });
  }, [onRecordingState, isRecording, seconds, cancelSwipe.active, cancelSwipe.cancelled, hasRecording]);

  useEffect(() => {
    onBindApi?.({ cancel: cancelRecording, finish: finishRecording });
  }, [onBindApi, cancelRecording, finishRecording]);

  // Setup analyser for preview playback to animate waveform based on audio amplitude
  // This effect is defensive: creating a MediaElementSource can fail if the audio element
  // was previously connected to a different AudioContext. We reuse existing context/source
  // when possible and defend against repeated createMediaElementSource errors.
  const previewSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const audioEl = previewAudioRef.current;
    if (!audioEl || !recordedUrl) return;

    // If there's an existing audio context and source, reuse them to avoid attempting
    // to create a new MediaElementSource for the same HTMLMediaElement.
    try {
      if (!previewAudioCtxRef.current) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // try to create source; this can throw if the element was previously used
        try {
          const source = ctx.createMediaElementSource(audioEl);
          previewAudioCtxRef.current = ctx;
          previewSourceRef.current = source;
        } catch (err) {
          // failed to create source: clean up and fallback by closing ctx
          try { ctx.close(); } catch {}
          console.warn("createMediaElementSource failed, skipping visualiser setup", err);
          return;
        }
      } else if (!previewSourceRef.current) {
        // audio context exists but we don't have a source stored for it — try to create once
        try {
          previewSourceRef.current = previewAudioCtxRef.current!.createMediaElementSource(audioEl);
        } catch (err) {
          // createMediaElementSource may fail if the element was already connected to another context.
          // Fallback: use captureStream() on the audio element and create a MediaStreamSource from that.
          try {
            const captureStream = (audioEl as any).captureStream ? (audioEl as any).captureStream() : null;
            if (captureStream) {
              previewSourceRef.current = previewAudioCtxRef.current!.createMediaStreamSource(captureStream);
            } else {
              console.warn('createMediaElementSource failed and captureStream unavailable, skipping visualiser', err);
              return;
            }
          } catch (err2) {
            console.warn('captureStream fallback failed, skipping visualiser', err2);
            return;
          }
        }
      }

      const ctx = previewAudioCtxRef.current!;
      const source = previewSourceRef.current!;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // connect source -> analyser (do not connect to destination to avoid double audio)
      try {
        source.connect(analyser);
        // don't connect analyser to ctx.destination for preview visualiser to avoid extra routing
      } catch (err) {
        console.warn('Failed to connect audio nodes for preview visualiser', err);
      }

      previewAnalyserRef.current = analyser;
      previewDataRef.current = dataArray;

      const bars = previewLevels.length;
      const tick = () => {
        if (!previewAnalyserRef.current || !previewDataRef.current) return;
        // Prefer frequency data for visible peaks (better for bar visualization)
        previewAnalyserRef.current.getByteFrequencyData(previewDataRef.current);
        const chunkSize = Math.floor(previewDataRef.current.length / bars) || 1;
        const nextRaw = new Array(bars).fill(0).map((_, bi) => {
          let sum = 0;
          const start = bi * chunkSize;
          for (let i = 0; i < chunkSize; i++) {
            const v = previewDataRef.current![start + i];
            sum += v;
          }
          const avg = sum / chunkSize; // 0..255
          // normalize to 0..1 and apply a slight curve for visibility
          const normalized = Math.pow(Math.min(1, avg / 255), 0.6);
          return normalized;
        });
        // smooth with previous values for nicer animation and scale up for visibility
        setPreviewLevels((prev) => {
          const next = nextRaw.map((v, i) => {
            const p = prev[i] ?? 0;
            return p * 0.65 + v * 0.35;
          });
          return next;
        });
        previewRafRef.current = requestAnimationFrame(tick);
      };

      previewRafRef.current = requestAnimationFrame(tick);

      return () => {
        if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
        try { previewAnalyserRef.current?.disconnect(); } catch {}
        // do NOT disconnect the source here — it may be shared across renders/contexts
        try { ctx.close(); } catch {}
        previewAnalyserRef.current = null;
        previewAudioCtxRef.current = null;
        previewDataRef.current = null;
        previewSourceRef.current = null;
      };
    } catch (err) {
      console.warn('Preview visualiser setup failed', err);
      return;
    }
  }, [recordedUrl]);

  return (
    <div className="inline-flex items-center gap-2 shrink-0 relative">
      {ReadyToSendUI}
      {hasRecording ? (
        <>
          {sendVoiceBtn}
        </>
      ) : (
        hasText ? sendTextBtn : micBtn
      )}
    </div>
  );
};

export default VoiceRecorder;
