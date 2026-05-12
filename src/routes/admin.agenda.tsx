import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS_DOT, type Appointment } from "@/lib/booking-store";
import { useAppointments } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentDialog } from "@/components/admin/AppointmentDialog";

export const Route = createFileRoute("/admin/agenda")({
  component: AgendaPage,
});

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 08..19

function AgendaPage() {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const items = useAppointments();
  const [selected, setSelected] = useState<Appointment | null>(null);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Agenda</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {view === "month"
              ? format(cursor, "MMMM yyyy", { locale: ptBR })
              : view === "week"
                ? `Semana de ${format(startOfWeek(cursor, { weekStartsOn: 1 }), "dd MMM", { locale: ptBR })}`
                : format(cursor, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() =>
            setCursor(view === "month" ? subMonths(cursor, 1) : addDays(cursor, view === "week" ? -7 : -1))
          }>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoje</Button>
          <Button size="icon" variant="outline" onClick={() =>
            setCursor(view === "month" ? addMonths(cursor, 1) : addDays(cursor, view === "week" ? 7 : 1))
          }>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="day">Dia</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="day">
          <DayView date={cursor} items={items} onPick={setSelected} />
        </TabsContent>
        <TabsContent value="week">
          <WeekView date={cursor} items={items} onPick={setSelected} />
        </TabsContent>
        <TabsContent value="month">
          <MonthView date={cursor} items={items} onPickDay={(d) => { setCursor(d); setView("day"); }} />
        </TabsContent>
      </Tabs>

      <AppointmentDialog
        appointment={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChange={() => { refresh(); setSelected(getAppointments().find((x) => x.id === selected?.id) ?? null); }}
      />
    </div>
  );
}

function eventsOn(items: Appointment[], d: Date) {
  const iso = format(d, "yyyy-MM-dd");
  return items.filter((a) => a.date === iso).sort((a, b) => a.time.localeCompare(b.time));
}

function DayView({ date, items, onPick }: { date: Date; items: Appointment[]; onPick: (a: Appointment) => void }) {
  const list = eventsOn(items, date);
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      {list.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nada agendado neste dia.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a, i) => (
            <motion.li key={a.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <button
                onClick={() => onPick(a)}
                className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left hover:border-primary/40 hover:bg-accent/20"
              >
                <div className="grid h-12 w-14 place-items-center rounded-lg bg-brand-gradient text-xs font-bold text-white">
                  {a.time}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[a.status]}`} />
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.type} · {a.phone}</p>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WeekView({ date, items, onPick }: { date: Date; items: Appointment[]; onPick: (a: Appointment) => void }) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
      <div className="grid min-w-[720px] grid-cols-[64px_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-r" />
        {days.map((d) => (
          <div key={d.toISOString()} className={`border-b border-l p-2 text-center ${isSameDay(d, new Date()) ? "bg-accent/20" : ""}`}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</p>
            <p className="text-sm font-semibold">{format(d, "dd")}</p>
          </div>
        ))}
        {HOURS.map((h) => (
          <Row key={h}>
            <div className="border-r p-1.5 text-right text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}:00</div>
            {days.map((d) => {
              const evs = eventsOn(items, d).filter((a) => Number(a.time.slice(0, 2)) === h);
              return (
                <div key={d.toISOString()} className="relative min-h-[56px] border-b border-l">
                  {evs.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onPick(a)}
                      className="absolute inset-x-1 top-1 rounded-md bg-brand-gradient px-1.5 py-1 text-left text-[10px] font-medium text-white shadow-soft hover:opacity-90"
                    >
                      {a.time} · {a.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              );
            })}
          </Row>
        ))}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="contents">{children}</div>;
}

function MonthView({ date, items, onPickDay }: { date: Date; items: Appointment[]; onPickDay: (d: Date) => void }) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  const days = useMemo(() => {
    const arr: Date[] = [];
    let d = start;
    while (d <= end) { arr.push(d); d = addDays(d, 1); }
    return arr;
  }, [start.getTime(), end.getTime()]);
  const today = new Date();

  return (
    <div className="rounded-2xl border bg-card p-2 shadow-soft">
      <div className="grid grid-cols-7 gap-1 px-1 pb-1">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const evs = eventsOn(items, d);
          const out = !isSameMonth(d, date);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPickDay(d)}
              className={`flex min-h-[72px] flex-col rounded-lg border p-1.5 text-left transition-colors ${
                out ? "bg-muted/20 text-muted-foreground/60" : "bg-card hover:border-primary/40 hover:bg-accent/20"
              } ${isToday ? "ring-2 ring-primary/40" : ""}`}
            >
              <span className="text-xs font-semibold">{format(d, "dd")}</span>
              <div className="mt-1 space-y-0.5">
                {evs.slice(0, 2).map((a) => (
                  <span key={a.id} className="block truncate rounded bg-brand-gradient px-1 py-0.5 text-[9px] font-medium text-white">
                    {a.time} {a.name.split(" ")[0]}
                  </span>
                ))}
                {evs.length > 2 && <span className="text-[9px] text-muted-foreground">+{evs.length - 2}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
