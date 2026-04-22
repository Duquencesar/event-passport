CREATE TABLE public.luma_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'luma',
  event_type TEXT,
  luma_event_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'received'
    CHECK (delivery_status IN ('received', 'processed', 'fallback_full_sync', 'failed')),
  sync_mode TEXT NOT NULL DEFAULT 'unknown'
    CHECK (sync_mode IN ('unknown', 'event', 'full')),
  error_message TEXT,
  request_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_luma_webhook_events_received_at
  ON public.luma_webhook_events(received_at DESC);

CREATE INDEX idx_luma_webhook_events_luma_event_id
  ON public.luma_webhook_events(luma_event_id);

CREATE INDEX idx_luma_webhook_events_delivery_status
  ON public.luma_webhook_events(delivery_status);

ALTER TABLE public.luma_webhook_events ENABLE ROW LEVEL SECURITY;
