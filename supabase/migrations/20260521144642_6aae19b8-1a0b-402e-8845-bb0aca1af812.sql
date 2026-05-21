-- 1. Unique slot constraint (active appointments only)
CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_active_slot
  ON public.appointments (date, time)
  WHERE status <> 'Cancelado';

-- 2. Close public INSERT — creation must go through server function
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- 3. Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  actor_id uuid,
  actor_email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON public.audit_logs (entity_type, entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read; no client-side writes (server uses service role)
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Trigger to capture appointment lifecycle automatically
CREATE OR REPLACE FUNCTION public.log_appointment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text := COALESCE((auth.jwt() ->> 'email'), NULL);
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, actor_email, metadata)
    VALUES ('appointment.created', 'appointment', NEW.id, v_actor, v_email,
            jsonb_build_object('date', NEW.date, 'time', NEW.time, 'type', NEW.type, 'status', NEW.status, 'name', NEW.name));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.date IS DISTINCT FROM OLD.date
       OR NEW.time IS DISTINCT FROM OLD.time THEN
      INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, actor_email, metadata)
      VALUES ('appointment.updated', 'appointment', NEW.id, v_actor, v_email,
              jsonb_build_object(
                'from', jsonb_build_object('status', OLD.status, 'date', OLD.date, 'time', OLD.time),
                'to',   jsonb_build_object('status', NEW.status, 'date', NEW.date, 'time', NEW.time)
              ));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, actor_email, metadata)
    VALUES ('appointment.deleted', 'appointment', OLD.id, v_actor, v_email,
            jsonb_build_object('date', OLD.date, 'time', OLD.time, 'name', OLD.name, 'status', OLD.status));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS appointments_audit_trg ON public.appointments;
CREATE TRIGGER appointments_audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.log_appointment_changes();
