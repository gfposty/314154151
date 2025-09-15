import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MessageCircle, Users, Heart, MessageSquare, Palette } from "lucide-react";

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

const getPartnerInfo = (): { gender: string; age: string | string[] } | null => {
  try {
    const data = localStorage.getItem(LOCAL_PARTNER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const setPartnerInfo = (info: { gender: string; age: string | string[] }) => {
  localStorage.setItem(LOCAL_PARTNER_KEY, JSON.stringify(info));
};

const LOCAL_CHAT_SETTINGS_KEY = "anon-chat-settings";

const getChatSettings = () => {
  try {
    const data = localStorage.getItem(LOCAL_CHAT_SETTINGS_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const setChatSettings = (settings: { chatType: string; colorScheme: string }) =>
  localStorage.setItem(LOCAL_CHAT_SETTINGS_KEY, JSON.stringify(settings));


const Index = () => {
  const [step] = useState<1 | 2>(1);
  const [userGender, setUserGender] = useState<string>("");
  const [userAge, setUserAge] = useState<string>("");
  const [partnerGender, setPartnerGender] = useState<string>("");
  const [partnerAge, setPartnerAge] = useState<string[]>([]);
  const [chatType, setChatType] = useState<string>("");
  const [colorScheme, setColorScheme] = useState<string>("dark");
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
      if (partner.age) {
        if (Array.isArray(partner.age)) {
          setPartnerAge(partner.age);
        } else {
          setPartnerAge([partner.age]);
        }
      }
    }
    
    const settings = getChatSettings();
    if (settings) {
      if (settings.chatType) setChatType(settings.chatType);
      if (settings.colorScheme) setColorScheme(settings.colorScheme);
    }
  }, []);

  const handleStartChat = () => {
    if (!userGender || !userAge || !partnerGender || partnerAge.length === 0 || !chatType) return;
    setUserInfo({ gender: userGender, age: userAge });
    setPartnerInfo({ gender: partnerGender, age: partnerAge });
    setChatSettings({ chatType, colorScheme });
    navigate(`/chat?age=${partnerAge.join(',')}&gender=${partnerGender}&type=${chatType}&theme=${colorScheme}`);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-xl mx-auto">
        {/* Logo */}
        <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-primary shadow-glow">
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-primary-glow bg-clip-text text-transparent">
              Bezlico
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Анонимные разговоры без лица
          </p>
        </div>

        {/* Compact unified container */}
        <div className="cozy-container rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <div className="space-y-6 sm:space-y-8">
            {/* Chat Type */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium text-foreground">Тема общения:</label>
              </div>
              <ToggleGroup type="single" value={chatType} onValueChange={(v)=>{ if(!v) return; setChatType(v); setChatSettings({ chatType: v, colorScheme }); }} className="grid grid-cols-2 gap-1">
                <ToggleGroupItem value="chat" variant="outline" size="sm" className="text-xs cozy-toggle">Общение</ToggleGroupItem>
                <ToggleGroupItem value="flirt" variant="outline" size="sm" className="text-xs cozy-toggle">Флирт 18+</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Row 1: Genders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Your gender */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">Ваш пол</label>
                </div>
                <ToggleGroup type="single" value={userGender} onValueChange={(v)=>{ if(!v) return; setUserGender(v); setUserInfo({ gender: v, age: userAge || "" }); }} className="grid grid-cols-2 gap-2">
                  <ToggleGroupItem value="male" variant="outline" size="sm" className="text-xs cozy-toggle">Мужской</ToggleGroupItem>
                  <ToggleGroupItem value="female" variant="outline" size="sm" className="text-xs cozy-toggle">Женский</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Partner gender */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">Пол собеседника</label>
                </div>
                <ToggleGroup type="single" value={partnerGender} onValueChange={(v)=>{ 
                  if(!v) return; 
                  setPartnerGender(v); 
                  // Получаем текущие данные из localStorage и обновляем только пол
                  const current = getPartnerInfo();
                  setPartnerInfo({ 
                    gender: v, 
                    age: current?.age || partnerAge || [] 
                  });
                }} className="grid grid-cols-2 gap-1">
                  <ToggleGroupItem value="male" variant="outline" size="sm" className="text-xs cozy-toggle">Мужской</ToggleGroupItem>
                  <ToggleGroupItem value="female" variant="outline" size="sm" className="text-xs cozy-toggle">Женский</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Row 2: Ages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Your age */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">Ваш возраст</label>
                </div>
                <ToggleGroup type="single" value={userAge} onValueChange={(v)=>{ if(!v) return; setUserAge(v); setUserInfo({ gender: userGender || "", age: v }); }} className="grid grid-cols-3 gap-1">
                  <ToggleGroupItem value="14-17" variant="outline" size="sm" className="text-xs cozy-toggle">14-17</ToggleGroupItem>
                  <ToggleGroupItem value="18-25" variant="outline" size="sm" className="text-xs cozy-toggle">18-25</ToggleGroupItem>
                  <ToggleGroupItem value="25+" variant="outline" size="sm" className="text-xs cozy-toggle">25+</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Partner age - Multiple selection */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">Возраст собеседника</label>
                </div>
                <ToggleGroup type="multiple" value={partnerAge} onValueChange={(v)=>{ 
                  setPartnerAge(v); 
                  // Получаем текущие данные из localStorage и обновляем только возраст
                  const current = getPartnerInfo();
                  setPartnerInfo({ 
                    gender: current?.gender || partnerGender || "", 
                    age: v 
                  });
                }} className="grid grid-cols-3 gap-1">
                  <ToggleGroupItem value="14-17" variant="outline" size="sm" className="text-xs cozy-toggle">14-17</ToggleGroupItem>
                  <ToggleGroupItem value="18-25" variant="outline" size="sm" className="text-xs cozy-toggle">18-25</ToggleGroupItem>
                  <ToggleGroupItem value="25+" variant="outline" size="sm" className="text-xs cozy-toggle">25+</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>


            {/* Color Scheme */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium text-foreground">Цветовая схема:</label>
              </div>
              <ToggleGroup type="single" value={colorScheme} onValueChange={(v)=>{ if(!v) return; setColorScheme(v); setChatSettings({ chatType, colorScheme: v }); }} className="grid grid-cols-2 gap-2">
                <ToggleGroupItem value="light" variant="outline" size="sm" className="text-xs cozy-toggle">Светлая</ToggleGroupItem>
                <ToggleGroupItem value="dark" variant="outline" size="sm" className="text-xs cozy-toggle">Тёмно-фиолетовая</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Start Chat Button */}
          <Button
            onClick={handleStartChat}
            disabled={!userGender || !userAge || !partnerGender || partnerAge.length === 0 || !chatType}
            size="lg"
            className="mt-4 sm:mt-6 w-full cozy-button text-sm sm:text-base py-3 sm:py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Начать чат
          </Button>
        </div>

        {/* Info */}
        <div className="text-center mt-4 sm:mt-6 space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Полная анонимность</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Без регистрации</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/80">История сообщений не сохраняется</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
