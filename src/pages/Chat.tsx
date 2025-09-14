import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ArrowLeft, Send, SkipForward, X, Users, Heart, Paperclip, Smile, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ChatBubble from "@/components/ChatBubble";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useUserActivity } from "@/hooks/useUserActivity";

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

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ageCategory = searchParams.get('age') || '';
  const genderPreference = searchParams.get('gender') || '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojis = ["😀","😁","😂","🤣","😊","😍","😘","😜","🤔","😎","😇","😅","🙃","😉","👍","👎","🙏","👏","🔥","💯","🎉","❤️","💜","✨","🤝","🤷","🤗","😴"];
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [partnerFound, setPartnerFound] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [searchCancelled, setSearchCancelled] = useState(false); // Новый флаг
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Activity/visibility tracking
  const isInactive = useUserActivity(30000);
  const [isHidden, setIsHidden] = useState(document.visibilityState === 'hidden');
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Симуляция подключения к собеседнику
  useEffect(() => {
    if (!ageCategory || !genderPreference) {
      navigate('/');
      return;
    }
    if (searchCancelled) return; // Если отменено, не запускать поиск

    // Симуляция поиска собеседника
    const searchTimer = setTimeout(() => {
      setIsSearching(false);
      setPartnerFound(true);
      setIsConnected(true);
      toast({
        title: "Собеседник найден!",
        description: "Вы подключены к анонимному чату",
      });
      playSound(CHAT_START_SOUND);
      // Добавляем приветственное сообщение от системы
      setTimeout(() => {
        addMessage("Привет! Как дела?", false);
      }, 1000);
    }, Math.random() * 3000 + 1000); // 1-4 секунды

    return () => clearTimeout(searchTimer);
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
    addMessage(newMessage, true);
    setNewMessage('');
    // Симуляция ответа собесе��ника
    setTimeout(() => {
      const responses = [
        "Интересно!",
        "А что думаешь об этом?", 
        "Согласен",
        "Расскажи подробнее",
        "Понятно",
        "А у тебя как?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, false);
    }, Math.random() * 2000 + 500);
  };

  const handleEndChat = () => {
    playSound(CHAT_END_SOUND);
    setIsEnded(true);
    setIsConnected(false);
    setPartnerFound(false);
    setIsSearching(false);
  };

  const handleNextChat = () => {
    setMessages([]);
    setIsEnded(false);
    setIsConnected(false);
    setPartnerFound(false);
    setIsSearching(true);
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
    clearPartnerInfo();
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
        {/* Header */}
        <div className="bg-transparent border-b-0 p-4 animate-fade-in">
          <div className="max-w-3xl mx-auto relative">
            <div className="rounded-3xl border border-[rgba(120,110,255,0.18)] bg-background/70 px-3 flex items-center justify-between flex-nowrap gap-2 sm:gap-3 min-h-[44px] h-12">
              <div className="flex items-center flex-shrink min-w-0 h-full">
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground h-full">
                  {isEnded ? (
                    <span className="text-base font-medium text-center w-full">Чат завершён</span>
                  ) : isSearching ? (
                    <span className="animate-pulse text-base font-medium text-center w-full">Поиск собеседника...</span>
                  ) : partnerFound ? (
                    <div className="flex items-center gap-x-2">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span className="truncate max-w-[40vw] sm:max-w-none text-sm font-medium">{ageCategory}</span>
                      </div>
                      <span className="mx-1 text-[10px] text-muted-foreground">•</span>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span className="truncate max-w-[40vw] sm:max-w-none text-sm font-medium">{getGenderText(genderPreference)}</span>
                      </div>
                    </div>
                  ) : (
                    'Не подключен'
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 ml-auto h-full">
                {isConnected && (
                  <>
                    <ConfirmDialog
                      title="Найти нового собеседника?"
                      description="Текущий диалог будет завершен, и мы найдем вам нового собеседника."
                      onConfirm={handleNextChat}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground hover:text-foreground hover:bg-secondary/50 transition-all h-9 px-4 font-medium"
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
                      className="text-sm h-9 px-4 flex items-center gap-2 hover:bg-secondary/50 hover:text-foreground transition-all"
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
        {/* Messages */}
        <div className="flex-1 px-4 pt-2 pb-12 sm:pb-16 min-h-0">
          <div className="relative max-w-3xl mx-auto h-full">
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background/80 to-transparent z-10 pointer-events-none" />
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
                    <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center justify-center space-x-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Возраст: {ageCategory}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Пол: {getGenderText(genderPreference)}</span>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-center">
                      <Button variant="outline" onClick={() => {
                        localStorage.removeItem("anon-partner-info"); // Очищаем данные о партнёре
                        setIsSearching(false);
                        setIsConnected(false);
                        setPartnerFound(false);
                        setSearchCancelled(true); // Устанавливаем флаг отмены
                        navigate('/');
                      }} className="h-10 px-5 text-sm rounded-lg transition-colors hover:bg-destructive/80 hover:text-destructive-foreground">
                        Отменить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="rounded-3xl border border-[rgba(120,110,255,0.18)] bg-background/70 shadow-[0_4px_32px_0_rgba(80,80,120,0.10)] px-2 sm:px-6 pl-12 py-4 min-h-[320px] flex flex-col transition-all duration-200 h-full overflow-y-auto overscroll-contain pr-2 space-y-1 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
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
                <a href="#" className="text-muted-foreground text-sm underline hover:text-primary mb-5 inline-block">Пожаловаться на собеседника</a>
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
                <div className={`relative rounded-2xl transition-all duration-200 shadow-[0_2px_16px_0_rgba(80,80,120,0.10)] border border-[rgba(120,110,255,0.25)] bg-background/80 focus-within:border-[rgba(120,110,255,0.7)] focus-within:shadow-[0_0_0_3px_rgba(120,110,255,0.15)] ${isEnded ? 'opacity-60' : 'hover:brightness-105 hover:shadow-[0_2px_24px_0_rgba(120,110,255,0.10)]'}`}>
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
                          <Button variant="outline" size="icon" className="bg-background/60 border-border/50" disabled={isEnded || !isConnected}>
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
                        className=""
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
