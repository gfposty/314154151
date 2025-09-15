import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ArrowLeft, Send, SkipForward, X, Users, Heart, Paperclip, Smile, Settings, MessageSquare } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";
import ChatBubble from "@/components/ChatBubble";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useUserActivity } from "@/hooks/useUserActivity";
import { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Message {
  id: string;
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  isOwn: boolean;
  timestamp: number;
}

const CHAT_START_SOUND = "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b7b44.mp3"; // notify
const CHAT_END_SOUND = "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b7b44.mp3"; // можно заменить на другой

function playSound(url: string) {
  const audio = new window.Audio(url);
  audio.volume = 0.5;
  audio.play();
}

const LOCAL_PARTNER_KEY = "anon-partner-info";
const clearPartnerInfo = () => {
  localStorage.removeItem(LOCAL_PARTNER_KEY);
};

type DialogContentNoCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  className?: string;
  children?: React.ReactNode;
};

const DialogContentNoClose = React.forwardRef<HTMLDivElement, DialogContentNoCloseProps>(
  function DialogContentNoClose({ className, children, ...props }, ref) {
    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg " + (className || "")
          }
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTheme = (searchParams.get('theme') || '').toLowerCase();
  const [isLightTheme, setIsLightTheme] = useState(initialTheme === 'light');
  const ageCategory = searchParams.get('age') || '';
  const genderPreference = searchParams.get('gender') || '';
  const chatType = searchParams.get('type') || '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojis = ["😀","😁","😂","🤣","😊","😍","😘","😜","🤔","😎","😇","😅","🙃","😉","👍","👎","🙏","👏","🔥","💯","🎉","❤️","💜","✨","🤝","🤷","🤗","😴"];
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [partnerFound, setPartnerFound] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [searchCancelled, setSearchCancelled] = useState(false); // Новый флаг
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const sendTimestampsRef = useRef<number[]>([]);

  // Activity/visibility tracking
  const isInactive = useUserActivity(30000);
  const [isHidden, setIsHidden] = useState(document.visibilityState === 'hidden');
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Apply theme class based on query param or stored settings
    const applyThemeClass = (light: boolean) => {
      const root = document.documentElement;
      if (light) {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    };

    // If no explicit theme in URL, try localStorage settings
    if (!initialTheme) {
      try {
        const raw = localStorage.getItem('anon-chat-settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.colorScheme) {
            const light = String(parsed.colorScheme).toLowerCase() === 'light';
            setIsLightTheme(light);
            applyThemeClass(light);
            return;
          }
        }
      } catch {}
    }
    applyThemeClass(initialTheme === 'light');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Keep document class synced if state changes for any reason
    const root = document.documentElement;
    if (isLightTheme) root.classList.add('light');
    else root.classList.remove('light');
  }, [isLightTheme]);

  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      setIsHidden(hidden);
      if (hidden) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          if (!isEnded && isConnected) {
            handleEndChat();
          }
        }, 60000);
      } else {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isConnected, isEnded]);

  // Подключение к серверу-посреднику Socket.IO
  useEffect(() => {
    if (!ageCategory || !genderPreference) {
      navigate('/');
      return;
    }
    if (searchCancelled) return;

    const url = (import.meta as any).env?.VITE_WS_URL || "http://localhost:3001";
    const socket = io(url, { withCredentials: false, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("find_partner", { age: ageCategory, gender: genderPreference });
    });

    socket.on("matched", () => {
      setIsSearching(false);
      setPartnerFound(true);
      toast({ title: "Собеседник найден!", description: "Вы подключены к анонимному чату" });
      playSound(CHAT_START_SOUND);
    });

    socket.on("message", (payload: { text: string; ts: number; }) => {
      setMessages(prev => [...prev, { id: String(payload.ts), text: payload.text, isOwn: false, timestamp: payload.ts }]);
    });

    socket.on("end", () => {
      handleEndChat();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ageCategory, genderPreference, navigate, searchCancelled]);

  const addMessage = (text: string, isOwn: boolean) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isOwn,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;
    // Rate limiting: max 5 messages per 10 seconds
    const now = Date.now();
    sendTimestampsRef.current = sendTimestampsRef.current.filter(t => now - t < 10000);
    if (sendTimestampsRef.current.length >= 5) {
      toast({
        variant: "destructive",
        title: "Слишком много сообщений",
        description: "Подождите несколько секунд перед отправкой новых сообщений",
      });
      return;
    }

    // Простая модерация
    const bannedWords = ['спам', 'реклама'];
    const hasBannedWord = bannedWords.some(word => 
      newMessage.toLowerCase().includes(word)
    );
    if (hasBannedWord) {
      toast({
        variant: "destructive",
        title: "Сообщение заблокировано",
        description: "Ваше сообщение содержит запрещенные слова",
      });
      return;
    }
    // PII/contacts moderation: emails, phones, links
    const emailRe = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
    const phoneRe = /(\+?\d[\d\s\-()]{7,})/;
    const urlRe = /(https?:\/\/|www\.)\S+/i;
    if (emailRe.test(newMessage) || phoneRe.test(newMessage) || urlRe.test(newMessage)) {
      toast({
        variant: "destructive",
        title: "Контакты запрещены",
        description: "Не делитесь телефонами, email или ссылками в анонимном чате",
      });
      return;
    }
    sendTimestampsRef.current.push(now);
    addMessage(newMessage, true);
    // Отправляем на сервер
    socketRef.current?.emit("message", { text: newMessage, ts: Date.now() });
    setNewMessage('');
    // Убрана симуляция ответов: сообщения приходят только от собеседника через сервер
  };

  const handleEndChat = () => {
    playSound(CHAT_END_SOUND);
    setIsEnded(true);
    setIsConnected(false);
    setPartnerFound(false);
    setIsSearching(false);
    socketRef.current?.emit("end");
  };

  const handleNextChat = () => {
    setMessages([]);
    setIsEnded(false);
    setIsConnected(false);
    setPartnerFound(false);
    setIsSearching(true);
    socketRef.current?.emit("next");
    toast({
      title: "Поиск нового собеседника...",
      description: "Подождите, мы ищем вам нового собеседника",
    });
    // Симуляция поиска нового собеседника
    setTimeout(() => {
      setIsSearching(false);
      setPartnerFound(true);
      setIsConnected(true);
      toast({
        title: "Новый собеседник найден!",
        description: "Вы подключены к новому чату",
      });
      playSound(CHAT_START_SOUND);
      setTimeout(() => {
        addMessage("Привет! Как дела?", false);
      }, 1000);
    }, Math.random() * 2000 + 1000);
  };

  const handleChangePartner = () => {
    // Сохраняем последний выбор, просто возвращаемся к параметрам
    navigate("/");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const autoResize = () => {
    // Intentionally left empty: we use a fixed textarea height with internal scrolling to prevent
    // the input from expanding vertically when a lot of text is entered.
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? newMessage.length;
    const end = el.selectionEnd ?? newMessage.length;
    const updated = newMessage.slice(0, start) + text + newMessage.slice(end);
    setNewMessage(updated);
    requestAnimationFrame(() => {
      if (!el) return;
      el.selectionStart = el.selectionEnd = start + text.length;
      autoResize();
      el.focus();
    });
  };

  // Функция для открытия диалога жалобы
  const openReportDialog = () => {
    setReportSent(false);
    setReportReason('');
    setReportComment('');
    setReportOpen(true);
  };

  // Функция для закрытия диалога жалобы
  const closeReportDialog = () => {
    setReportOpen(false);
    // Сбрасываем состояние после закрытия диалога
    setTimeout(() => {
      setReportSent(false);
      setReportReason('');
      setReportComment('');
    }, 300);
  };

  // Функция для отправки жалобы
  const handleSendReport = () => {
    if (!reportReason || (reportReason === 'other' && !reportComment.trim())) return;
    const base = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_WS_URL || 'http://localhost:3001';
    try {
      fetch(`${base}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, comment: reportComment, messages })
      }).catch(() => {});
    } catch {}
    setReportSent(true);
    setTimeout(() => { closeReportDialog(); }, 2000);
  };

  // Disable page scroll while in chat; only chat area scrolls
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const prevHtmlOverflow = htmlEl.style.overflow;
    const prevBodyOverflow = bodyEl.style.overflow;
    const prevRootHeight = (document.getElementById('root')?.style.height) || '';

    htmlEl.style.overflow = 'hidden';
    bodyEl.style.overflow = 'hidden';
    const root = document.getElementById('root');
    if (root) root.style.height = '100vh';

    return () => {
      htmlEl.style.overflow = prevHtmlOverflow;
      bodyEl.style.overflow = prevBodyOverflow;
      const r = document.getElementById('root');
      if (r) r.style.height = prevRootHeight;
    };
  }, []);

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male': return 'Мужской';
      case 'female': return 'Женский';
      case 'any': return 'Любой';
      default: return gender;
    }
  };

  const getChatTypeText = (type: string) => {
    switch (type) {
      case 'chat': return 'Общение';
      case 'flirt': return 'Флирт 18+';
      case 'roleplay': return 'Ролка';
      default: return type;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const statusColor = isHidden ? 'bg-red-500' : (isInactive ? 'bg-yellow-400' : 'bg-green-500');
  const statusText = isHidden ? 'вышел' : (isInactive ? 'нет на месте' : 'в сети');

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden overscroll-none">
      {/* SVG-паттерн для фона */}
      <div className="bg-pattern" />
      {/* Логотип в левом верхнем у��лу */}
      <div className="fixed top-4 left-6 z-30">
        <span className="site-brand site-brand--header logo-gradient-animated pointer-events-auto text-3xl font-bold select-none">Bezlico</span>
      </div>
      <div className="relative flex flex-col w-full h-full z-10">
        {/* Header (hidden while searching) */}
        {!isSearching && (
        <div className="bg-transparent border-b-0 p-4 animate-fade-in">
          <div className="max-w-3xl mx-auto relative">
            <div className="rounded-3xl border border-border/30 bg-background/70 px-3 flex items-center justify-between flex-nowrap gap-2 sm:gap-3 min-h-[44px] h-12 shadow-soft">
              <div className="flex items-center flex-shrink min-w-0 h-full">
                <div className="flex items-center flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 text-xs text-muted-foreground h-full">
                  {isEnded ? (
                    <span className="text-base font-medium text-center w-full">Чат завершён</span>
                  ) : isSearching ? (
                    <span className="animate-pulse text-base font-medium text-center w-full">Поиск собеседника...</span>
                  ) : partnerFound ? (
                    <div className="flex items-center gap-x-1">
                      <div className="flex items-center space-x-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-1 min-w-fit">
                        <Heart className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">{getGenderText(genderPreference)}</span>
                      </div>
                      {chatType && (
                        <div className="flex items-center space-x-1 bg-accent/10 border border-accent/20 rounded-full px-2 py-1 min-w-fit">
                          <MessageSquare className="w-3 h-3 text-accent flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground whitespace-nowrap">{getChatTypeText(chatType)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    'Не подключен'
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 ml-auto h-full">
                {!isEnded && isConnected && (
                  <>
                    <ConfirmDialog
                      title="Найти нового собеседника?"
                      description="Текущий диалог будет завершен, и мы найдем вам нового собеседника."
                      onConfirm={handleNextChat}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/40 hover:shadow-glow-subtle transition-all h-9 px-4 font-medium"
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Следующий чат
                      </Button>
                    </ConfirmDialog>
                    <ConfirmDialog
                      title="Завершить чат?"
                      description="Вы уверены, что хотите покинуть чат и вернуться на главную страницу?"
                      onConfirm={handleEndChat}
                      destructive
                    >
                      <Button
                        variant="destructive"
                        size="sm"
                        className="hover:bg-destructive/90 transition-all h-9 px-4"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Завершить
                      </Button>
                    </ConfirmDialog>
                  </>
                )}
                {!isSearching && !isEnded && (
                  <ConfirmDialog
                    title="Изменить параметры поиска?"
                    description="Текущий диалог будет завершён, и вы вернётесь к выбору параметров поиска. Продолжить?"
                    onConfirm={handleChangePartner}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sm h-9 px-4 flex items-center gap-2 hover:bg-primary/10 hover:border-primary/40 hover:text-foreground hover:shadow-glow-subtle transition-all"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Параметры поиска
                    </Button>
                  </ConfirmDialog>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
        {/* Messages */}
        <div className="flex-1 px-4 pt-2 pb-12 sm:pb-16 min-h-0">
          <div className="relative max-w-3xl mx-auto h-full rounded-3xl overflow-hidden">
            {!isSearching && (
              <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background/80 to-transparent z-10 pointer-events-none rounded-t-3xl" />
            )}
            {/* Status badge inside chat container (stays visible while messages scroll) */}
            {partnerFound && isConnected && !isSearching && !isEnded && (
              <div className="absolute top-5 left-4 z-20 pointer-events-auto">
                <div className="flex items-center space-x-2 bg-background px-3 py-1 rounded-full border border-border/50 shadow-sm">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow`} />
                  <span className="text-xs text-foreground lowercase">{statusText}</span>
                </div>
              </div>
            )}
            {isSearching && !isEnded ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-center py-12 animate-fade-in">
                  <div className="animate-pulse">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-primary rounded-full mx-auto mb-4 animate-pulse-glow shadow-glow-subtle"></div>
                    <p className="text-foreground text-lg sm:text-xl font-semibold">Поиск собеседника...</p>
                    <div className="mt-3 text-xs text-muted-foreground max-w-md mx-auto">
                      Если собеседник нарушает правила — используйте кнопку «Пожаловаться».
                    </div>
                    <div className="mt-4 flex justify-center gap-4 flex-wrap">
                      <div className="flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 min-w-fit">
                        <Heart className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{getGenderText(genderPreference)}</span>
                      </div>
                      {chatType && (
                        <div className="flex items-center space-x-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 min-w-fit">
                          <MessageSquare className="w-3 h-3 text-accent flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">{getChatTypeText(chatType)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-center">
                      <Button variant="outline" onClick={() => {
                        setIsSearching(false);
                        setIsConnected(false);
                        setPartnerFound(false);
                        setSearchCancelled(true);
                        navigate('/');
                      }} className="h-12 px-6 text-base rounded-xl transition-colors hover:bg-destructive/80 hover:text-destructive-foreground">
                        Отменить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="rounded-3xl border border-border/30 bg-background/70 shadow-soft px-2 sm:px-6 pl-12 py-4 min-h-[320px] flex flex-col transition-all duration-200 h-full overflow-y-auto overscroll-contain pr-2 space-y-1 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
                  {messages.length > 0 && (
                    <>
                      {messages.map((message, index) => {
                        const prev = messages[index - 1];
                        const isNewDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(message.timestamp).toDateString();
                        const dateLabel = (() => {
                          const d = new Date(message.timestamp);
                          const today = new Date();
                          const yesterday = new Date();
                          yesterday.setDate(today.getDate() - 1);
                          if (d.toDateString() === today.toDateString()) return 'Сегодня';
                          if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
                          return d.toLocaleDateString('ru-RU');
                        })();
                        return (
                          <div key={message.id} className={`animate-fade-in-up${index === 0 ? ' mt-6' : ''}`}>
                            {isNewDay && (
                              <div className="py-2 text-center text-xs text-muted-foreground">
                                <span className="px-3 py-1 rounded-full bg-background/60 border border-border/50">{dateLabel}</span>
                              </div>
                            )}
                            <ChatBubble message={message.text} audioUrl={message.audioUrl} audioDuration={message.audioDuration} isOwn={message.isOwn} timestamp={message.timestamp} />
                          </div>
                        );
                      })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Chat Ended Panel (static, above input) */}
        {isEnded && (
          <div className="flex justify-center items-end w-full mb-4">
            <div className="max-w-3xl w-full px-4">
              <div className="rounded-2xl bg-transparent px-4 py-5 text-center shadow-none border-none">
                <div className="text-2xl font-bold text-foreground mb-1">Чат завершён</div>
        <Dialog open={reportOpen} onOpenChange={(open) => {
          if (!open) {
            closeReportDialog();
          }
        }}>
                  <DialogTrigger asChild>
                    <a
                      href="#"
                      className="text-muted-foreground text-sm underline hover:text-primary mb-5 inline-block"
                      onClick={e => {
                        e.preventDefault();
                        openReportDialog();
                      }}
                    >
                      Пожаловаться на собеседника
                    </a>
                  </DialogTrigger>
                  <DialogContentNoClose className="max-w-md">
                    {reportSent ? (
                      <div className="py-8 text-center">
                        <div className="text-lg font-semibold mb-2">Спасибо!</div>
                        <div className="text-sm text-muted-foreground">Ваша жалоба отправлена на модерацию.</div>
                      </div>
                    ) : (
                      <>
                        <button 
                          type="button" 
                          className="absolute right-4 top-4 opacity-70 hover:opacity-100 focus:outline-none disabled:pointer-events-none" 
                          onClick={closeReportDialog}
                        >
                          <span className="sr-only">Close</span>
                          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <DialogHeader>
                          <DialogTitle>Пожаловаться на собеседника</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2 mb-4 text-sm">Пожалуйста, выберите причину жалобы:</div>
                        <RadioGroup value={reportReason} onValueChange={setReportReason} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="abuse" id="abuse" />
                            <label htmlFor="abuse" className="text-sm">Оскорбления/грубость</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="spam" id="spam" />
                            <label htmlFor="spam" className="text-sm">Спам или реклама</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nsfw" id="nsfw" />
                            <label htmlFor="nsfw" className="text-sm">Непристойные материалы</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="harassment" id="harassment" />
                            <label htmlFor="harassment" className="text-sm">Домогательства</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <label htmlFor="other" className="text-sm">Другое</label>
                          </div>
                        </RadioGroup>
                        {reportReason === 'other' && (
                          <div className="mt-3">
                            <textarea
                              className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm resize-none overflow-y-auto hide-scrollbar h-20 focus:outline-none focus:ring-2 focus:ring-primary"
                              maxLength={300}
                              placeholder="Опишите проблему..."
                              value={reportComment}
                              onChange={e => setReportComment(e.target.value)}
                            />
                            <div className="text-xs text-muted-foreground text-right mt-1">{reportComment.length}/300</div>
                          </div>
                        )}
                        <DialogFooter className="mt-4">
                          <Button onClick={handleSendReport} disabled={!reportReason || (reportReason === 'other' && !reportComment.trim())}>
                            Отправить жалобу
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContentNoClose>
                </Dialog>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleChangePartner} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">Изменить параметры</Button>
                  <Button onClick={handleNextChat} className="bg-green-600 hover:bg-green-700 text-white">Начать новый чат</Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Message Input (always visible, disabled if ended) */}
        {!isSearching && (
          <div className="bg-transparent border-t-0 p-4 pt-2 animate-slide-up mt-auto">
            <div className="flex items-end gap-3 max-w-3xl mx-auto flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <div className={`relative rounded-2xl transition-all duration-200 shadow-soft border border-border/40 bg-background/80 focus-within:ring-2 focus-within:ring-primary/70 focus-within:ring-offset-0 ${isEnded ? 'opacity-60' : 'hover:brightness-[1.03] hover:shadow-none'}`}>
                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); }}
                    onKeyDown={handleKeyPress}
                    placeholder={'Напишите сообщение...'}
                    disabled={isEnded || !isConnected}
                    className={`w-full h-12 py-2 pr-36 bg-background/80 border-transparent text-foreground placeholder:text-muted-foreground focus:bg-background transition-all rounded-2xl resize-none overflow-y-auto hide-scrollbar disabled:opacity-70 disabled:cursor-not-allowed`}
                    maxLength={500}
                  />

                  {/* Icons inside input: emoji + send */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-auto z-20">
                    <div className="flex items-center justify-center w-10 h-10">
                      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="bg-background/60 border-border/50 hover:bg-primary/10 hover:border-primary/30" disabled={isEnded || !isConnected}>
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-60 p-2">
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.map((e) => (
                              <button
                                key={e}
                                type="button"
                                className="h-7 w-7 rounded-md hover:bg-accent"
                                onClick={() => { insertAtCursor(e); setEmojiOpen(false); }}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center justify-center w-10 h-10">
                      <Button
                        onClick={sendMessage}
                        disabled={isEnded || !isConnected || !newMessage.trim()}
                        size="icon"
                        className="bg-primary/90 hover:bg-primary text-primary-foreground"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
              {newMessage.length}/500 символов
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
