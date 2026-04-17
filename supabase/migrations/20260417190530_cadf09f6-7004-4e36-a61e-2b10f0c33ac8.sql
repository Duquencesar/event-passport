
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS luma_event_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS events_luma_event_id_key ON public.events(luma_event_id) WHERE luma_event_id IS NOT NULL;

ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS luma_guest_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS registrations_luma_guest_id_key ON public.registrations(luma_guest_id) WHERE luma_guest_id IS NOT NULL;

ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS luma_guest_id TEXT;
CREATE INDEX IF NOT EXISTS checkins_luma_guest_id_idx ON public.checkins(luma_guest_id) WHERE luma_guest_id IS NOT NULL;
