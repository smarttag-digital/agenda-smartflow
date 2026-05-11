import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getAppointments, formatDateBR, STATUS_DOT, STATUS_STYLES,
  type Appointment, type AppointmentStatus,
} from "@/lib/booking-store";
import { AppointmentDialog } from "@/components/admin/AppointmentDialog";

export const Route = createFileRoute("/admin/agendamentos")({
  component: AgendamentosPage,
});

const STATUS_LIST: AppointmentStatus[] = [
  "Novo", "Confirmado", "Finalizado", "Cancelado", "Reagendado", "Não compareceu",
];

function AgendamentosPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AppointmentStatus | "Todos">("Todos");
  const [selected, setSelected] = useState<Appointment | null>(null);

  const refresh = () => setItems(getAppointments().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)));
  useEffect(refresh, []);

  const filtered = useMemo(() => items.filter((a) => {
    const q = query.toLowerCase();
    const match = !q || a.name.toLowerCase().includes(q) || a.phone.includes(q) || (a.neighborhood?.toLowerCase().includes(q) ?? false);
    const sf = filter === "Todos" || a.status === filter;
    return match && sf;
  }), [items, query, filter]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Agendamentos</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Lista completa</h1>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, telefone, bairro..." className="pl-9" />
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

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhum agendamento encontrado.</p>
          </div>
        ) : filtered.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            onClick={() => setSelected(a)}
            className="block w-full rounded-2xl border bg-card p-4 text-left shadow-soft hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[a.status]}`} />
                  <p className="truncate text-sm font-semibold">{a.name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[a.status]}`}>
                    {a.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDateBR(a.date)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {a.time}</span>
                  <span>· {a.type}</span>
                  <span>· {a.phone}</span>
                  {a.neighborhood && <span>· {a.neighborhood}</span>}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AppointmentDialog
        appointment={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChange={() => { refresh(); setSelected(getAppointments().find((x) => x.id === selected?.id) ?? null); }}
      />
    </div>
  );
}
