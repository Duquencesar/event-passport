CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_unique_person_event_date_period
ON public.checkins (
  person_id,
  COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid),
  date,
  lower(period)
);