import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ReportItem {
  id: string;
  createdAt: number;
  reason: string;
  comment?: string;
  messages?: any[];
  ip?: string;
}

const AdminReports = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [banned, setBanned] = useState<any[]>([]);

  const basePrimary = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_WS_URL || 'http://localhost:3001';
  const baseFallback = basePrimary === 'http://localhost:3001' ? 'http://localhost:3301' : 'http://localhost:3001';

  const load = async () => {
    const key = (import.meta as any).env?.VITE_ADMIN_KEY || 'dev-admin';
    try {
      const r = await fetch(`${basePrimary}/api/admin/reports`, { headers: { 'x-admin-key': key }});
      if (!r.ok) throw new Error('primary failed');
      const d = await r.json();
      setReports(d.reports || []);
      const rb = await fetch(`${basePrimary}/api/admin/banned`, { headers: { 'x-admin-key': key }});
      const db = await rb.json();
      setBanned(db.banned||[]);
    } catch {
      try {
        const r2 = await fetch(`${baseFallback}/api/admin/reports`, { headers: { 'x-admin-key': key }});
        const d2 = await r2.json();
        setReports(d2.reports || []);
        const rb2 = await fetch(`${baseFallback}/api/admin/banned`, { headers: { 'x-admin-key': key }});
        const db2 = await rb2.json();
        setBanned(db2.banned||[]);
      } catch {}
    }
  };

  useEffect(() => { load(); }, [basePrimary]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 rounded-2xl border border-border/30 bg-background/70 p-3">
          <div className="text-sm font-semibold mb-2">Жалобы</div>
          <div className="space-y-2 max-h-[70vh] overflow-auto">
            {reports.map((r) => (
              <button key={r.id} className={`w-full text-left px-3 py-2 rounded-lg border ${selected?.id===r.id? 'border-primary bg-primary/10' : 'border-border/40 hover:bg-accent/5'}`} onClick={()=>setSelected(r)}>
                <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
                <div className="text-sm">{r.reason}</div>
                {r.comment && <div className="text-xs text-muted-foreground line-clamp-2">{r.comment}</div>}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 rounded-2xl border border-border/30 bg-background/70 p-4 min-h-[70vh]">
          {!selected ? (
            <div className="text-sm text-muted-foreground">Выберите жалобу слева для просмотра.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Жалоба #{selected.id}</div>
                  <div className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="destructive" onClick={async()=>{ if(!selected) return; let ip = selected.ip || prompt('IP не указан в жалобе. Введите IP:') || ''; ip = ip.trim(); if(!ip) return; const key=(import.meta as any).env?.VITE_ADMIN_KEY||'dev-admin'; const r=await fetch(`${basePrimary}/api/admin/sanction`,{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':key},body:JSON.stringify({ ip, type:'15m' })}); if(!r.ok){ alert('Ошибка: не удалось выдать мут'); } load(); }}>Мут 15 мин</Button>
                  <Button variant="destructive" onClick={async()=>{ if(!selected) return; let ip = selected.ip || prompt('IP не указан в жалобе. Введите IP:') || ''; ip = ip.trim(); if(!ip) return; const key=(import.meta as any).env?.VITE_ADMIN_KEY||'dev-admin'; const r=await fetch(`${basePrimary}/api/admin/sanction`,{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':key},body:JSON.stringify({ ip, type:'3d' })}); if(!r.ok){ alert('Ошибка: не удалось выдать бан на 3 дня'); } load(); }}>Бан 3 дня</Button>
                  <Button variant="destructive" onClick={async()=>{ if(!selected) return; let ip = selected.ip || prompt('IP не указан в жалобе. Введите IP:') || ''; ip = ip.trim(); if(!ip) return; const key=(import.meta as any).env?.VITE_ADMIN_KEY||'dev-admin'; const r=await fetch(`${basePrimary}/api/admin/sanction`,{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':key},body:JSON.stringify({ ip, type:'forever' })}); if(!r.ok){ alert('Ошибка: не удалось выдать перманентный бан'); } load(); }}>Бан навсегда</Button>
                  <Button variant="outline" onClick={async()=>{ if(!selected) return; let ip = selected.ip || prompt('IP не указан в жалобе. Введите IP:') || ''; ip = ip.trim(); if(!ip) return; const key=(import.meta as any).env?.VITE_ADMIN_KEY||'dev-admin'; const r=await fetch(`${basePrimary}/api/admin/unban`,{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':key},body:JSON.stringify({ ip })}); if(!r.ok){ alert('Ошибка: не удалось разбанить'); } load(); }}>Разбан</Button>
                  <Button variant="outline" onClick={load}>Обновить</Button>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Причина</div>
                <div className="text-sm">{selected.reason}{selected.comment?`: ${selected.comment}`:''}</div>
                {selected.ip && (
                  <div className="mt-1 text-xs text-muted-foreground">IP: <span className="font-mono">{selected.ip}</span></div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Фрагменты чата</div>
                <div className="rounded-xl border border-border/30 bg-background/60 p-3 max-h-[50vh] overflow-auto space-y-2">
                  {(selected.messages||[]).map((m:any)=> (
                    <div key={m.id} className="text-sm">
                      <span className="text-xs text-muted-foreground mr-2">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      <span className="px-2 py-1 rounded-lg border border-border/40">{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Заблокированные (с историей нарушений)</div>
                <div className="rounded-xl border border-border/30 bg-background/60 p-3 max-h-[30vh] overflow-auto space-y-2">
                  {banned.map((b)=> (
                    <div key={b.ip} className="text-sm border-b border-border/20 pb-2 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-xs">{b.ip}</div>
                          <div className="text-xs text-muted-foreground">{b.status} • {b.banType}{b.expiresAt?` • до ${new Date(b.expiresAt).toLocaleString()}`:''}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={async()=>{const key=(import.meta as any).env?.VITE_ADMIN_KEY||'dev-admin'; await fetch(`${basePrimary}/api/admin/unban`,{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':key},body:JSON.stringify({ ip: b.ip })}); load();}}>Разбан</Button>
                      </div>
                      {Array.isArray(b.history) && b.history.length>0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {b.history.map((h:any, i:number)=> (
                            <div key={i} className="flex items-center justify-between">
                              <span className="font-mono">{new Date(h.at).toLocaleString()}</span>
                              <span>{h.type}{h.until?` • до ${new Date(h.until).toLocaleString()}`:''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;


