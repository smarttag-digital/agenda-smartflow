
REVOKE EXECUTE ON FUNCTION public.get_slots_for_date(date) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_appointment_public(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
