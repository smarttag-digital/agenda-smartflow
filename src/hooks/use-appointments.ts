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

export async function createAppointment(input: Omit<Appointment, "id" | "createdAt" | "status"> & { status?: AppointmentStatus }) {
  const payload = {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone,
    type: input.type,
    date: input.date,
    time: input.time,
    neighborhood: input.neighborhood ?? null,
    notes: input.notes ?? null,
    status: input.status ?? "Novo",
  };
  const { data, error } = await supabase.from("appointments").insert(payload).select().single();
  if (error) throw error;
  const row = fromRow(data);
  // Optimistic local update (realtime may also push it)
  if (!cache.some((a) => a.id === row.id)) {
    cache = [row, ...cache];
    emit();
  }
  return row;
}

export async function updateAppointmentStatus(id: string, patch: Partial<Pick<Appointment, "status" | "date" | "time" | "notes" | "neighborhood">>) {
  const { error } = await supabase.from("appointments").update(patch).eq("id", id);
  if (error) throw error;
  // optimistic
  cache = cache.map((a) => (a.id === id ? { ...a, ...patch } as Appointment : a));
  emit();
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
  cache = cache.filter((a) => a.id !== id);
  emit();
}

// Public helper: read minimal slot info (date/time/status) without admin auth
export async function fetchSlotsForDate(dateISO: string): Promise<{ time: string; status: AppointmentStatus }[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("time,status")
    .eq("date", dateISO);
  if (error) {
    console.error("[appointments] fetchSlotsForDate", error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    time: typeof r.time === "string" ? r.time.slice(0, 5) : r.time,
    status: r.status as AppointmentStatus,
  }));
}

// Public helper: fetch a single appointment by id (anyone can read minimal info via the public SELECT policy)
export async function fetchAppointmentById(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return fromRow(data);
}
