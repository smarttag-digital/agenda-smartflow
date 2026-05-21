# Reforço de backend, autenticação e segurança

## Escopo aprovado

1. Auditoria + correções no que já existe (RLS, validações backend)
2. Estrutura de auditoria/logs
3. Validação de conflito: UNIQUE no banco + validação amigável em server function
4. Google Calendar com sincronização real (OAuth + tokens criptografados)

## Estado atual

- `appointments` e `user_roles` já têm RLS com policies via `has_role()`.
- Admin já é validado no banco (não só no frontend) via `has_role(auth.uid(), 'admin')`.
- Service role nunca é exposto ao cliente (`client.server.ts` é server-only).
- Lógica de booking hoje vive no cliente — qualquer pessoa pode chamar `supabase.from('appointments').insert(...)` graças ao policy `Anyone can create appointments`.

## Etapa 1 — Hardening do que existe (esta entrega)

### Banco (migration)

**a) Constraint anti-duplicidade**
```sql
CREATE UNIQUE INDEX appointments_unique_slot
  ON public.appointments (date, time)
  WHERE status <> 'Cancelado';
```
Bloqueia 100% no banco, mesmo com requests simultâneos.

**b) Fechar INSERT público**
Remover policy `Anyone can create appointments`. Toda criação passa a ir por server function (validação + service-role insert).

**c) Auditoria**
- Tabela `public.audit_logs` (id, actor_id, actor_email, action, entity_type, entity_id, metadata jsonb, created_at).
- RLS: só admin lê. Insert via service role apenas.
- Triggers em `appointments` (INSERT/UPDATE/DELETE) que gravam em `audit_logs` com `auth.uid()` / `auth.jwt() ->> 'email'` quando disponível.

### Server functions (createServerFn)

- `createPublicAppointment` — valida payload (Zod), checa disponibilidade, insere via `supabaseAdmin`. Captura erro de UNIQUE como mensagem amigável "horário acabou de ser reservado".
- `updateAppointmentStatusFn` — protegida com `requireSupabaseAuth` + checagem `has_role admin`, registra audit log explícito (motivo de cancelamento etc).
- `deleteAppointmentFn` — idem.

### Cliente

- `src/routes/index.tsx` chama `createPublicAppointment` (server fn) em vez de inserir direto via `supabase`.
- `src/hooks/use-appointments.ts` mantém realtime para leitura admin, mas `createAppointment`/`updateAppointmentStatus`/`deleteAppointment` passam a chamar as server fns.
- `attachSupabaseAuth` confirmado em `src/start.ts`.

## Etapa 2 — Google Calendar (próxima entrega)

Não vai nesta migration. Requer:
- Conectar o Google Calendar connector (`standard_connectors--connect`) ou implementar OAuth próprio com tokens criptografados em `admin_integrations` (tabela nova, service-role-only).
- Server function `syncAppointmentToCalendar(appointmentId)` chamada após create/update.
- Webhook/watch opcional para reverso.

Vou pedir confirmação antes de começar a etapa 2.

## Fora de escopo nesta rodada

- Rate limiting (infra do Lovable Cloud não tem primitiva — conforme diretrizes).
- CRM / leads / pipeline / financeiro (módulos inexistentes hoje).
