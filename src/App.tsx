import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import AdminReports from "./pages/AdminReports";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [sanction, setSanction] = useState<{active:boolean; status?:string; banType?:string; expiresAt?:number}>({active:false});
  const base = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_WS_URL || 'http://localhost:3001';

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${base}/api/sanction/me`, { cache: 'no-store' });
        const d = await r.json();
        setSanction(d);
      } catch {}
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [base]);

  const bannedOverlay = sanction.active ? (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-full mx-4 rounded-2xl border border-border/40 bg-background p-6 text-center">
        <div className="text-2xl font-bold mb-2">Доступ ограничен</div>
        <div className="text-sm text-muted-foreground">
          Вы заблокированы за нарушение правил сервера{sanction.banType==='forever' ? ' навсегда.' : ` до ${sanction.expiresAt ? new Date(sanction.expiresAt).toLocaleString() : ''}.`}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Romantic Tech Animated Background */}
        <div className="bg-romantic-tech">
          <div className="particle particle-1" />
          <div className="particle particle-2" />
          <div className="particle particle-3" />
          <div className="particle particle-4" />
          <div className="particle particle-5" />
          <div className="light-wave light-wave-1" />
          <div className="light-wave light-wave-2" />
          <div className="light-wave light-wave-3" />
        </div>
        {bannedOverlay}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
