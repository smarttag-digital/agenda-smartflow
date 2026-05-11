import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Clock, TrendingUp, XCircle, Search, MoreVertical,
  Trash2, CheckCircle2, RotateCcw, UserX, CalendarClock, LogOut,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AdminAuthGate } from "@/components/AdminAuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAppointments, removeAppointment, updateAppointment, formatDateBR,
  STATUS_STYLES, STATUS_DOT, type Appointment, type AppointmentStatus,
} from "@/lib/booking-store";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel — SmartFlow Agenda" }] }),
  component: () => (
    <AdminAuthGate>
      {({ signOut }) => <AdminPage onSignOut={signOut} />}
    </AdminAuthGate>
  ),
});

const STATUS_LIST: AppointmentStatus[] = [
  "Novo", "Confirmado", "Finalizado", "Cancelado", "Reagendado", "Não compareceu",
];

function AdminPage({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AppointmentStatus | "Todos">("Todos");

  const refresh = () => setItems(getAppointments().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
  useEffect(refresh, []);

  const todayISO = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const total = items.length;
    const upcoming = items.filter((a) => a.date >= todayISO && a.status !== "Cancelado").length;
    const cancelled = items.filter((a) => a.status === "Cancelado").length;
    const byTime = items.reduce<Record<string, number>>((acc, a) => {
      acc[a.time] = (acc[a.time] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(byTime).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { total, upcoming, cancelled, top };
  }, [items, todayISO]);

  const filtered = items.filter((a) => {
    const q = query.toLowerCase();
    const match =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.phone.includes(q) ||
      (a.neighborhood?.toLowerCase().includes(q) ?? false);
    const sf = filter === "Todos" || a.status === filter;
    return match && sf;
  });

  const setStatus = (id: string, status: AppointmentStatus) => {
    updateAppointment(id, { status });
    refresh();
    toast.success(`Status atualizado: ${status}`);
  };
  const remove = (id: string) => {
    removeAppointment(id);
    refresh();
    toast.success("Agendamento removido");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Painel</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Agenda completa</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe todos os agendamentos do seu imóvel ou escritório.
            </p>
          </div>
          <Button onClick={onSignOut} variant="outline" size="sm" className="rounded-full">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={CalendarDays} label="Total" value={stats.total} />
          <Stat icon={CalendarClock} label="Próximos" value={stats.upcoming} accent />
          <Stat icon={XCircle} label="Cancelamentos" value={stats.cancelled} />
          <Stat icon={TrendingUp} label="Horário top" value={stats.top} />
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, telefone, bairro..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["Todos", ...STATUS_LIST] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  filter === s ? "border-transparent bg-brand-gradient text-white shadow-soft" : "bg-card hover:bg-accent/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="mt-5 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl border bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[a.status]}`} />
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[a.status]}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDateBR(a.date)}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {a.time}</span>
                      <span>· {a.type}</span>
                      <span>· {a.phone}</span>
                      {a.neighborhood && <span>· {a.neighborhood}</span>}
                    </div>
                    {a.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">"{a.notes}"</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setStatus(a.id, "Confirmado")}><CheckCircle2 className="h-4 w-4" /> Confirmar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatus(a.id, "Finalizado")}><CheckCircle2 className="h-4 w-4" /> Finalizar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatus(a.id, "Reagendado")}><RotateCcw className="h-4 w-4" /> Reagendado</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatus(a.id, "Não compareceu")}><UserX className="h-4 w-4" /> Não compareceu</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatus(a.id, "Cancelado")}><XCircle className="h-4 w-4" /> Cancelar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => remove(a.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${accent ? "bg-brand-gradient text-white border-transparent" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium uppercase tracking-wider ${accent ? "text-white/80" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-white/90" : "text-primary"}`} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
