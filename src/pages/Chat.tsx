import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, SkipForward, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ChatBubble from "@/components/ChatBubble";

interface Message {
  id: string;
  text: string;
  isOwn: boolean;
  timestamp: number;
}

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ageCategory = searchParams.get('age') || '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [partnerFound, setPartnerFound] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Симуляция подключения к собеседнику
  useEffect(() => {
    if (!ageCategory) {
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
      
      // Добавляем приветственное сообщение от системы
      setTimeout(() => {
        addMessage("Привет! Как дела?", false);
      }, 1000);
    }, Math.random() * 3000 + 1000); // 1-4 секунды

    return () => clearTimeout(searchTimer);
  }, [ageCategory, navigate]);

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

  const handleNextChat = () => {
    setMessages([]);
    setIsConnected(false);
    setPartnerFound(false);
    setIsSearching(true);
    
    // Симуляция поиска нового собеседника
    setTimeout(() => {
      setIsSearching(false);
      setPartnerFound(true);
      setIsConnected(true);
      toast({
        title: "Новый собеседник найден!",
        description: "Вы подключены к новому чату",
      });
    }, Math.random() * 2000 + 1000);
  };

  const handleEndChat = () => {
    navigate('/');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <div>
              <h2 className="font-semibold text-foreground">Bezlico</h2>
              <p className="text-xs text-muted-foreground">
                {isSearching ? 'Поиск собеседника...' : 
                 partnerFound ? `Возраст: ${ageCategory}` : 'Не подключен'}
              </p>
            </div>
          </div>
          
          {isConnected && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextChat}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Следующий чат
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndChat}
              >
                <X className="w-4 h-4 mr-2" />
                Завершить
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {isSearching && (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Поиск собеседника...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Возрастная категория: {ageCategory}
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              isOwn={message.isOwn}
              timestamp={message.timestamp}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {isConnected && (
        <div className="bg-card border-t border-border p-4">
          <div className="flex space-x-2 max-w-4xl mx-auto">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-background border-border text-foreground"
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-primary hover:shadow-glow"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;