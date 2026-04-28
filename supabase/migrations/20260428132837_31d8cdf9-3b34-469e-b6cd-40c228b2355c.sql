-- Expand period support to accept evening and legacy lowercase values from integrations.
ALTER TABLE public.checkins
  DROP CONSTRAINT IF EXISTS checkins_period_check;

ALTER TABLE public.checkins
  ADD CONSTRAINT checkins_period_check
  CHECK (period IN ('Manhã', 'Tarde', 'Noite', 'manha', 'tarde', 'noite'));

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
  provided_event_id TEXT,
  provided_event_name TEXT,
  resolved_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  resolved_event_name TEXT,
  resolution_status TEXT NOT NULL DEFAULT 'pending',
  resolution_strategy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_house_access_logs_raw_occurred_at ON public.house_access_logs_raw(occurred_at);
CREATE INDEX idx_house_access_logs_raw_house_user_id ON public.house_access_logs_raw(house_user_id);
CREATE INDEX idx_house_access_logs_raw_person_id ON public.house_access_logs_raw(person_id);
CREATE INDEX idx_house_access_logs_raw_processed_at ON public.house_access_logs_raw(processed_at);
CREATE INDEX idx_house_access_logs_raw_resolved_event_id ON public.house_access_logs_raw(resolved_event_id);

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

