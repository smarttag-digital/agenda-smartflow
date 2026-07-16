import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminContext, writeAuditLog } from "@/lib/appointments.server";
import { DEFAULT_AVAILABILITY, type Availability } from "@/lib/availability-store";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function rowToAvailability(row: any): Availability {
  if (!row) return DEFAULT_AVAILABILITY;
  return {
    weeklyHours: Array.isArray(row.weekly_hours) ? row.weekly_hours : DEFAULT_AVAILABILITY.weeklyHours,
    blockedDates: Array.isArray(row.blocked_dates) ? row.blocked_dates : [],
    blockedSlots: Array.isArray(row.blocked_slots) ? row.blocked_slots : [],
    interval: (row.interval_min ?? 30) as 15 | 30 | 60,
    defaultDuration: row.default_duration ?? 60,
    dailyLimit: row.daily_limit ?? 8,
    minNoticeHours: row.min_notice_hours ?? 2,
    maxAdvanceDays: row.max_advance_days ?? 30,
  };
}

export const getAvailabilityFn = createServerFn({ method: "GET" }).handler(async () => {
  const supa = serverPublicClient();
  const { data, error } = await supa.from("availability_config").select("*").eq("id", true).maybeSingle();
  if (error) {
    console.error("[getAvailabilityFn]", error);
    throw new Response("Erro ao carregar disponibilidade", { status: 500 });
  }
  return rowToAvailability(data);
});

const DayHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const SaveSchema = z.object({
  weeklyHours: z.array(DayHoursSchema).length(7),
  blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  blockedSlots: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      time: z.string().regex(/^\d{2}:\d{2}$/),
    }),
  ),
  interval: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  defaultDuration: z.number().int().min(15).max(600),
  dailyLimit: z.number().int().min(1).max(200),
  minNoticeHours: z.number().int().min(0).max(720),
  maxAdvanceDays: z.number().int().min(1).max(365),
});

export const saveAvailabilityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SaveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, email } = await assertAdminContext(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("availability_config")
      .upsert({
        id: true,
        weekly_hours: data.weeklyHours as any,
        blocked_dates: data.blockedDates as any,
        blocked_slots: data.blockedSlots as any,
        interval_min: data.interval,
        default_duration: data.defaultDuration,
        daily_limit: data.dailyLimit,
        min_notice_hours: data.minNoticeHours,
        max_advance_days: data.maxAdvanceDays,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      console.error("[saveAvailabilityFn]", error);
      throw new Response("Falha ao salvar disponibilidade", { status: 500 });
    }
    await writeAuditLog({
      action: "availability.updated",
      entity_type: "availability_config",
      actor_id: userId,
      actor_email: email,
      metadata: {
        blockedDates: data.blockedDates.length,
        blockedSlots: data.blockedSlots.length,
        interval: data.interval,
      },
    });
    return { ok: true };
  });
