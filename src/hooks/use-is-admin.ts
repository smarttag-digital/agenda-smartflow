import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin(userId: string | null | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(null);
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("[useIsAdmin]", error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return isAdmin;
}
