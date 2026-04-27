-- Expand period support to accept evening and legacy lowercase values from integrations.
ALTER TABLE public.checkins
  DROP CONSTRAINT IF EXISTS checkins_period_check;

ALTER TABLE public.checkins
  ADD CONSTRAINT checkins_period_check
  CHECK (period IN ('Manhã', 'Tarde', 'Noite', 'manha', 'tarde', 'noite'));

-- Mapping between our people table and identifiers used by the house system.
CREATE TABLE public.house_user_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  house_user_id TEXT NOT NULL UNIQUE,
  is_resident BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  credential_type TEXT NOT NULL DEFAULT 'face'
    CHECK (credential_type IN ('face', 'qrcode', 'card', 'unknown')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_house_user_map_person_id ON public.house_user_map(person_id);
CREATE INDEX idx_house_user_map_resident_active ON public.house_user_map(is_resident, is_active);

-- Projection consumed by the house system.
CREATE TABLE public.house_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  house_user_id TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('luma', 'resident', 'manual')),
  source_ref TEXT NOT NULL,
  grant_scope TEXT NOT NULL CHECK (grant_scope IN ('event', 'day', 'week', 'resident', 'manual')),
  credential_type TEXT NOT NULL CHECK (credential_type IN ('face', 'qrcode', 'card', 'unknown')),
  credential_value TEXT,
  access_start TIMESTAMPTZ NOT NULL,
  access_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'expired')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX house_access_grants_source_ref_key
  ON public.house_access_grants(source, source_ref);
CREATE INDEX idx_house_access_grants_house_user_id ON public.house_access_grants(house_user_id);
CREATE INDEX idx_house_access_grants_updated_at ON public.house_access_grants(updated_at);
CREATE INDEX idx_house_access_grants_status_window
  ON public.house_access_grants(status, access_start, access_end);

-- Raw access events returned by the house system.
CREATE TABLE public.house_access_logs_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_event_id TEXT NOT NULL UNIQUE,
  device_id TEXT,
  door_id TEXT,
  house_user_id TEXT,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  grant_id UUID REFERENCES public.house_access_grants(id) ON DELETE SET NULL,
  credential_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (credential_type IN ('face', 'qrcode', 'card', 'unknown')),
  credential_value TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('granted', 'denied')),
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_house_access_logs_raw_occurred_at ON public.house_access_logs_raw(occurred_at);
CREATE INDEX idx_house_access_logs_raw_house_user_id ON public.house_access_logs_raw(house_user_id);
CREATE INDEX idx_house_access_logs_raw_person_id ON public.house_access_logs_raw(person_id);
CREATE INDEX idx_house_access_logs_raw_processed_at ON public.house_access_logs_raw(processed_at);

-- Heartbeat / sync state for house clients and bridges.
CREATE TABLE public.house_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.house_sync_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.house_user_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_access_logs_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_sync_state ENABLE ROW LEVEL SECURITY;
