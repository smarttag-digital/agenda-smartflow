import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight, Loader2, Mail, UserRound, CalendarDays, Phone,
  FileText, Home, MapPin, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Navbar } from "@/components/Navbar";
import { type AppointmentType } from "@/lib/booking-store";
import { createAppointment, fetchSlotsForDate } from "@/hooks/use-appointments";
import { generateTimeSlots, getAvailability, getDayConfig, isBlockedSlot } from "@/lib/availability-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartFlow Agenda — Agende seu atendimento" },
      { name: "description", content: "Agende rapidamente seu atendimento imobiliário. Escolha data, horário e confirme em segundos." },
      { property: "og:title", content: "SmartFlow Agenda" },
      { property: "og:description", content: "Agendamento imobiliário rápido e premium." },
    ],
  }),
  component: BookingPage,
});

const TYPES: { value: AppointmentType; icon: any }[] = [
  { value: "Compra", icon: Home },
  { value: "Venda", icon: Sparkles },
  { value: "Locação", icon: MapPin },
  { value: "Visita", icon: CalendarDays },
];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function BookingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<AppointmentType | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const today = startOfDay(new Date());
  const dateISO = date ? format(date, "yyyy-MM-dd") : "";
  const maxDate = new Date(Date.now() + getAvailability().maxAdvanceDays * 86400000);

  // Slots taken in the selected date (from DB, refreshed when date changes)
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!dateISO) { setTakenSlots(new Set()); return; }
    let cancelled = false;
    fetchSlotsForDate(dateISO).then((rows) => {
      if (cancelled) return;
      setTakenSlots(new Set(rows.filter((r) => r.status !== "Cancelado").map((r) => r.time)));
    });
    return () => { cancelled = true; };
  }, [dateISO]);

  const availableTimes = useMemo(() => {
    if (!dateISO) return [];
    const cfg = getDayConfig(dateISO);
    if (!cfg) return [];
    const a = getAvailability();
    const slots = generateTimeSlots(cfg.start, cfg.end, a.interval);
    const now = new Date();
    const noticeMs = a.minNoticeHours * 3600 * 1000;
    return slots.map((t) => {
      const slotDate = new Date(`${dateISO}T${t}:00`);
      const tooSoon = slotDate.getTime() - now.getTime() < noticeMs;
      const blocked = isBlockedSlot(dateISO, t);
      const taken = takenSlots.has(t);
      return { time: t, disabled: tooSoon || blocked || taken, taken };
    });
  }, [dateISO, takenSlots]);

  const canSubmit =
    name.trim() && phone.replace(/\D/g, "").length >= 10 && type && date && time;

  const submit = async () => {
    if (!canSubmit || !date || !time || !type) return;
    setLoading(true);
    try {
      const item = await createAppointment({
        name: name.trim(),
        email: email.trim() || undefined,
        phone,
        type,
        date: dateISO,
        time,
        neighborhood: neighborhood.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setLoading(false);
      navigate({ to: "/sucesso/$id", params: { id: item.id } });
    } catch (e: any) {
      setLoading(false);
      toast.error(e?.message ?? "Erro ao criar agendamento");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Agende seu atendimento
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Escolha uma data e horário disponível.
          </p>
        </motion.div>

        <div className="mt-8 space-y-6">
          {/* Tipo */}
          <Section title="Tipo de atendimento">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {TYPES.map(({ value, icon: Icon }) => {
                const active = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-sm transition-all ${
                      active
                        ? "border-transparent bg-brand-gradient text-white shadow-glow"
                        : "bg-card hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "" : "text-primary"}`} />
                    <span className="font-medium">{value}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Data */}
          <Section title="Data">
            <div className="flex justify-center rounded-2xl border bg-card p-2 shadow-soft">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setTime(null); }}
                disabled={(d) => d < today || d > maxDate || !getDayConfig(format(d, "yyyy-MM-dd"))}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </div>
          </Section>

          {/* Horário */}
          <Section title="Horário">
            {!date ? (
              <p className="rounded-xl border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                Selecione uma data para ver os horários
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableTimes.map(({ time: t, disabled, taken }) => {
                  const active = time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => setTime(t)}
                      className={`relative rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "border-transparent bg-brand-gradient text-white shadow-glow"
                          : disabled
                            ? "cursor-not-allowed border-dashed text-muted-foreground/60"
                            : "bg-card hover:border-primary/40 hover:bg-accent/30"
                      }`}
                    >
                      {t}
                      {taken && !active && (
                        <span className="absolute -top-1 right-1 text-[9px] uppercase text-destructive/70">
                          ocupado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Dados */}
          <Section title="Seus dados">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome completo *" icon={UserRound}>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar" />
              </Field>
              <Field label="Telefone *" icon={Phone}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                />
              </Field>
              <Field label="Email (opcional)" icon={Mail} className="sm:col-span-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" type="email" />
              </Field>
            </div>
          </Section>

          {/* Opcionais */}
          <Section title="Detalhes (opcional)">
            <div className="grid gap-3">
              <Field label="Bairro / Condomínio" icon={MapPin}>
                <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Ex: Vila Madalena" />
              </Field>
              <Field label="Observações" icon={FileText}>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Algo importante para o atendimento?"
                  rows={3}
                />
              </Field>
            </div>
          </Section>

          <div className="sticky bottom-3 pt-2 sm:static">
            <Button
              onClick={submit}
              disabled={!canSubmit || loading}
              size="lg"
              className="h-14 w-full bg-brand-gradient text-base font-semibold text-white shadow-glow hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Confirmar agendamento <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Confirmação imediata — sem necessidade de cadastro.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label, icon: Icon, children, className,
}: { label: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      {children}
    </div>
  );
}
