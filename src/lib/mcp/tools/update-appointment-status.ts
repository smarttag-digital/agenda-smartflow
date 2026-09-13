import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_appointment_status",
  title: "Atualizar status do agendamento",
  description:
    "Altera o status de um agendamento existente (Novo, Confirmado, Realizado ou Cancelado).",
  inputSchema: {
    id: z.string().uuid().describe("ID do agendamento."),
    status: z
      .enum(["Novo", "Confirmado", "Realizado", "Cancelado"])
      .describe("Novo status do agendamento."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("id,name,date,time,status");
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data || data.length === 0) {
      return {
        content: [{ type: "text", text: "Agendamento não encontrado ou sem permissão." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { appointment: data[0] },
    };
  },
});
