// Types + presentation helpers for appointments.
// The actual data lives in Supabase; use `useAppointments()` from
// `@/hooks/use-appointments` to read/write.
import { format } from "date-fns";

export type AppointmentType = "Compra" | "Venda" | "Locação" | "Visita";
export type AppointmentStatus =
  | "Novo"
  | "Confirmado"
  | "Finalizado"
  | "Cancelado"
  | "Reagendado"
  | "Não compareceu";

export type Appointment = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  type: AppointmentType;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  neighborhood?: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
};

export const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Novo: "bg-info/15 text-info-foreground border-info/30",
  Confirmado: "bg-success/15 text-success-foreground border-success/30",
  Finalizado: "bg-muted text-muted-foreground border-border",
  Cancelado: "bg-destructive/15 text-destructive border-destructive/30",
  Reagendado: "bg-warning/20 text-warning-foreground border-warning/40",
  "Não compareceu": "bg-secondary text-secondary-foreground border-border",
};

export const STATUS_DOT: Record<AppointmentStatus, string> = {
  Novo: "bg-[oklch(0.7_0.16_240)]",
  Confirmado: "bg-[oklch(0.68_0.18_150)]",
  Finalizado: "bg-muted-foreground",
  Cancelado: "bg-[oklch(0.6_0.23_25)]",
  Reagendado: "bg-[oklch(0.82_0.16_85)]",
  "Não compareceu": "bg-muted-foreground",
};

export const DEFAULT_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

export function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return format(new Date(y, m - 1, d), "dd/MM/yyyy");
}
