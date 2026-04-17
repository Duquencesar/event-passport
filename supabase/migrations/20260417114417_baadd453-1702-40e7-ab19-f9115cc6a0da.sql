-- Add source column to distinguish manual vs luma check-ins
ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Avoid duplicate check-ins per person per event
CREATE UNIQUE INDEX IF NOT EXISTS checkins_person_event_uniq
  ON public.checkins (person_id, event_id)
  WHERE event_id IS NOT NULL;

-- Index to speed up lookups by event
CREATE INDEX IF NOT EXISTS checkins_event_id_idx ON public.checkins (event_id);
CREATE INDEX IF NOT EXISTS registrations_event_id_idx ON public.registrations (event_id);