import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Lock, CalendarDays } from "lucide-react";

export function Navbar() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <header className="sticky top-0 z-40 glass border-b">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">
              SmartFlow <span className="text-brand-gradient">Agenda</span>
            </p>
          </div>
        </Link>
        {isAdmin ? (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <CalendarDays className="h-3.5 w-3.5" /> Agendar
          </Link>
        ) : (
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Lock className="h-3.5 w-3.5" /> Área administrativa
          </Link>
        )}
      </div>
    </header>
  );
}
