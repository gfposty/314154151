import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Users, Heart } from "lucide-react";

const LOCAL_USER_KEY = "anon-user-info";

const getUserInfo = () => {
  try {
    const data = localStorage.getItem(LOCAL_USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const setUserInfo = (info: { gender: string; age: string }) =>
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(info));

const LOCAL_PARTNER_KEY = "anon-partner-info";

const getPartnerInfo = () => {
  try {
    const data = localStorage.getItem(LOCAL_PARTNER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const setPartnerInfo = (info: { gender: string; age: string }) =>
  localStorage.setItem(LOCAL_PARTNER_KEY, JSON.stringify(info));

localStorage.removeItem(LOCAL_PARTNER_KEY);

const Index = () => {
  // Step 1: выбор пола и возраста пользователя
  // Step 2: выбор пола и возраста собеседника
  const [step, setStep] = useState<1 | 2>(1);
  const [userGender, setUserGender] = useState<string>("");
  const [userAge, setUserAge] = useState<string>("");
  const [partnerGender, setPartnerGender] = useState<string>("");
  const [partnerAge, setPartnerAge] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserInfo();
    if (user && user.gender && user.age) {
      setUserGender(user.gender);
      setUserAge(user.age);
      setStep(2);
      // Проверяем, есть ли сохранённые параметры поиска собеседника
      const partner = getPartnerInfo();
      if (partner && partner.gender && partner.age) {
        // Если есть — сразу в чат
        navigate(`/chat?age=${partner.age}&gender=${partner.gender}`);
      }
    }
  }, [navigate]);

  const handleUserNext = () => {
    if (!userGender || !userAge) return;
    setUserInfo({ gender: userGender, age: userAge });
    setStep(2);
  };

  const handleStartChat = () => {
    if (!partnerAge || !partnerGender) return;

    setPartnerInfo({ gender: partnerGender, age: partnerAge });
    navigate(`/chat?age=${partnerAge}&gender=${partnerGender}`);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        {/* Logo */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-primary-glow bg-clip-text text-transparent">
              Bezlico
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Анонимные разговоры без лица
          </p>
        </div>

        {/* Step 1: выбор пола и возраста пользователя */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="w-5 h-5 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Ваш пол
                </label>
              </div>
              <Select value={userGender} onValueChange={setUserGender}>
                <SelectTrigger className="w-full bg-background/80 border-border text-foreground hover:bg-background transition-colors">
                  <SelectValue placeholder="Выберите ваш пол" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border backdrop-blur-sm">
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Ваш возраст
                </label>
              </div>
              <Select value={userAge} onValueChange={setUserAge}>
                <SelectTrigger className="w-full bg-background/80 border-border text-foreground hover:bg-background transition-colors">
                  <SelectValue placeholder="Выберите ваш возраст" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border backdrop-blur-sm">
                  <SelectItem value="14-17">14-17 лет</SelectItem>
                  <SelectItem value="18-25">18-25 лет</SelectItem>
                  <SelectItem value="25+">25+ лет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleUserNext}
              disabled={!userGender || !userAge}
              size="lg"
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              Далее
            </Button>
          </div>
        )}

        {/* Step 2: выбор параметров собеседника */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="w-5 h-5 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Предпочтение по полу собеседника
                </label>
              </div>
              <Select value={partnerGender} onValueChange={setPartnerGender}>
                <SelectTrigger className="w-full bg-background/80 border-border text-foreground hover:bg-background transition-colors">
                  <SelectValue placeholder="Выберите пол собеседника" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border backdrop-blur-sm">
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                  <SelectItem value="any">Любой</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Возрастная категория собеседника
                </label>
              </div>
              <Select value={partnerAge} onValueChange={setPartnerAge}>
                <SelectTrigger className="w-full bg-background/80 border-border text-foreground hover:bg-background transition-colors">
                  <SelectValue placeholder="Выберите возраст собеседника" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border backdrop-blur-sm">
                  <SelectItem value="14-17">14-17 лет</SelectItem>
                  <SelectItem value="18-25">18-25 лет</SelectItem>
                  <SelectItem value="25+">25+ лет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleStartChat}
              disabled={!partnerGender || !partnerAge}
              size="lg"
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              Начать чат
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-2">
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