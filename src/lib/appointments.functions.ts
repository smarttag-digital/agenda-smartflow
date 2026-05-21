import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ADMIN_EMAIL } from "@/lib/admin-config";

// ------- Validation -------
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido");
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

const TypeSchema = z.enum(["Visita", "Avaliação", "Reunião", "Outro"]);
const StatusSchema = z.enum(["Novo", "Confirmado", "Realizado", "Cancelado"]);

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  phone: z.string().trim().min(8).max(30),
  type: TypeSchema,
  date: DateSchema,
  time: TimeSchema,
  neighborhood: z.string().trim().max(160).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  notes: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

// ------- Helpers -------
function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
}

async function assertAdmin(context: { supabase: any; userId: string; claims: any }) {
  const email = (context.claims?.email as string | undefined) ?? null;
  if (isAdminEmail(email)) return { userId: context.userId, email };
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) {
    throw new Response("Forbidden", { status: 403 });
  }
  return { userId: context.userId, email };
}

// ------- Public: create appointment -------
export const createAppointmentFn = createServerFn({ method: "POST" })
  .inputValidator((input) => CreateSchema.parse(input))
  .handler(async ({ data }) => {
    // Backend conflict check (friendly) — UNIQUE index is the final safety net.
    const { data: existing, error: checkErr } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("date", data.date)
      .eq("time", data.time)
      .neq("status", "Cancelado")
      .maybeSingle();
    if (checkErr) {
      console.error("[createAppointmentFn] availability check", checkErr);
      throw new Response("Erro ao verificar disponibilidade", { status: 500 });
    }
    if (existing) {
      throw new Response("Este horário acabou de ser reservado. Escolha outro.", { status: 409 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        name: data.name,
        email: data.email ?? null,
        phone: data.phone,
        type: data.type,
        date: data.date,
        time: data.time,
        neighborhood: data.neighborhood ?? null,
        notes: data.notes ?? null,
        status: "Novo",
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        throw new Response("Este horário acabou de ser reservado. Escolha outro.", { status: 409 });
      }
      console.error("[createAppointmentFn] insert", error);
      throw new Response("Não foi possível criar o agendamento", { status: 500 });
    }
    return { id: inserted.id as string };
  });

// ------- Admin: update -------
const UpdateSchema = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      status: StatusSchema.optional(),
      date: DateSchema.optional(),
      time: TimeSchema.optional(),
      neighborhood: z.string().trim().max(160).nullable().optional(),
      notes: z.string().trim().max(1000).nullable().optional(),
    })
    .refine((p) => Object.keys(p).length > 0, "Nada para atualizar"),
});

export const updateAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { email } = await assertAdmin(context as any);

    // If date/time changes, re-check availability against the unique slot.
    if (data.patch.date || data.patch.time) {
      const { data: current } = await supabaseAdmin
        .from("appointments")
        .select("date,time,status")
        .eq("id", data.id)
        .maybeSingle();
      const newDate = data.patch.date ?? current?.date;
      const newTime = data.patch.time ?? current?.time;
      const newStatus = data.patch.status ?? current?.status;
      if (newDate && newTime && newStatus !== "Cancelado") {
        const { data: clash } = await supabaseAdmin
          .from("appointments")
          .select("id")
          .eq("date", newDate)
          .eq("time", newTime)
          .neq("status", "Cancelado")
          .neq("id", data.id)
          .maybeSingle();
        if (clash) {
          throw new Response("Já existe um agendamento neste horário.", { status: 409 });
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("appointments")
      .update(data.patch as any)
      .eq("id", data.id);
    if (error) {
      if ((error as any).code === "23505") {
        throw new Response("Já existe um agendamento neste horário.", { status: 409 });
      }
      console.error("[updateAppointmentFn]", error);
      throw new Response("Falha ao atualizar agendamento", { status: 500 });
    }
    // Extra audit entry for explicit admin context (trigger also logs).
    await supabaseAdmin.from("audit_logs").insert({
      action: "appointment.updated.admin",
      entity_type: "appointment",
      entity_id: data.id,
      actor_id: context.userId,
      actor_email: email ?? null,
      metadata: data.patch as any,
    });
    return { ok: true };
  });

// ------- Admin: delete -------
const DeleteSchema = z.object({ id: z.string().uuid() });

export const deleteAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { email } = await assertAdmin(context as any);
    const { error } = await supabaseAdmin.from("appointments").delete().eq("id", data.id);
    if (error) {
      console.error("[deleteAppointmentFn]", error);
      throw new Response("Falha ao excluir agendamento", { status: 500 });
    }
    await supabaseAdmin.from("audit_logs").insert({
      action: "appointment.deleted.admin",
      entity_type: "appointment",
      entity_id: data.id,
      actor_id: context.userId,
      actor_email: email ?? null,
      metadata: {},
    });
    return { ok: true };
  });
