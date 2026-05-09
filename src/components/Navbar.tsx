import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { CalendarPlus, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <header className="sticky top-0 z-40 glass border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">
              SmartFlow <span className="text-brand-gradient">Agenda</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Agendamento imobiliário
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/agendar"><CalendarPlus className="h-4 w-4" /> Agendar</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/admin"><LayoutDashboard className="h-4 w-4" /> Admin</Link>
            </Button>
          )}
          <Button asChild size="sm" className="bg-brand-gradient text-white shadow-glow hover:opacity-95">
            <Link to="/agendar">Agendar agora</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
