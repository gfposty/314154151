import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";

const Index = () => {
  const [selectedAge, setSelectedAge] = useState<string>("");
  const navigate = useNavigate();

  const handleStartChat = () => {
    if (!selectedAge) return;
    navigate(`/chat?age=${selectedAge}`);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        {/* Logo */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Bezlico</h1>
          </div>
          <p className="text-lg text-muted-foreground">Анонимные разговоры без лица</p>
        </div>

        {/* Age Selection */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-foreground block">
            Выберите возрастную категорию:
          </label>
          <Select value={selectedAge} onValueChange={setSelectedAge}>
            <SelectTrigger className="w-full bg-card border-border text-foreground">
              <SelectValue placeholder="Выберите возраст" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="14-17">14-17 лет</SelectItem>
              <SelectItem value="18-25">18-25 лет</SelectItem>
              <SelectItem value="25+">25+ лет</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Chat Button */}
        <Button
          onClick={handleStartChat}
          disabled={!selectedAge}
          size="lg"
          className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-6 font-semibold"
        >
          Начать чат
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Полная анонимность</p>
          <p>• История сообщений не сохраняется</p>
          <p>• Регистрация не требуется</p>
        </div>
      </div>
    </div>
  );
};

export default Index;