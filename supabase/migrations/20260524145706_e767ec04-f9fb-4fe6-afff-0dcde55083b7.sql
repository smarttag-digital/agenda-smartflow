
DROP POLICY IF EXISTS "Public can read slot availability" ON public.appointments;
DROP POLICY IF EXISTS "Public can read slot availability columns" ON public.appointments;

CREATE OR REPLACE FUNCTION public.get_slots_for_date(_date date)
RETURNS TABLE(slot_time time without time zone, slot_status appointment_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.time, a.status
  FROM public.appointments a
  WHERE a.date = _date;
$$;

REVOKE ALL ON FUNCTION public.get_slots_for_date(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_slots_for_date(date) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_appointment_public(_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  email text,
  type appointment_type,
  appt_date date,
  appt_time time without time zone,
  neighborhood text,
  notes text,
  status appointment_status,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.name, a.phone, a.email, a.type, a.date, a.time, a.neighborhood, a.notes, a.status, a.created_at
  FROM public.appointments a
  WHERE a.id = _id;
$$;

REVOKE ALL ON FUNCTION public.get_appointment_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_public(uuid) TO anon, authenticated;

-- Remove appointments from realtime publication (PII broadcast)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments';
  END IF;
END $$;

-- Lock down trigger-only SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.grant_admin_on_signup() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_appointment_changes() FROM PUBLIC;
