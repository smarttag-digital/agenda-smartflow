import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ADMIN_EMAIL } from "@/lib/admin-config";

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
}

export async function assertAdminContext(context: {
  supabase: any;
  userId: string;
  claims: any;
}): Promise<{ userId: string; email: string | null }> {
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

export async function writeAuditLog(entry: {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  actor_id?: string | null;
  actor_email?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    actor_id: entry.actor_id ?? null,
    actor_email: entry.actor_email ?? null,
    metadata: (entry.metadata ?? {}) as any,
  });
  if (error) console.error("[audit] insert failed", error);
}
