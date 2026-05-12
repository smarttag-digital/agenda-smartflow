## Problema

Hoje os agendamentos vivem em `localStorage` (`src/lib/booking-store.ts`). Por isso:
- Dashboard, Agenda e Lista só leem ao montar — não atualizam quando algo muda em outra aba ou sessão.
- Não há "tempo real" possível com `localStorage` entre dispositivos.
- Cada tela tem seu próprio `useState` → estados duplicados e cache inconsistente.

## Solução

1. Criar tabela `appointments` no banco e ativar Supabase Realtime.
2. Criar sistema de papéis (`user_roles` + `has_role`) — admin = papel `admin`.
3. Criar um **único hook compartilhado** `useAppointments()` que:
   - Busca todos os agendamentos do banco
   - Inscreve em mudanças realtime (`postgres_changes`) e atualiza o cache
   - É consumido por Dashboard, Agenda, Lista e Calendário — uma só fonte de verdade

## Banco de dados

Tabela `public.appointments`:
- `name`, `email`, `phone`, `type`, `date` (date), `time` (time), `neighborhood`, `notes`, `status`

Tabela `public.user_roles` + enum `app_role` + função `has_role()` (security definer).

RLS:
- **INSERT**: público (qualquer pessoa pode agendar pelo formulário público — sem login).
- **SELECT / UPDATE / DELETE**: apenas usuários com papel `admin`.

Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments`.

Seed: inserir papel `admin` para o e-mail `vivabemeco@gmail.com` via trigger no signup, ou manualmente após primeiro login.

## Mudanças de código

**Novos**
- `src/hooks/use-appointments.ts` — hook com cache (Map), fetch inicial, subscription realtime, `add/update/remove`. Mantém compatibilidade com a API atual (`STATUS_STYLES`, `formatDateBR`, etc. continuam em `booking-store.ts`).
- `src/hooks/use-is-admin.ts` — checa se sessão tem papel `admin`.

**Refatorados**
- `src/lib/booking-store.ts` — vira **apenas** types + helpers (STATUS_STYLES, STATUS_DOT, formatDateBR, DEFAULT_TIMES). Remove leitura/escrita do localStorage.
- `src/routes/index.tsx` — formulário público chama `supabase.from('appointments').insert(...)` direto (RLS permite).
- `src/routes/admin.index.tsx`, `admin.agenda.tsx`, `admin.agendamentos.tsx` — usam `useAppointments()` em vez de `getAppointments()` + `useState`/`useEffect`.
- `src/components/admin/AppointmentDialog.tsx` — usa `update`/`remove` do hook.
- `AdminAuthGate` — após login, garantir que usuário tenha papel `admin` (via `has_role`); senão, mostra "não autorizado".

**PWA / sucesso** — `sucesso.$id.tsx` busca pelo id no banco em vez do localStorage.

## Comportamento esperado

- Novo agendamento criado em `/` → aparece em < 500ms no Dashboard, Agenda e Lista do admin sem reload.
- Mudança de status no `AppointmentDialog` → cards do dashboard recalculam imediatamente.
- Cancelamento → some do calendário admin sem reload.
- Bloqueio de horário continua local (admin-only, não precisa sincronizar entre dispositivos por enquanto — pode ser migrado depois).

## Migração de dados existentes

Agendamentos hoje em `localStorage` ficam órfãos. Se quiser, adiciono um botão "Importar agendamentos locais" no admin numa próxima iteração. Por padrão começamos limpo.
