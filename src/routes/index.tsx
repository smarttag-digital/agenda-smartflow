import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight, Loader2, Mail, UserRound, CalendarDays, Phone,
  FileText, Home, MapPin, Sparkles, Check, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Navbar } from "@/components/Navbar";
import { type AppointmentType } from "@/lib/booking-store";
import { fetchSlotsForDate } from "@/hooks/use-appointments";
import { useServerFn } from "@tanstack/react-start";
import { createAppointmentFn } from "@/lib/appointments.functions";
import { generateTimeSlots, getAvailability, getDayConfig, isBlockedSlot } from "@/lib/availability-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartFlow Agenda — Agende seu atendimento" },
      { name: "description", content: "Agende seu atendimento imobiliário em segundos. Escolha data, horário e confirme." },
      { property: "og:title", content: "SmartFlow Agenda" },
      { property: "og:description", content: "Agendamento imobiliário premium." },
    ],
  }),
  component: BookingPage,
});

const TYPES: { value: AppointmentType; icon: any; hint: string }[] = [
  { value: "Visita", icon: CalendarDays, hint: "Conhecer o imóvel" },
  { value: "Compra", icon: Home, hint: "Encontrar o ideal" },
  { value: "Venda", icon: Sparkles, hint: "Anunciar imóvel" },
  { value: "Locação", icon: MapPin, hint: "Alugar imóvel" },
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
  const maxDate = useMemo(() => new Date(Date.now() + getAvailability().maxAdvanceDays * 86400000), []);

  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  useEffect(() => {
    if (!dateISO) { setTakenSlots(new Set()); return; }
    let cancelled = false;
    setLoadingSlots(true);
    fetchSlotsForDate(dateISO).then((rows) => {
      if (cancelled) return;
      setTakenSlots(new Set(rows.filter((r) => r.status !== "Cancelado").map((r) => r.time)));
      setLoadingSlots(false);
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

  const phoneValid = phone.replace(/\D/g, "").length >= 10;
  const canSubmit = name.trim() && phoneValid && type && date && time;

  const currentStep = !type ? 1 : !date ? 2 : !time ? 3 : 4;

  const createFn = useServerFn(createAppointmentFn);
  const submit = async () => {
    if (!canSubmit || !date || !time || !type) return;
    setLoading(true);
    try {
      const item = await createFn({
        data: {
          name: name.trim(),
          email: email.trim() || undefined,
          phone,
          type,
          date: dateISO,
          time,
          neighborhood: neighborhood.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      navigate({ to: "/sucesso/$id", params: { id: item.id } });
    } catch (e: any) {
      setLoading(false);
      const msg = typeof e?.message === "string" ? e.message : "Erro ao criar agendamento";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.7_0.18_280/.10),transparent_70%)]" />
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-4 py-6 lg:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 lg:mb-8"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Novo agendamento
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Agende seu atendimento em <span className="text-brand-gradient">segundos</span>
          </h1>
        </motion.div>

        {/* Stepper */}
        <Stepper step={currentStep} />

        {/* Two-column layout */}
        <div className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
          {/* LEFT */}
          <div className="space-y-5">
            <Card>
              <CardHeader index={1} title="Tipo de atendimento" />
              <div className="grid grid-cols-2 gap-2.5">
                {TYPES.map(({ value, icon: Icon, hint }) => {
                  const active = type === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setType(value)}
                      className={cn(
                        "group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition-all",
                        active
                          ? "border-primary/60 bg-primary/5 shadow-[0_0_0_3px_oklch(var(--primary)/0.08)]"
                          : "bg-card hover:border-primary/30 hover:bg-accent/40"
                      )}
                    >
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        active ? "bg-brand-gradient text-primary-foreground" : "bg-muted text-foreground/70"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{value}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
                      </div>
                      {active && (
                        <motion.div
                          layoutId="type-check"
                          className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader index={2} title="Data" />
              <div className="flex justify-center rounded-2xl border bg-background/40 p-1.5">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setTime(null); }}
                  disabled={(d) => d < today || d > maxDate || !getDayConfig(format(d, "yyyy-MM-dd"))}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </div>
            </Card>

            <Card>
              <CardHeader index={3} title="Horário" suffix={
                date && (
                  <span className="text-[11px] text-muted-foreground">
                    {format(date, "EEE, d 'de' MMM", { locale: ptBR })}
                  </span>
                )
              } />
              {!date ? (
                <EmptyHint icon={CalendarDays} text="Selecione uma data para ver os horários" />
              ) : loadingSlots ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-muted/50" />
                  ))}
                </div>
              ) : availableTimes.length === 0 ? (
                <EmptyHint icon={Clock} text="Nenhum horário disponível neste dia" />
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {availableTimes.map(({ time: t, disabled, taken }) => {
                      const active = time === t;
                      return (
                        <motion.button
                          key={t}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          disabled={disabled}
                          onClick={() => setTime(t)}
                          className={cn(
                            "relative rounded-xl border py-2.5 text-sm font-medium tabular-nums transition-all",
                            active
                              ? "border-transparent bg-brand-gradient text-primary-foreground shadow-glow"
                              : disabled
                                ? "cursor-not-allowed border-dashed bg-muted/20 text-muted-foreground/50 line-through decoration-1"
                                : "bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/50"
                          )}

                        >
                          {t}
                          {taken && !active && (
                            <span className="absolute -top-1.5 right-1 text-[8px] uppercase tracking-wider text-destructive/70">
                              ocupado
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT — sticky summary + form */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="overflow-hidden border-primary/20">
              {/* Summary strip */}
              <div className="-mx-5 -mt-5 mb-5 border-b bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent px-5 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Resumo
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <SummaryCell label="Tipo" value={type ?? "—"} active={!!type} />
                  <SummaryCell
                    label="Data"
                    value={date ? format(date, "dd MMM", { locale: ptBR }) : "—"}
                    active={!!date}
                  />
                  <SummaryCell label="Horário" value={time ?? "—"} active={!!time} />
                </div>
              </div>

              <CardHeader index={4} title="Seus dados" />
              <div className="space-y-3">
                <PremiumInput
                  icon={UserRound}
                  label="Nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como devemos te chamar"
                />
                <PremiumInput
                  icon={Phone}
                  label="Telefone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                />
                <PremiumInput
                  icon={Mail}
                  label="Email"
                  optional
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
                <PremiumInput
                  icon={MapPin}
                  label="Bairro / Condomínio"
                  optional
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Vila Madalena"
                />
                <div>
                  <FloatingLabel icon={FileText} label="Observações" optional />
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Algo importante para o atendimento?"
                    rows={3}
                    className="mt-1.5 resize-none rounded-xl border-border/70 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/40"
                  />
                </div>
              </div>

              <Button
                onClick={submit}
                disabled={!canSubmit || loading}
                size="lg"
                className="mt-5 h-12 w-full rounded-xl bg-foreground text-background text-base font-semibold shadow-soft transition-all hover:bg-foreground/90 disabled:opacity-40 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Confirmar agendamento <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Atendimento personalizado · Confirmação imediata
              </p>

            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --- Subcomponents --- */

function Stepper({ step }: { step: number }) {
  const labels = ["Tipo", "Data", "Horário", "Dados"];
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {labels.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active && "border-primary/50 bg-primary/10 text-foreground",
              done && "border-transparent bg-foreground text-background",
              !active && !done && "border-border bg-card text-muted-foreground"
            )}>
              <span className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                done ? "bg-background/20" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : idx}
              </span>
              {label}
            </div>
            {i < labels.length - 1 && (
              <div className={cn("h-px w-4 transition-colors", done ? "bg-foreground" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-2xl border bg-card/70 p-5 shadow-soft backdrop-blur-sm", className)}
    >
      {children}
    </motion.section>
  );
}

function CardHeader({ index, title, suffix }: { index: number; title: string; suffix?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {index}
        </span>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      {suffix}
    </div>
  );
}

function SummaryCell({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border px-2.5 py-2 transition-colors",
      active ? "border-primary/30 bg-background" : "border-dashed bg-background/40"
    )}>
      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn(
        "mt-0.5 truncate text-sm font-semibold tabular-nums",
        active ? "text-foreground" : "text-muted-foreground/60"
      )}>
        {value}
      </p>
    </div>
  );
}

function EmptyHint({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
      <Icon className="h-5 w-5 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function FloatingLabel({ icon: Icon, label, required, optional }: { icon: any; label: string; required?: boolean; optional?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
      {required && <span className="text-primary">*</span>}
      {optional && <span className="normal-case tracking-normal text-muted-foreground/60">(opcional)</span>}
    </label>
  );
}

function PremiumInput({
  icon, label, required, optional, ...props
}: { icon: any; label: string; required?: boolean; optional?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <FloatingLabel icon={icon} label={label} required={required} optional={optional} />
      <Input
        {...props}
        className={cn(
          "mt-1.5 h-11 rounded-xl border-border/70 bg-background/60 px-3.5 text-sm transition-all focus-visible:border-primary/50 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/40",
          props.className
        )}
      />
    </div>
  );
}
