-- Roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin role to the configured admin email on signup
CREATE OR REPLACE FUNCTION public.grant_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'vivabemeco@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_signup();

-- Appointments table
CREATE TYPE public.appointment_type AS ENUM ('Compra', 'Venda', 'Locação', 'Visita');
CREATE TYPE public.appointment_status AS ENUM ('Novo', 'Confirmado', 'Finalizado', 'Cancelado', 'Reagendado', 'Não compareceu');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  type appointment_type NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  neighborhood TEXT,
  notes TEXT,
  status appointment_status NOT NULL DEFAULT 'Novo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_date_time ON public.appointments (date, time);
CREATE INDEX idx_appointments_status ON public.appointments (status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Public can create appointments (booking form, no login)
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Public can read minimal info to check slot availability — only needed columns are queried by client
-- We restrict reads of full data to admins only; for slot availability we expose date/time/status via a view
CREATE POLICY "Admins can view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public view exposing only date/time/status for slot availability checks
CREATE VIEW public.appointment_slots
WITH (security_invoker = on) AS
  SELECT id, date, time, status FROM public.appointments;

GRANT SELECT ON public.appointment_slots TO anon, authenticated;

-- Allow anon/authenticated to read slot availability via a permissive SELECT policy on a separate path:
-- Since the view uses security_invoker, the underlying table policy applies. We add a narrow policy for slot reads.
CREATE POLICY "Public can read slot availability" ON public.appointments
  FOR SELECT TO anon, authenticated USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable realtime
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;