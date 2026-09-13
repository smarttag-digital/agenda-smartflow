import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_availability",
  title: "Ver disponibilidade",
  description:
    "Retorna as regras de disponibilidade da agenda: horários semanais, duração, intervalo, limite diário, antecedência, datas e horários bloqueados.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("availability_config")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? null) }],
      structuredContent: { availability: data ?? null },
    };
  },
});
