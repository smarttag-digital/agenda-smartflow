import { useEffect, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { applyTheme, getSettings } from "@/lib/settings-store";

export function AdminLayout({
  session,
  onSignOut,
  children,
}: {
  session: Session;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    applyTheme(getSettings().theme);
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true;
    setInstalled(standalone);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar session={session} onSignOut={onSignOut} />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">Painel administrativo</span>
            </div>
            {!installed && deferred && (
              <Button
                onClick={install}
                size="sm"
                className="rounded-full bg-brand-gradient text-white hover:opacity-95"
              >
                <Download className="h-3.5 w-3.5" /> Instalar app
              </Button>
            )}
          </header>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
