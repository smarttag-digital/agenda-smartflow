import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ban, Loader2, Plus, Save, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import {
  DEFAULT_AVAILABILITY,
  type Availability,
} from "@/lib/availability-store";
import { getAvailabilityFn, saveAvailabilityFn } from "@/lib/availability.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/disponibilidade")({
  component: DisponibilidadePage,
});

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function DisponibilidadePage() {
  const [data, setData] = useState<Availability>(DEFAULT_AVAILABILITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState({ date: "", time: "" });

  const loadFn = useServerFn(getAvailabilityFn);
  const saveFn = useServerFn(saveAvailabilityFn);

  useEffect(() => {
    let cancelled = false;
    loadFn()
      .then((a) => { if (!cancelled) { setData(a); setLoading(false); } })
      .catch((e) => { console.error(e); if (!cancelled) setLoading(false); toast.error("Não foi possível carregar as configurações"); });
    const channel = supabase
      .channel("availability_config_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "availability_config" }, () => {
        loadFn().then((a) => { if (!cancelled) setData(a); }).catch(() => {});
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof Availability>(key: K, value: Availability[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const persist = async (next: Availability) => {
    setSaving(true);
    try {
      await saveFn({ data: next });
      toast.success("Disponibilidade salva");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const save = () => persist(data);

  const blockNow = () => {
    const d = new Date();
    const date = d.toISOString().slice(0, 10);
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(Math.floor(d.getMinutes() / 30) * 30).padStart(2, "0")}`;
    const next = { ...data, blockedSlots: [...data.blockedSlots, { date, time }] };
    setData(next);
    persist(next);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando disponibilidade…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Disponibilidade</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Horários e regras</h1>
          <p className="text-sm text-muted-foreground">Sincronizado com o link público em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={blockNow} variant="outline" className="rounded-full" disabled={saving}>
            <Zap className="h-3.5 w-3.5" /> Bloquear agora
          </Button>
          <Button onClick={save} className="rounded-full bg-brand-gradient text-white hover:opacity-95" disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
          </Button>
        </div>
      </header>

      <Section title="Horário padrão semanal">
        <div className="space-y-2">
          {data.weeklyHours.map((h, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
              <Switch
                checked={h.enabled}
                onCheckedChange={(v) => {
                  const next = [...data.weeklyHours];
                  next[idx] = { ...next[idx], enabled: v };
                  update("weeklyHours", next);
                }}
              />
              <span className="w-20 text-sm font-medium">{WEEKDAYS[idx]}</span>
              <Input
                type="time" value={h.start} disabled={!h.enabled} className="w-28"
                onChange={(e) => { const n = [...data.weeklyHours]; n[idx] = { ...n[idx], start: e.target.value }; update("weeklyHours", n); }}
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="time" value={h.end} disabled={!h.enabled} className="w-28"
                onChange={(e) => { const n = [...data.weeklyHours]; n[idx] = { ...n[idx], end: e.target.value }; update("weeklyHours", n); }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Datas bloqueadas">
        <div className="flex gap-2">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="max-w-xs" />
          <Button
            variant="outline"
            onClick={() => {
              if (!newDate || data.blockedDates.includes(newDate)) return;
              update("blockedDates", [...data.blockedDates, newDate].sort());
              setNewDate("");
            }}
          >
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
        {data.blockedDates.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.blockedDates.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs">
                <Ban className="h-3 w-3 text-destructive" /> {d}
                <button onClick={() => update("blockedDates", data.blockedDates.filter((x) => x !== d))}>
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Horários bloqueados (manual)">
        <div className="flex gap-2">
          <Input type="date" value={newSlot.date} onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })} className="max-w-[160px]" />
          <Input type="time" value={newSlot.time} onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })} className="max-w-[120px]" />
          <Button
            variant="outline"
            onClick={() => {
              if (!newSlot.date || !newSlot.time) return;
              update("blockedSlots", [...data.blockedSlots, newSlot]);
              setNewSlot({ date: "", time: "" });
            }}
          >
            <Plus className="h-4 w-4" /> Bloquear
          </Button>
        </div>
        {data.blockedSlots.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.blockedSlots.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs">
                {s.date} · {s.time}
                <button onClick={() => update("blockedSlots", data.blockedSlots.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Regras de agendamento">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Intervalo entre slots (min)">
            <select
              value={data.interval}
              onChange={(e) => update("interval", Number(e.target.value) as 15 | 30 | 60)}
              className="h-9 w-full rounded-md border bg-card px-3 text-sm"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </Field>
          <Field label="Duração padrão do atendimento (min)">
            <Input type="number" min={15} step={15} value={data.defaultDuration}
              onChange={(e) => update("defaultDuration", Number(e.target.value))} />
          </Field>
          <Field label="Limite diário de agendamentos">
            <Input type="number" min={1} value={data.dailyLimit}
              onChange={(e) => update("dailyLimit", Number(e.target.value))} />
          </Field>
          <Field label="Antecedência mínima (horas)">
            <Input type="number" min={0} value={data.minNoticeHours}
              onChange={(e) => update("minNoticeHours", Number(e.target.value))} />
          </Field>
          <Field label="Limite máximo futuro (dias)">
            <Input type="number" min={1} value={data.maxAdvanceDays}
              onChange={(e) => update("maxAdvanceDays", Number(e.target.value))} />
          </Field>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-soft">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
