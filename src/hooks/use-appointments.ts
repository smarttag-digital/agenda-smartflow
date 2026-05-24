import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Appointment, AppointmentStatus } from "@/lib/booking-store";

// Single source of truth: in-memory cache, hydrated from DB and kept in sync via Realtime.
let cache: Appointment[] = [];
let initialized = false;
let initializing: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function fromRow(r: any): Appointment {
  return {
    id: r.id,
    name: r.name ?? "",
    email: r.email ?? undefined,
    phone: r.phone ?? "",
    type: r.type,
    date: r.date,
    time: typeof r.time === "string" ? r.time.slice(0, 5) : r.time,
    neighborhood: r.neighborhood ?? undefined,
    notes: r.notes ?? undefined,
    status: (r.status ?? "Novo") as AppointmentStatus,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

async function hydrate() {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });
  if (error) {
    console.error("[appointments] hydrate failed", error);
    cache = [];
  } else {
    cache = (data ?? []).map(fromRow);
  }
  emit();
}

let channel: ReturnType<typeof supabase.channel> | null = null;
function ensureSubscribed() {
  if (channel) return;
  channel = supabase
    .channel("appointments-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "appointments" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const row = fromRow(payload.new);
          if (!cache.some((a) => a.id === row.id)) cache = [row, ...cache];
        } else if (payload.eventType === "UPDATE") {
          const row = fromRow(payload.new);
          cache = cache.map((a) => (a.id === row.id ? row : a));
        } else if (payload.eventType === "DELETE") {
          const id = (payload.old as any).id;
          cache = cache.filter((a) => a.id !== id);
        }
        emit();
      },
    )
    .subscribe();
}

function ensureInit() {
  if (initialized || initializing) return;
  initializing = hydrate().finally(() => {
    initialized = true;
    initializing = null;
  });
  ensureSubscribed();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getSnapshot = () => cache;
const getServerSnapshot = () => cache;

export function useAppointments(): Appointment[] {
  useEffect(() => {
    ensureInit();
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function refreshAppointments() {
  await hydrate();
}

import { updateAppointmentFn, deleteAppointmentFn } from "@/lib/appointments.functions";

export async function createAppointment(_input: never): Promise<never> {
  throw new Error("Use createAppointmentFn server function via useServerFn() instead.");
}

export async function updateAppointmentStatus(
  id: string,
  patch: Partial<Pick<Appointment, "status" | "date" | "time" | "notes" | "neighborhood">>,
) {
  await updateAppointmentFn({ data: { id, patch: patch as any } });
  // optimistic — realtime will reconcile
  cache = cache.map((a) => (a.id === id ? ({ ...a, ...patch } as Appointment) : a));
  emit();
}

export async function deleteAppointment(id: string) {
  await deleteAppointmentFn({ data: { id } });
  cache = cache.filter((a) => a.id !== id);
  emit();
}

import { getSlotsForDateFn, getAppointmentByIdFn } from "@/lib/appointments.functions";

// Public helper: read minimal slot info (date/time/status) via secure server function
export async function fetchSlotsForDate(dateISO: string): Promise<{ time: string; status: AppointmentStatus }[]> {
  try {
    const rows = await getSlotsForDateFn({ data: { date: dateISO } });
    return rows.map((r) => ({ time: r.time, status: r.status as AppointmentStatus }));
  } catch (e) {
    console.error("[appointments] fetchSlotsForDate", e);
    return [];
  }
}

// Public helper: fetch a single appointment by id via secure server function
export async function fetchAppointmentById(id: string): Promise<Appointment | null> {
  try {
    const row = await getAppointmentByIdFn({ data: { id } });
    if (!row) return null;
    return fromRow(row);
  } catch (e) {
    console.error("[appointments] fetchAppointmentById", e);
    return null;
  }
}
