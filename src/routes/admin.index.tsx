import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, RotateCcw, UserX, TrendingUp, ArrowRight,
} from "lucide-react";
import {
  formatDateBR, STATUS_DOT, STATUS_STYLES,
  type Appointment,
} from "@/lib/booking-store";
import { useAppointments } from "@/hooks/use-appointments";
import { AppointmentDialog } from "@/components/admin/AppointmentDialog";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const items = useAppointments();
  const [selected, setSelected] = useState<Appointment | null>(null);

  const todayISO = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const today = items.filter((a) => a.date === todayISO && a.status !== "Cancelado");
    const upcoming = items
      .filter((a) => a.date >= todayISO && a.date <= in7 && a.status !== "Cancelado")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const confirmed = items.filter((a) => a.status === "Confirmado").length;
    const cancelled = items.filter((a) => a.status === "Cancelado").length;
    const rescheduled = items.filter((a) => a.status === "Reagendado").length;
    const noshow = items.filter((a) => a.status === "Não compareceu").length;
    const recent = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    return { today, upcoming, confirmed, cancelled, rescheduled, noshow, recent };
  }, [items, todayISO, in7]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Visão geral</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Olá 👋</h1>
        <p className="text-sm text-muted-foreground">Resumo da sua agenda em tempo real.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Hoje" value={stats.today.length} icon={CalendarDays} accent />
        <Stat label="Próximos 7d" value={stats.upcoming.length} icon={TrendingUp} />
        <Stat label="Confirmados" value={stats.confirmed} icon={CheckCircle2} />
        <Stat label="Cancelados" value={stats.cancelled} icon={XCircle} />
        <Stat label="Reagendados" value={stats.rescheduled} icon={RotateCcw} />
        <Stat label="Não compareceram" value={stats.noshow} icon={UserX} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Próximos atendimentos" cta={{ to: "/admin/agenda", label: "Ver agenda" }}>
          {stats.upcoming.length === 0 ? (
            <Empty text="Nenhum agendamento nos próximos 7 dias." />
          ) : (
            <ul className="space-y-1.5">
              {stats.upcoming.slice(0, 6).map((a, i) => (
                <Item key={a.id} a={a} i={i} onClick={() => setSelected(a)} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Últimos agendamentos" cta={{ to: "/admin/agendamentos", label: "Ver todos" }}>
          {stats.recent.length === 0 ? (
            <Empty text="Nenhum agendamento ainda." />
          ) : (
            <ul className="space-y-1.5">
              {stats.recent.map((a, i) => (
                <Item key={a.id} a={a} i={i} onClick={() => setSelected(a)} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AppointmentDialog
        appointment={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChange={() => setSelected((prev) => (prev ? items.find((x) => x.id === prev.id) ?? null : null))}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 shadow-soft ${accent ? "bg-brand-gradient text-white border-transparent" : "bg-card"}`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-medium uppercase tracking-wider ${accent ? "text-white/80" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-white/90" : "text-primary"}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </motion.div>
  );
}

function Card({ title, children, cta }: { title: string; children: React.ReactNode; cta?: { to: string; label: string } }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {cta && (
          <Link to={cta.to as any} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            {cta.label} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Item({ a, i, onClick }: { a: Appointment; i: number; onClick: () => void }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
    >
      <button
        onClick={onClick}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-accent/20"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[a.status]}`} />
            <p className="truncate text-sm font-medium">{a.name}</p>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatDateBR(a.date)} · <Clock className="inline h-3 w-3" /> {a.time} · {a.type}
          </p>
        </div>
        <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-block ${STATUS_STYLES[a.status]}`}>
          {a.status}
        </span>
      </button>
    </motion.li>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
