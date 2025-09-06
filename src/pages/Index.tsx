import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Users, Heart } from "lucide-react";

const Index = () => {
  const [selectedAge, setSelectedAge] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const navigate = useNavigate();

  const handleStartChat = () => {
    if (!selectedAge || !selectedGender) return;
    navigate(`/chat?age=${selectedAge}&gender=${selectedGender}`);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md mx-auto animate-fade-in">
        {/* Logo */}
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow animate-pulse-glow">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-primary-glow bg-clip-text text-transparent">
              Bezlico
            </h1>
          </div>
          <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Анонимные разговоры без лица
          </p>
        </div>

        {/* Selection Cards */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {/* Age Selection */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-foreground">
                Возрастная категория
              </label>
            </div>
            <Select value={selectedAge} onValueChange={setSelectedAge}>
              <SelectTrigger className="w-full bg-background/80 border-border text-foreground hover:bg-background transition-colors">
                <SelectValue placeholder="Выберите возраст" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border backdrop-blur-sm">
                <SelectItem value="14-17">14-17 лет</SelectItem>
                <SelectItem value="18-25">18-25 лет</SelectItem>
                <SelectItem value="25+">25+ лет</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender Selection */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-foreground">
                Предпочтение по полу
              </label>
            </div>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="w-full bg-background/80 border-border text-foreground hover:bg-background transition-colors">
                <SelectValue placeholder="Выберите пол собеседника" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border backdrop-blur-sm">
                <SelectItem value="any">Любой пол</SelectItem>
                <SelectItem value="male">Мужской</SelectItem>
                <SelectItem value="female">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Start Chat Button */}
        <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <Button
            onClick={handleStartChat}
            disabled={!selectedAge || !selectedGender}
            size="lg"
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            Начать чат
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Полная анонимность</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Без регистрации</span>
            </div>
          </div>
          <p className="text-center">История сообщений не сохраняется</p>
        </div>
      </div>
    </div>
  );
};

export default Index;