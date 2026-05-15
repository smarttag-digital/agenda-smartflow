import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Loader2, LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ADMIN_EMAIL } from "@/lib/admin-config";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  children: (ctx: { session: Session; signOut: () => Promise<void> }) => ReactNode;
};

export function AdminAuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const userEmail = session?.user?.email?.trim().toLowerCase() ?? null;
  const isAdmin = userEmail ? userEmail === ADMIN_EMAIL.trim().toLowerCase() : null;

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const signIn = async () => {
    setSigningIn(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/admin",
      });
      if (result.error) {
        toast.error("Não foi possível iniciar o login com Google.");
        setSigningIn(false);
      }
    } catch {
      toast.error("Erro ao iniciar login.");
      setSigningIn(false);
    }
  };

  if (loading || (session && isAdmin === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onSignIn={signIn} signingIn={signingIn} />;
  }

  if (!isAdmin) {
    return <UnauthorizedScreen email={session.user.email ?? ""} onSignOut={signOut} />;
  }

  return <>{children({ session, signOut })}</>;
}

function LoginScreen({ onSignIn, signingIn }: { onSignIn: () => void; signingIn: boolean }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.7_0.18_280/.18),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm rounded-3xl border bg-card/80 p-8 shadow-soft backdrop-blur"
      >
        <div className="flex flex-col items-center text-center">
          <Logo size={52} />
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            SmartFlow <span className="text-brand-gradient">Agenda</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Painel administrativo
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Acesse com sua conta Google autorizada para gerenciar a agenda.
          </p>
        </div>

        <Button
          onClick={onSignIn}
          disabled={signingIn}
          className="mt-7 h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
        >
          {signingIn ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              Entrar com Google
            </>
          )}
        </Button>

        <p className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Acesso restrito ao administrador
        </p>
      </motion.div>
    </div>
  );
}

function UnauthorizedScreen({ email, onSignOut }: { email: string; onSignOut: () => Promise<void> }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border bg-card p-8 text-center shadow-soft"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight">Acesso não autorizado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A conta <span className="font-medium text-foreground">{email}</span> não tem permissão para acessar este painel.
        </p>
        <Button onClick={onSignOut} variant="outline" className="mt-6 w-full rounded-xl">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
