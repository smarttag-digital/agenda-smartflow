import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarDays, Clock, Tag, MapPin, Phone, MessageCircle, CalendarPlus, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { formatDateBR } from "@/lib/booking-store";
import { fetchAppointmentById } from "@/hooks/use-appointments";
import { useEffect, useState } from "react";
import type { Appointment } from "@/lib/booking-store";

export const Route = createFileRoute("/sucesso/$id")({
  head: () => ({ meta: [{ title: "Agendamento confirmado — SmartFlow Agenda" }] }),
  component: SucessoPage,
});

function SucessoPage() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointmentById(id).then(setItem);
  }, [id]);

  if (!item) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Agendamento não encontrado.</p>
          <Button asChild className="mt-4"><Link to="/">Fazer novo agendamento</Link></Button>
        </div>
      </div>
    );
  }

  const startDate = new Date(`${item.date}T${item.time}:00`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const calLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `SmartFlow · ${item.type}`,
  )}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(
    `Cliente: ${item.name}\nTelefone: ${item.phone}${item.notes ? "\nObs: " + item.notes : ""}`,
  )}&location=${encodeURIComponent(item.neighborhood ?? "")}`;
  const wppText = encodeURIComponent(
    `Olá ${item.name}! Confirmando seu agendamento SmartFlow: ${item.type} em ${formatDateBR(item.date)} às ${item.time}.`,
  );
  const wppLink = `https://wa.me/55${item.phone.replace(/\D/g, "")}?text=${wppText}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-gradient opacity-25 blur-3xl" />
      <div className="relative mx-auto max-w-xl px-4 py-10 sm:py-16">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <Logo size={32} />
          <span className="text-sm font-semibold">SmartFlow Agenda</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="rounded-3xl border bg-card p-6 shadow-card sm:p-10"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
              className="grid h-16 w-16 place-items-center rounded-full bg-success/15"
            >
              <CheckCircle2 className="h-8 w-8 text-[oklch(0.55_0.18_150)]" />
            </motion.div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Agendamento confirmado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Recebemos seu pedido e enviamos os detalhes da reserva.
            </p>
          </div>

          <div className="mt-7 space-y-2.5 rounded-2xl border bg-soft-gradient p-4">
            <Row icon={Tag} label="Tipo" value={item.type} />
            <Row icon={CalendarDays} label="Data" value={formatDateBR(item.date)} />
            <Row icon={Clock} label="Horário" value={item.time} />
            {item.neighborhood && <Row icon={MapPin} label="Local" value={item.neighborhood} />}
            <Row icon={Phone} label="Contato" value={item.phone} />
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button asChild className="bg-brand-gradient text-white hover:opacity-95">
              <a href={calLink} target="_blank" rel="noreferrer">
                <CalendarPlus className="h-4 w-4" /> Adicionar ao Google
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={wppLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
              </a>
            </Button>
            <Button asChild variant="ghost" className="sm:col-span-2">
              <Link to="/"><RefreshCw className="h-4 w-4" /> Reagendar</Link>
            </Button>
          </div>

          <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground">
            <Home className="mr-1 inline h-3 w-3" /> Voltar para o início
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card/70 px-3 py-2.5">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
