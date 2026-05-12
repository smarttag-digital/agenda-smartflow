import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CalendarDays, Clock, Phone, MapPin, Tag, FileText, MessageCircle, CalendarPlus,
  CheckCircle2, RotateCcw, UserX, XCircle, Trash2,
} from "lucide-react";
import {
  STATUS_STYLES, formatDateBR,
  type Appointment, type AppointmentStatus,
} from "@/lib/booking-store";
import { deleteAppointment, updateAppointmentStatus } from "@/hooks/use-appointments";
import { clientWhatsAppUrl } from "@/lib/whatsapp";
import { googleCalendarUrl } from "@/lib/google-calendar";
import { toast } from "sonner";

const ACTIONS: { status: AppointmentStatus; icon: any; label: string }[] = [
  { status: "Confirmado", icon: CheckCircle2, label: "Confirmar" },
  { status: "Finalizado", icon: CheckCircle2, label: "Finalizar" },
  { status: "Reagendado", icon: RotateCcw, label: "Reagendar" },
  { status: "Não compareceu", icon: UserX, label: "Não compareceu" },
  { status: "Cancelado", icon: XCircle, label: "Cancelar" },
];

export function AppointmentDialog({
  appointment, open, onOpenChange, onChange,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChange: () => void;
}) {
  if (!appointment) return null;
  const a = appointment;

  const setStatus = async (s: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(a.id, { status: s });
      toast.success(`Status: ${s}`);
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atualizar status");
    }
  };
  const remove = async () => {
    try {
      await deleteAppointment(a.id);
      toast.success("Agendamento removido");
      onOpenChange(false);
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg">{a.name}</DialogTitle>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[a.status]}`}>
              {a.status}
            </span>
          </div>
          <DialogDescription className="text-xs">Detalhes do agendamento</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5 rounded-2xl border bg-soft-gradient p-3"
          >
            <Row icon={Tag} label="Tipo" value={a.type} />
            <Row icon={CalendarDays} label="Data" value={formatDateBR(a.date)} />
            <Row icon={Clock} label="Horário" value={a.time} />
            <Row icon={Phone} label="Telefone" value={a.phone} />
            {a.neighborhood && <Row icon={MapPin} label="Bairro/Condomínio" value={a.neighborhood} />}
            {a.notes && <Row icon={FileText} label="Observações" value={a.notes} />}
          </motion.div>
        </AnimatePresence>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild className="bg-brand-gradient text-white hover:opacity-95">
            <a href={clientWhatsAppUrl(a)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp do cliente
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={googleCalendarUrl(a)} target="_blank" rel="noreferrer">
              <CalendarPlus className="h-4 w-4" /> Google Calendar
            </a>
          </Button>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Atualizar status
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ACTIONS.map(({ status, icon: Icon, label }) => (
              <Button
                key={status}
                size="sm"
                variant={a.status === status ? "default" : "outline"}
                onClick={() => setStatus(status)}
                className="rounded-full"
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t pt-3">
          <Button onClick={remove} size="sm" variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Remover agendamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-card/70 px-3 py-2">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
