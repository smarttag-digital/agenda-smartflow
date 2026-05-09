import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarCheck, Sparkles, ShieldCheck, Smartphone,
  Clock, Users, ArrowRight, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartFlow Agenda — Agendamento imobiliário premium" },
      { name: "description", content: "Plataforma de agendamento para imobiliárias e corretores. Visitas, reuniões e captações em poucos cliques." },
      { property: "og:title", content: "SmartFlow Agenda" },
      { property: "og:description", content: "Agendamento imobiliário premium, integrado ao ecossistema SmartFlow." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <InstallPrompt />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-soft-gradient opacity-60" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-gradient opacity-25 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3 w-3 text-primary" />
              Parte do ecossistema SmartFlow
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Agendamentos imobiliários
              <br />
              <span className="text-brand-gradient">simples, rápidos, premium.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Visitas, captações, reuniões e atendimentos sincronizados com a sua agenda — em uma experiência mobile-first.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand-gradient text-white shadow-glow hover:opacity-95">
                <Link to="/agendar">
                  Agendar atendimento <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/admin">Acessar painel</Link>
              </Button>
            </div>
          </motion.div>

          {/* Mockup card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-14 max-w-2xl"
          >
            <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Logo size={42} />
                  <div>
                    <p className="text-sm font-semibold">Visita ao apartamento</p>
                    <p className="text-xs text-muted-foreground">Vila Madalena · 92 m²</p>
                  </div>
                </div>
                <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success-foreground border border-success/30">
                  Confirmado
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {["Seg", "Ter", "Qua"].map((d, i) => (
                  <div
                    key={d}
                    className={`rounded-xl border p-3 ${i === 1 ? "bg-brand-gradient text-white border-transparent" : "bg-background"}`}
                  >
                    <p className="text-[10px] uppercase tracking-wider opacity-80">{d}</p>
                    <p className="mt-1 text-lg font-bold">{14 + i}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {["09:30", "10:00", "10:30", "11:00"].map((h, i) => (
                  <div
                    key={h}
                    className={`rounded-lg border py-2 text-center text-xs font-medium ${i === 1 ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, title: "Calendário inteligente", text: "Bloqueia conflitos e horários passados automaticamente." },
            { icon: Smartphone, title: "Mobile-first", text: "Instalável como app — visual nativo no celular." },
            { icon: ShieldCheck, title: "Login simples", text: "Google, Apple ou sem conta. Você decide." },
            { icon: Clock, title: "Sincronização", text: "Pronto para integrar Google Calendar e WhatsApp." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="inline-flex rounded-xl bg-brand-gradient p-2.5 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Como funciona</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Três passos. Zero atrito.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", icon: Users, title: "Cliente escolhe", text: "Seleciona tipo de atendimento, data e horário disponível." },
              { n: "02", icon: MapPin, title: "Você é avisado", text: "O agendamento aparece no painel e na sua agenda." },
              { n: "03", icon: CalendarCheck, title: "Visita confirmada", text: "Convite enviado, status atualizado, tudo no controle." },
            ].map(({ n, icon: Icon, title, text }) => (
              <div key={n} className="relative rounded-2xl border bg-card p-6 shadow-soft">
                <span className="absolute -top-3 left-6 rounded-full bg-brand-gradient px-2.5 py-0.5 text-xs font-bold text-white">{n}</span>
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center text-white shadow-glow sm:p-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pronto para receber agendamentos?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Comece em segundos. Sem fricção, sem sistema pesado.
          </p>
          <Button asChild size="lg" className="mt-7 bg-white text-primary hover:bg-white/90">
            <Link to="/agendar">Criar primeiro agendamento</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size={22} />
            <span>SmartFlow Agenda</span>
          </div>
          <span>© {new Date().getFullYear()} SmartFlow</span>
        </div>
      </footer>
    </div>
  );
}
