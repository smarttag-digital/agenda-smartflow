# Refatoração completa do Admin — SmartFlow Agenda

Vou reorganizar a área `/admin` em um painel SaaS premium com sidebar, múltiplas páginas e PWA restrito ao admin. Mantenho a área pública (`/`) limpa, sem prompts de instalação.

## 1. Estrutura de rotas (file-based)

```
src/routes/
  index.tsx                       (público, inalterado)
  sucesso.$id.tsx                 (público, inalterado)
  admin.tsx                       (layout: AuthGate + Sidebar + <Outlet/>)
  admin.index.tsx                 (Dashboard)
  admin.agenda.tsx                (Calendário diário/semanal/mensal)
  admin.agendamentos.tsx          (Lista — atual, refinada)
  admin.disponibilidade.tsx       (Horários, bloqueios, regras)
  admin.configuracoes.tsx         (Aparência, perfil, notificações, WhatsApp, Google Calendar)
```

## 2. Componentes novos

- `src/components/admin/AdminSidebar.tsx` — sidebar shadcn (`collapsible="icon"`), itens: Dashboard, Agenda, Agendamentos, Disponibilidade, Configurações; logo no topo, perfil + sair no rodapé.
- `src/components/admin/AdminLayout.tsx` — `SidebarProvider` + `AdminSidebar` + header com `SidebarTrigger` e botão **Instalar app** (PWA prompt aqui, não global).
- `src/components/admin/AppointmentDialog.tsx` — modal com dados completos, botões WhatsApp / Reagendar / Cancelar / mudar status.
- `src/components/admin/CalendarMonth.tsx`, `CalendarWeek.tsx`, `CalendarDay.tsx` — três visualizações estilo Google Calendar (CSS grid puro, sem dependências novas).
- `src/components/admin/ThemeToggle.tsx` — light/dark/system (persistido em `localStorage`, aplica `class="dark"` no `<html>`).

## 3. Stores locais (sem backend nesta rodada)

- `src/lib/availability-store.ts` — persiste em `localStorage`:
  - `weeklyHours: Record<weekday, {start, end, enabled}>`
  - `blockedDates: string[]` (yyyy-mm-dd)
  - `blockedSlots: {date, time}[]`
  - `interval: 15|30|60`
  - `defaultDuration: number`
  - `dailyLimit: number`
  - `minNoticeHours: number`
  - `maxAdvanceDays: number`
- `src/lib/settings-store.ts` — tema, número WhatsApp comercial padrão `+5515997546750`, template de mensagem, flag "sync Google Calendar".
- Atualizar `booking-store.ts` para respeitar `availability-store` ao gerar slots disponíveis na página pública.

## 4. WhatsApp & Google Calendar (client-side)

- `src/lib/whatsapp.ts` — `buildWhatsAppUrl(phone, appointment)` → `https://wa.me/55...?text=...` com template (nome, tipo, data, horário, bairro, observações).
- `src/lib/google-calendar.ts` — gera link `https://calendar.google.com/calendar/render?action=TEMPLATE&...` com título "Visita ao imóvel • Corretora Letícia Souza", descrição completa, lembrete 30min (via `dates` e `details`). Sincronização real via OAuth fica para próxima rodada.
- Botão "Adicionar ao Google Calendar" no modal de agendamento e em `/sucesso/$id`.

## 5. PWA somente no admin

- `public/manifest.webmanifest` → atualizar `start_url` para `/admin` e `scope` para `/admin`.
- Mover `<InstallPrompt />` de `__root.tsx` (se estiver lá) para dentro de `AdminLayout`, e renderizar somente quando `display-mode != standalone` e usuário autenticado.
- Garantir que área pública não inclua o `InstallPrompt`.

## 6. Dashboard

Cards: Hoje, Próximos 7 dias, Confirmados, Cancelados, Reagendados, Não compareceu. Lista "Próximos atendimentos" e "Últimos agendamentos" com badges de status, animações `framer-motion`.

## 7. Configurações

Tabs: **Aparência** (tema), **Perfil** (nome/email/foto da sessão Google), **Notificações** (toggles preparados, sem backend), **WhatsApp** (número editável, preview da mensagem), **Google Calendar** (toggle "Adicionar evento automaticamente" + botão de teste).

## Detalhes técnicos

- Roteamento: arquivos `admin.tsx` (layout com `<Outlet/>`) + `admin.index.tsx` + `admin.<sub>.tsx` (convenção flat dot).
- AuthGate envolve o layout — todas as sub-rotas herdam proteção.
- Sem novas dependências; reutilizo `react-day-picker`, `framer-motion`, `lucide-react`, shadcn sidebar/dialog/tabs/switch já presentes.
- Sem alterações no schema Supabase nesta rodada (tudo client-side com `localStorage`); backend real fica para próxima iteração quando você confirmar.

## Fora do escopo desta rodada (faço depois se quiser)

- Persistência real de agendamentos/disponibilidade no Supabase.
- OAuth do Google Calendar para criação automática de eventos (hoje só link "Adicionar ao Calendar").
- Envio real de WhatsApp/email (hoje só deep links).
