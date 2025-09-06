import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, SkipForward, X, Users, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ChatBubble from "@/components/ChatBubble";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Message {
  id: string;
  text: string;
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
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [partnerFound, setPartnerFound] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Симуляция подключения к собеседнику
  useEffect(() => {
    if (!ageCategory || !genderPreference) {
      navigate('/');
      return;
    }

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
  }, [ageCategory, genderPreference, navigate]);

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
    // Симуляция ответа собеседника
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
    if (e.key === 'Enter') {
      sendMessage();
    }
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

  return (
    <div className="fixed inset-0 bg-gradient-bg flex flex-col overflow-hidden overscroll-none">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4 animate-fade-in">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <div>
              <h2 className="font-semibold text-foreground">Bezlico</h2>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {isEnded ? (
                  <span>Чат завершён</span>
                ) : isSearching ? (
                  <span className="animate-pulse">Поиск собеседника...</span>
                ) : partnerFound ? (
                  <>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{ageCategory}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{getGenderText(genderPreference)}</span>
                    </div>
                  </>
                ) : (
                  'Не подключен'
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
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
                    className="hover:bg-destructive/90 transition-all"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Завершить
                  </Button>
                </ConfirmDialog>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangePartner}
              className="text-xs"
            >
              Сменить параметры поиска
            </Button>
          </div>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 min-h-0">
        <div className="max-w-4xl mx-auto space-y-1">
          {isSearching && !isEnded && (
            <div className="text-center py-12 animate-fade-in">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gradient-primary rounded-full mx-auto mb-4 animate-pulse-glow"></div>
                <p className="text-muted-foreground text-lg">Поиск собеседника...</p>
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Возраст: {ageCategory}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>Пол: {getGenderText(genderPreference)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {messages.length > 0 && !isSearching && (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ChatBubble
                    message={message.text}
                    isOwn={message.isOwn}
                    timestamp={message.timestamp}
                  />
                </div>
              ))}
            </>
          )}
          {isEnded && messages.length > 0 && (
            <div className="text-center py-6 animate-fade-in">
              <div className="text-lg font-semibold text-foreground mb-2">Вы завершили чат:</div>
              <a href="#" className="text-muted-foreground text-sm underline hover:text-primary mb-6 block">Пожаловаться на собеседника</a>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleChangePartner}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Изменить параметры
                </Button>
                <Button
                  onClick={handleNextChat}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Начать новый чат
                </Button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Message Input */}
      {isConnected && !isEnded && (
        <div className="bg-card/80 backdrop-blur-sm border-t border-border/50 p-4 animate-slide-up">
          <div className="flex space-x-3 max-w-4xl mx-auto">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:bg-background transition-all"
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-primary hover:shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2">
            {newMessage.length}/500 символов
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
