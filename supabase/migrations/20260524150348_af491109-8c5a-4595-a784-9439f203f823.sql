
CREATE TABLE IF NOT EXISTS public.availability_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  weekly_hours jsonb NOT NULL,
  blocked_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  interval_min int NOT NULL DEFAULT 30,
  default_duration int NOT NULL DEFAULT 60,
  daily_limit int NOT NULL DEFAULT 8,
  min_notice_hours int NOT NULL DEFAULT 2,
  max_advance_days int NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read availability config"
  ON public.availability_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert availability config"
  ON public.availability_config FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update availability config"
  ON public.availability_config FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.availability_config (id, weekly_hours, blocked_dates, blocked_slots, interval_min, default_duration, daily_limit, min_notice_hours, max_advance_days)
VALUES (
  true,
  '[
    {"enabled": false, "start": "09:00", "end": "18:00"},
    {"enabled": true,  "start": "09:00", "end": "18:00"},
    {"enabled": true,  "start": "09:00", "end": "18:00"},
    {"enabled": true,  "start": "09:00", "end": "18:00"},
    {"enabled": true,  "start": "09:00", "end": "18:00"},
    {"enabled": true,  "start": "09:00", "end": "18:00"},
    {"enabled": false, "start": "09:00", "end": "13:00"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  30, 60, 8, 2, 30
)
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER availability_config_updated_at
  BEFORE UPDATE ON public.availability_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
