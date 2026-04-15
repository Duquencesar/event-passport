
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  time text,
  organizer text,
  location text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on events" ON public.events FOR ALL TO public USING (true) WITH CHECK (true);

-- Add event_id to checkins to link check-ins to specific events
ALTER TABLE public.checkins ADD COLUMN event_id uuid REFERENCES public.events(id);

-- Add event_id to registrations too
ALTER TABLE public.registrations ADD COLUMN event_id uuid REFERENCES public.events(id);
