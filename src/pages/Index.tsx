import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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


const Index = () => {
  const [step] = useState<1 | 2>(1);
  const [userGender, setUserGender] = useState<string>("");
  const [userAge, setUserAge] = useState<string>("");
  const [partnerGender, setPartnerGender] = useState<string>("");
  const [partnerAge, setPartnerAge] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      if (user.gender) setUserGender(user.gender);
      if (user.age) setUserAge(user.age);
    }
    const partner = getPartnerInfo();
    if (partner) {
      if (partner.gender) setPartnerGender(partner.gender);
      if (partner.age) setPartnerAge(partner.age);
    }
  }, []);

  const handleStartChat = () => {
    if (!userGender || !userAge || !partnerGender || !partnerAge) return;
    setUserInfo({ gender: userGender, age: userAge });
    setPartnerInfo({ gender: partnerGender, age: partnerAge });
    navigate(`/chat?age=${partnerAge}&gender=${partnerGender}`);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 w-full max-w-4xl mx-auto">
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

        {/* Unified selections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Your gender */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-foreground">Ваш пол</label>
            </div>
            <ToggleGroup type="single" value={userGender} onValueChange={(v)=>{ if(!v) return; setUserGender(v); setUserInfo({ gender: v, age: userAge || "" }); }} className="flex-col">
              <ToggleGroupItem value="male" variant="outline" size="lg" className="w-full justify-center">Мужской</ToggleGroupItem>
              <ToggleGroupItem value="female" variant="outline" size="lg" className="w-full justify-center">Женский</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Partner gender */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-foreground">Пол собеседника</label>
            </div>
            <ToggleGroup type="single" value={partnerGender} onValueChange={(v)=>{ if(!v) return; setPartnerGender(v); setPartnerInfo({ gender: v, age: partnerAge || "" }); }} className="flex-col">
              <ToggleGroupItem value="male" variant="outline" size="lg" className="w-full justify-center">Мужской</ToggleGroupItem>
              <ToggleGroupItem value="female" variant="outline" size="lg" className="w-full justify-center">Женский</ToggleGroupItem>
              <ToggleGroupItem value="any" variant="outline" size="lg" className="w-full justify-center">Не важно</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Your age */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-foreground">Ваш возраст</label>
            </div>
            <ToggleGroup type="single" value={userAge} onValueChange={(v)=>{ if(!v) return; setUserAge(v); setUserInfo({ gender: userGender || "", age: v }); }} className="flex-col">
              <ToggleGroupItem value="14-17" variant="outline" size="lg" className="w-full justify-center">14-17 лет</ToggleGroupItem>
              <ToggleGroupItem value="18-25" variant="outline" size="lg" className="w-full justify-center">18-25 лет</ToggleGroupItem>
              <ToggleGroupItem value="25+" variant="outline" size="lg" className="w-full justify-center">25+ лет</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Partner age */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:bg-card/70 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-foreground">Возраст собеседника</label>
            </div>
            <ToggleGroup type="single" value={partnerAge} onValueChange={(v)=>{ if(!v) return; setPartnerAge(v); setPartnerInfo({ gender: partnerGender || "", age: v }); }} className="flex-col">
              <ToggleGroupItem value="14-17" variant="outline" size="lg" className="w-full justify-center">14-17 лет</ToggleGroupItem>
              <ToggleGroupItem value="18-25" variant="outline" size="lg" className="w-full justify-center">18-25 лет</ToggleGroupItem>
              <ToggleGroupItem value="25+" variant="outline" size="lg" className="w-full justify-center">25+ лет</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <Button
          onClick={handleStartChat}
          disabled={!userGender || !userAge || !partnerGender || !partnerAge}
          size="lg"
          className="mt-6 w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          Начать чат
        </Button>

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
