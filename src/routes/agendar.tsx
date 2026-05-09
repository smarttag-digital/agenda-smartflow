import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Mail, Apple, UserRound,
  CalendarDays, Clock, Phone, FileText, Home, MapPin, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { addAppointment, DEFAULT_TIMES, isSlotTaken, type AppointmentType } from "@/lib/booking-store";
import { toast } from "sonner";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar atendimento — SmartFlow Agenda" },
      { name: "description", content: "Escolha a melhor data e horário para seu atendimento imobiliário." },
    ],
  }),
  component: AgendarPage,
});

type Step = "login" | "form";
const TYPES: { value: AppointmentType; icon: any; desc: string }[] = [
  { value: "Compra", icon: Home, desc: "Quero comprar um imóvel" },
  { value: "Venda", icon: Sparkles, desc: "Quero vender meu imóvel" },
  { value: "Locação", icon: MapPin, desc: "Aluguel ou locação" },
  { value: "Visita", icon: CalendarDays, desc: "Visitar um imóvel" },
];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function AgendarPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<AppointmentType | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const dateISO = date ? format(date, "yyyy-MM-dd") : "";
  const today = startOfDay(new Date());
  const todayISO = format(today, "yyyy-MM-dd");

  const availableTimes = useMemo(() => {
    if (!dateISO) return [];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    return DEFAULT_TIMES.map((t) => {
      const [h, m] = t.split(":").map(Number);
      const past = dateISO === todayISO && h * 60 + m <= nowMinutes;
      const taken = isSlotTaken(dateISO, t);
      return { time: t, disabled: past || taken, taken };
    });
  }, [dateISO, todayISO]);

  const canSubmit = name.trim() && phone.replace(/\D/g, "").length >= 10 && type && date && time;

  const handleSocial = (provider: "google" | "apple") => {
    // Placeholder until Cloud auth is wired
    toast.info(`Login com ${provider === "google" ? "Google" : "Apple"} disponível em breve. Continuando sem conta.`);
    setStep("form");
  };

  const submit = async () => {
    if (!canSubmit || !date || !time || !type) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const item = addAppointment({
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-14">
        <AnimatePresence mode="wait">
          {step === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border bg-card p-7 shadow-card sm:p-10"
            >
              <div className="flex flex-col items-center text-center">
                <Logo size={56} />
                <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Bem-vindo</h1>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Entre para agendar seu atendimento imobiliário com poucos cliques.
                </p>
              </div>
              <div className="mt-8 space-y-2.5">
                <Button onClick={() => handleSocial("google")} variant="outline" className="h-12 w-full justify-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" /> Continuar com Google
                </Button>
                <Button onClick={() => handleSocial("apple")} variant="outline" className="h-12 w-full justify-center gap-2 text-sm font-medium">
                  <Apple className="h-4 w-4" /> Continuar com Apple
                </Button>
                <div className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
                </div>
                <Button onClick={() => setStep("form")} className="h-12 w-full bg-brand-gradient text-white hover:opacity-95">
                  <UserRound className="h-4 w-4" /> Continuar sem conta
                </Button>
              </div>
              <p className="mt-6 text-center text-[11px] text-muted-foreground">
                Ao continuar você aceita receber notificações de agendamento.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setStep("login")}
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>

              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Agende seu atendimento</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Escolha a melhor data e horário para seu atendimento imobiliário.
                </p>
              </div>

              {/* Tipo */}
              <Section title="Tipo de atendimento" required>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {TYPES.map(({ value, icon: Icon }) => {
                    const active = type === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setType(value)}
                        className={`group flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-sm transition-all ${
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

              {/* Dados */}
              <Section title="Seus dados" required>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome completo" icon={UserRound}>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar" />
                  </Field>
                  <Field label="Telefone" icon={Phone}>
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

              {/* Data */}
              <Section title="Data" required>
                <div className="rounded-2xl border bg-card p-2 shadow-soft">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setTime(null); }}
                    disabled={(d) => d < today}
                    locale={ptBR}
                    className="pointer-events-auto mx-auto"
                  />
                </div>
              </Section>

              {/* Horário */}
              <Section title="Horário" required>
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
                            <span className="absolute -top-1 right-1 text-[9px] uppercase text-destructive/70">ocupado</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
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

              <div className="sticky bottom-3 mt-8 sm:static">
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
                  Você receberá uma confirmação imediata.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        {required && <span className="text-primary">*</span>}
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
        <Icon className="h-3 w-3" />
        {label}
      </Label>
      {children}
    </div>
  );
}