CREATE OR REPLACE FUNCTION public.process_house_access_events(input_events JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_item JSONB;
  received_count INTEGER := 0;
  inserted_count INTEGER := 0;
  duplicated_count INTEGER := 0;
  granted_checkins_created_count INTEGER := 0;

  v_log_id UUID;
  v_house_event_id TEXT;
  v_device_id TEXT;
  v_door_id TEXT;
  v_house_user_id TEXT;
  v_credential_type TEXT;
  v_credential_value TEXT;
  v_decision TEXT;
  v_reason TEXT;
  v_occurred_at TIMESTAMPTZ;
  v_raw_payload JSONB;
  v_provided_event_id TEXT;
  v_provided_event_name TEXT;

  v_person_id UUID;
  v_is_resident BOOLEAN := false;
  v_grant_id UUID;
  v_grant_person_id UUID;
  v_grant_event_id UUID;
  v_grant_payload JSONB := '{}'::jsonb;

  v_resolved_event_id UUID;
  v_resolved_event_name TEXT;
  v_resolution_status TEXT := 'pending';
  v_resolution_strategy TEXT;

  v_access_type TEXT;
  v_luma_guest_id TEXT;
  v_existing_checkin_id UUID;
  v_processed_at TIMESTAMPTZ;

  v_local_timestamp TIMESTAMP;
  v_local_date DATE;
  v_occurred_minutes INTEGER;
  v_total_events INTEGER;
  v_timed_events INTEGER;
  v_candidate_id UUID;
  v_candidate_name TEXT;
  v_candidate_minutes INTEGER;
  v_candidate_count INTEGER;

  rec RECORD;
BEGIN
  IF input_events IS NULL THEN
    RETURN jsonb_build_object('received', 0, 'inserted', 0, 'duplicated', 0, 'granted_checkins_created', 0);
  END IF;
  IF jsonb_typeof(input_events) <> 'array' THEN
    RAISE EXCEPTION 'Body inválido. Esperado array JSON em input_events.';
  END IF;
  received_count := jsonb_array_length(input_events);
  IF received_count = 0 THEN
    RETURN jsonb_build_object('received', 0, 'inserted', 0, 'duplicated', 0, 'granted_checkins_created', 0);
  END IF;

  FOR event_item IN SELECT value FROM jsonb_array_elements(input_events) LOOP
    v_house_event_id := NULLIF(TRIM(event_item ->> 'house_event_id'), '');
    IF v_house_event_id IS NULL THEN
      RAISE EXCEPTION 'house_event_id obrigatório em todos os eventos.';
    END IF;
    v_device_id := NULLIF(TRIM(event_item ->> 'device_id'), '');
    v_door_id := NULLIF(TRIM(event_item ->> 'door_id'), '');
    v_house_user_id := NULLIF(TRIM(event_item ->> 'house_user_id'), '');
    v_credential_type := COALESCE(NULLIF(TRIM(event_item ->> 'credential_type'), ''), 'unknown');
    IF v_credential_type NOT IN ('face', 'qrcode', 'card', 'unknown') THEN
      v_credential_type := 'unknown';
    END IF;
    v_credential_value := NULLIF(TRIM(event_item ->> 'credential_value'), '');
    v_decision := NULLIF(TRIM(event_item ->> 'decision'), '');
    IF v_decision NOT IN ('granted', 'denied') THEN
      RAISE EXCEPTION 'decision inválido para house_event_id %.', v_house_event_id;
    END IF;
    v_reason := NULLIF(TRIM(event_item ->> 'reason'), '');
    v_raw_payload := COALESCE(event_item -> 'raw_payload', '{}'::jsonb);
    v_provided_event_id := NULLIF(TRIM(event_item ->> 'event_id'), '');
    v_provided_event_name := NULLIF(TRIM(event_item ->> 'event_name'), '');

    BEGIN
      v_occurred_at := (event_item ->> 'occurred_at')::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'occurred_at inválido para house_event_id %.', v_house_event_id;
    END;

    v_local_timestamp := timezone('America/Sao_Paulo', v_occurred_at);
    v_local_date := v_local_timestamp::date;
    v_occurred_minutes := (EXTRACT(HOUR FROM v_local_timestamp)::INTEGER * 60) + EXTRACT(MINUTE FROM v_local_timestamp)::INTEGER;

    v_person_id := NULL; v_is_resident := false;
    v_grant_id := NULL; v_grant_person_id := NULL; v_grant_event_id := NULL; v_grant_payload := '{}'::jsonb;
    v_resolved_event_id := NULL; v_resolved_event_name := NULL;
    v_resolution_status := 'pending'; v_resolution_strategy := NULL;

    IF v_house_user_id IS NOT NULL THEN
      SELECT m.person_id, m.is_resident INTO v_person_id, v_is_resident
      FROM public.house_user_map AS m
      WHERE m.house_user_id = v_house_user_id
      ORDER BY m.is_active DESC, m.updated_at DESC LIMIT 1;
    END IF;

    IF v_house_user_id IS NOT NULL THEN
      SELECT g.id, g.person_id, g.event_id, g.payload
      INTO v_grant_id, v_grant_person_id, v_grant_event_id, v_grant_payload
      FROM public.house_access_grants AS g
      WHERE g.source = 'luma' AND g.status = 'active'
        AND g.house_user_id = v_house_user_id
        AND v_occurred_at BETWEEN g.access_start AND g.access_end
      ORDER BY g.access_start DESC, g.updated_at DESC LIMIT 1;
    END IF;

    IF v_grant_id IS NULL AND v_credential_value IS NOT NULL THEN
      SELECT g.id, g.person_id, g.event_id, g.payload
      INTO v_grant_id, v_grant_person_id, v_grant_event_id, v_grant_payload
      FROM public.house_access_grants AS g
      WHERE g.source = 'luma' AND g.status = 'active'
        AND g.credential_type = v_credential_type
        AND g.credential_value = v_credential_value
        AND v_occurred_at BETWEEN g.access_start AND g.access_end
      ORDER BY g.access_start DESC, g.updated_at DESC LIMIT 1;
    END IF;

    v_person_id := COALESCE(v_person_id, v_grant_person_id);

    IF v_provided_event_id IS NOT NULL
       AND v_provided_event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      SELECT e.id, e.name INTO v_resolved_event_id, v_resolved_event_name
      FROM public.events AS e WHERE e.id = v_provided_event_id::uuid LIMIT 1;
      IF v_resolved_event_id IS NOT NULL THEN
        v_resolution_status := 'resolved'; v_resolution_strategy := 'provided_event_id';
      END IF;
    END IF;

    IF v_resolved_event_id IS NULL AND v_grant_event_id IS NOT NULL THEN
      v_resolved_event_id := v_grant_event_id;
      v_resolved_event_name := NULLIF(v_grant_payload ->> 'event_name', '');
      IF v_resolved_event_name IS NULL THEN
        SELECT e.name INTO v_resolved_event_name FROM public.events AS e WHERE e.id = v_grant_event_id LIMIT 1;
      END IF;
      v_resolution_status := 'resolved'; v_resolution_strategy := 'active_grant';
    END IF;

    IF v_resolved_event_id IS NULL AND v_provided_event_name IS NOT NULL THEN
      SELECT COUNT(*) INTO v_total_events FROM public.events AS e
      WHERE e.date = v_local_date AND lower(e.name) = lower(v_provided_event_name);
      IF v_total_events = 1 THEN
        SELECT e.id, e.name INTO v_resolved_event_id, v_resolved_event_name
        FROM public.events AS e WHERE e.date = v_local_date AND lower(e.name) = lower(v_provided_event_name) LIMIT 1;
        v_resolution_status := 'resolved'; v_resolution_strategy := 'provided_event_name';
      ELSIF v_total_events > 1 THEN
        v_resolution_status := 'ambiguous'; v_resolution_strategy := 'multiple_events_same_name';
      END IF;
    END IF;

    IF v_resolved_event_id IS NULL THEN
      SELECT COUNT(*) INTO v_total_events FROM public.events AS e WHERE e.date = v_local_date;
      IF v_total_events = 0 THEN
        v_resolution_status := 'not_found'; v_resolution_strategy := 'no_events_on_date';
      ELSIF v_total_events = 1 THEN
        SELECT e.id, e.name INTO v_resolved_event_id, v_resolved_event_name
        FROM public.events AS e WHERE e.date = v_local_date LIMIT 1;
        v_resolution_status := 'resolved'; v_resolution_strategy := 'single_event_on_date';
      ELSE
        SELECT COUNT(*) INTO v_timed_events FROM public.events AS e
        WHERE e.date = v_local_date AND e.time ~ '^\d{1,2}:\d{2}';
        IF v_timed_events <> v_total_events THEN
          v_resolution_status := 'ambiguous'; v_resolution_strategy := 'multiple_events_with_unknown_time';
        ELSE
          v_candidate_id := NULL; v_candidate_name := NULL; v_candidate_minutes := NULL; v_candidate_count := 0;
          FOR rec IN
            SELECT e.id, e.name,
              (split_part(e.time, ':', 1)::INTEGER * 60 +
               regexp_replace(split_part(e.time, ':', 2), '[^0-9].*$', '')::INTEGER) AS start_minutes
            FROM public.events AS e WHERE e.date = v_local_date
            ORDER BY 3 ASC, e.name ASC
          LOOP
            IF rec.start_minutes <= v_occurred_minutes THEN
              IF v_candidate_minutes IS NULL OR rec.start_minutes > v_candidate_minutes THEN
                v_candidate_id := rec.id; v_candidate_name := rec.name;
                v_candidate_minutes := rec.start_minutes; v_candidate_count := 1;
              ELSIF rec.start_minutes = v_candidate_minutes THEN
                v_candidate_count := v_candidate_count + 1;
              END IF;
            END IF;
          END LOOP;
          IF v_candidate_id IS NULL THEN
            v_resolution_status := 'not_found'; v_resolution_strategy := 'before_first_event';
          ELSIF v_candidate_count > 1 THEN
            v_resolution_status := 'ambiguous'; v_resolution_strategy := 'overlapping_events';
          ELSE
            v_resolved_event_id := v_candidate_id; v_resolved_event_name := v_candidate_name;
            v_resolution_status := 'resolved'; v_resolution_strategy := 'closest_prior_event';
          END IF;
        END IF;
      END IF;
    END IF;

    v_processed_at := NULL;
    v_existing_checkin_id := NULL;
    v_luma_guest_id := NULLIF(v_grant_payload ->> 'luma_guest_id', '');

    IF v_decision = 'granted' AND v_person_id IS NOT NULL THEN
      v_access_type := CASE WHEN v_is_resident THEN 'resident' ELSE 'guest' END;
      DECLARE
        v_period TEXT;
      BEGIN
        v_period := CASE
          WHEN v_occurred_minutes < 12*60 THEN 'manha'
          WHEN v_occurred_minutes < 18*60 THEN 'tarde'
          ELSE 'noite'
        END;

        SELECT id INTO v_existing_checkin_id FROM public.checkins
        WHERE person_id = v_person_id AND date = v_local_date AND period = v_period
          AND ((event_id IS NULL AND v_resolved_event_id IS NULL) OR event_id = v_resolved_event_id)
        LIMIT 1;

        IF v_existing_checkin_id IS NULL THEN
          INSERT INTO public.checkins (person_id, event_id, event_name, period, access_type, source, luma_guest_id, date, checked_in_at)
          VALUES (v_person_id, v_resolved_event_id, v_resolved_event_name, v_period, v_access_type, 'house', v_luma_guest_id, v_local_date, v_occurred_at);
          granted_checkins_created_count := granted_checkins_created_count + 1;
        END IF;
      END;
      v_processed_at := now();
    END IF;

    BEGIN
      INSERT INTO public.house_access_logs_raw (
        house_event_id, device_id, door_id, house_user_id, person_id, grant_id,
        credential_type, credential_value, decision, reason, occurred_at, raw_payload,
        provided_event_id, provided_event_name, resolved_event_id, resolved_event_name,
        resolution_status, resolution_strategy, processed_at
      ) VALUES (
        v_house_event_id, v_device_id, v_door_id, v_house_user_id, v_person_id, v_grant_id,
        v_credential_type, v_credential_value, v_decision, v_reason, v_occurred_at, v_raw_payload,
        v_provided_event_id, v_provided_event_name, v_resolved_event_id, v_resolved_event_name,
        v_resolution_status, v_resolution_strategy, v_processed_at
      );
      inserted_count := inserted_count + 1;
    EXCEPTION WHEN unique_violation THEN
      duplicated_count := duplicated_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'received', received_count,
    'inserted', inserted_count,
    'duplicated', duplicated_count,
    'granted_checkins_created', granted_checkins_created_count
  );
END;
$$;