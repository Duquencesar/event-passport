ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS week_pass_start_date date;

CREATE INDEX IF NOT EXISTS idx_registrations_day_pass_date
  ON public.registrations(day_pass_date) WHERE day_pass_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_week_pass_start_date
  ON public.registrations(week_pass_start_date) WHERE week_pass_start_date IS NOT NULL;