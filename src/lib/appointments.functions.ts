import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminContext, writeAuditLog } from "@/lib/appointments.server";

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido");
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const TypeSchema = z.enum(["Compra", "Venda", "Locação", "Visita"]);
const StatusSchema = z.enum(["Novo", "Confirmado", "Realizado", "Cancelado"]);

export const getSlotsForDateFn = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ date: DateSchema }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("appointments")
      .select("time,status")
      .eq("date", data.date);
    if (error) {
      console.error("[getSlotsForDateFn]", error);
      throw new Response("Erro ao consultar disponibilidade", { status: 500 });
    }
    return (rows ?? []).map((r: any) => ({
      time: typeof r.time === "string" ? r.time.slice(0, 5) : r.time,
      status: r.status as string,
    }));
  });

export const getAppointmentByIdFn = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error("[getAppointmentByIdFn]", error);
      throw new Response("Erro ao buscar agendamento", { status: 500 });
    }
    return row ?? null;
  });

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail inválido"),
  phone: z.string().trim().min(8).max(30),
  type: TypeSchema,
  date: DateSchema,
  time: TimeSchema,
  neighborhood: z
    .string()
    .trim()
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export const createAppointmentFn = createServerFn({ method: "POST" })
  .inputValidator((input) => CreateSchema.parse(input))
  .handler(async ({ data }) => {
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
    const { userId, email } = await assertAdminContext(context as any);
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
    await writeAuditLog({
      action: "appointment.updated.admin",
      entity_type: "appointment",
      entity_id: data.id,
      actor_id: userId,
      actor_email: email,
      metadata: data.patch as any,
    });
    return { ok: true };
  });

const DeleteSchema = z.object({ id: z.string().uuid() });

export const deleteAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, email } = await assertAdminContext(context as any);
    const { error } = await supabaseAdmin.from("appointments").delete().eq("id", data.id);
    if (error) {
      console.error("[deleteAppointmentFn]", error);
      throw new Response("Falha ao excluir agendamento", { status: 500 });
    }
    await writeAuditLog({
      action: "appointment.deleted.admin",
      entity_type: "appointment",
      entity_id: data.id,
      actor_id: userId,
      actor_email: email,
    });
    return { ok: true };
  });
