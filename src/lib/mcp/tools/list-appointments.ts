import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD");

export default defineTool({
  name: "list_appointments",
  title: "Listar agendamentos",
  description:
    "Lista os agendamentos da corretora, com filtros opcionais por intervalo de datas e por status (Novo, Confirmado, Realizado, Cancelado).",
  inputSchema: {
    from: DateSchema.optional().describe("Data inicial (AAAA-MM-DD)."),
    to: DateSchema.optional().describe("Data final (AAAA-MM-DD)."),
    status: z
      .enum(["Novo", "Confirmado", "Realizado", "Cancelado"])
      .optional()
      .describe("Filtrar por status."),
    limit: z.number().int().min(1).max(100).default(25).describe("Máximo de resultados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("appointments")
      .select("id,name,phone,email,type,date,time,neighborhood,notes,status,created_at")
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(limit ?? 25);
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { appointments: data ?? [] },
    };
  },
});
