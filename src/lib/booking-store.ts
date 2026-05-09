// Lightweight client-side store for v1 (mock). Backend (Cloud) plugs in later.
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

const KEY = "sf_agenda_appointments_v1";

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

export function getAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveAppointments(items: Appointment[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addAppointment(a: Omit<Appointment, "id" | "createdAt" | "status"> & { status?: AppointmentStatus }): Appointment {
  const item: Appointment = {
    ...a,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: a.status ?? "Novo",
  };
  const all = getAppointments();
  all.push(item);
  saveAppointments(all);
  return item;
}

export function updateAppointment(id: string, patch: Partial<Appointment>) {
  const all = getAppointments().map((a) => (a.id === id ? { ...a, ...patch } : a));
  saveAppointments(all);
}

export function removeAppointment(id: string) {
  saveAppointments(getAppointments().filter((a) => a.id !== id));
}

export function isSlotTaken(dateISO: string, time: string): boolean {
  return getAppointments().some(
    (a) => a.date === dateISO && a.time === time && a.status !== "Cancelado",
  );
}

export const DEFAULT_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

export function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return format(new Date(y, m - 1, d), "dd/MM/yyyy");
}
