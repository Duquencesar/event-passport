
-- People table
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registrations table (Luma imports)
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'luma',
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Checkins table (attendance log)
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  period TEXT NOT NULL CHECK (period IN ('Manhã', 'Tarde')),
  access_type TEXT NOT NULL,
  event_name TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_people_email ON public.people(email);
CREATE INDEX idx_people_name ON public.people USING gin(to_tsvector('simple', name));
CREATE INDEX idx_checkins_date ON public.checkins(date);
CREATE INDEX idx_checkins_person_date ON public.checkins(person_id, date);
CREATE INDEX idx_registrations_person ON public.registrations(person_id);

-- RLS disabled (internal tool)
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth required)
CREATE POLICY "Allow all on people" ON public.people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on checkins" ON public.checkins FOR ALL USING (true) WITH CHECK (true);
