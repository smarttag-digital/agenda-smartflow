import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id");
    if (!authorizationId) throw new Error("authorization_id ausente");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return { needsAuth: true as const, details: null };
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return { needsAuth: false as const, details: data };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <Shell>
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar este pedido de autorização: {String((error as Error)?.message ?? error)}
      </p>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border bg-card/80 p-8 text-center shadow-soft backdrop-blur">
        <div className="flex justify-center">
          <Logo size={48} />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

function Consent() {
  const { needsAuth, details } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    if (result?.error) {
      setBusy(false);
      setError("Não foi possível iniciar o login.");
    }
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou um destino.");
      return;
    }
    window.location.href = target;
  }

  if (!ready) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
      </Shell>
    );
  }

  if (needsAuth) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold tracking-tight">Entre para continuar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Faça login para autorizar o acesso à sua agenda.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button onClick={signIn} disabled={busy} className="mt-6 h-11 w-full rounded-xl">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar com Google"}
        </Button>
      </Shell>
    );
  }

  const clientName = details?.client?.name ?? "um aplicativo";

  return (
    <Shell>
      <h1 className="text-lg font-semibold tracking-tight">Conectar {clientName}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Isso permite que {clientName} consulte e atualize seus agendamentos em seu nome.
      </p>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => decide(false)}
          className="h-11 flex-1 rounded-xl"
        >
          Recusar
        </Button>
        <Button disabled={busy} onClick={() => decide(true)} className="h-11 flex-1 rounded-xl">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autorizar"}
        </Button>
      </div>
    </Shell>
  );
}
