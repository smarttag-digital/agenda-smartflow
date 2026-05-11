import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Save, Sun, Monitor, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { applyTheme, getSettings, saveSettings, type Settings, type Theme } from "@/lib/settings-store";
import { businessWhatsAppUrl } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [s, setS] = useState<Settings>(() => getSettings());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const save = () => {
    saveSettings(s);
    applyTheme(s.theme);
    toast.success("Configurações salvas");
  };

  const setTheme = (t: Theme) => { update("theme", t); applyTheme(t); saveSettings({ ...s, theme: t }); };

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";
  const avatar = user?.user_metadata?.avatar_url;
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Configurações</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Preferências</h1>
        </div>
        <Button onClick={save} className="rounded-full bg-brand-gradient text-white hover:opacity-95">
          <Save className="h-3.5 w-3.5" /> Salvar
        </Button>
      </header>

      <Tabs defaultValue="aparencia">
        <TabsList className="flex-wrap">
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="calendar">Google Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="aparencia">
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Tema</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { v: "light" as const, label: "Claro", icon: Sun },
                { v: "dark" as const, label: "Escuro", icon: Moon },
                { v: "system" as const, label: "Sistema", icon: Monitor },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setTheme(opt.v)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    s.theme === opt.v ? "border-primary bg-accent/30" : "bg-card hover:bg-accent/20"
                  }`}
                >
                  <opt.icon className="h-4 w-4" /> {opt.label}
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="perfil">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatar && <AvatarImage src={avatar} alt={name} />}
                <AvatarFallback className="bg-brand-gradient text-white">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">Conectado via Google</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <Toggle label="Notificações por email" checked={s.notifyEmail} onChange={(v) => update("notifyEmail", v)} />
            <Toggle label="Notificações por WhatsApp" checked={s.notifyWhatsapp} onChange={(v) => update("notifyWhatsapp", v)} />
            <Toggle label="Lembrete automático 30 min antes" checked={s.remind30min} onChange={(v) => update("remind30min", v)} />
            <p className="mt-3 text-xs text-muted-foreground">
              Estrutura preparada — envios reais serão habilitados quando o backend de notificações for ativado.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <Field label="Número comercial (com DDI)">
              <Input value={s.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value.replace(/\D/g, ""))} placeholder="5515997546750" />
            </Field>
            <Field label="Modelo de mensagem">
              <Textarea value={s.whatsappTemplate} onChange={(e) => update("whatsappTemplate", e.target.value)} rows={6} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Variáveis: {"{nome} {tipo} {data} {hora} {bairro} {observacoes}"}
              </p>
            </Field>
            <Button asChild variant="outline" className="rounded-full">
              <a href={businessWhatsAppUrl("Teste SmartFlow Agenda")} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> Testar abrir WhatsApp
              </a>
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <Field label="Título do evento">
              <Input value={s.eventTitle} onChange={(e) => update("eventTitle", e.target.value)} />
            </Field>
            <Toggle
              label="Adicionar evento ao Google Calendar (link manual a partir de cada agendamento)"
              checked={s.syncGoogleCalendar}
              onChange={(v) => update("syncGoogleCalendar", v)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Sincronização automática via OAuth pode ser habilitada em uma próxima rodada.
              Por enquanto, cada agendamento gera um link "Adicionar ao Google Calendar" com lembrete de 30 minutos.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 rounded-2xl border bg-card p-4 shadow-soft">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
