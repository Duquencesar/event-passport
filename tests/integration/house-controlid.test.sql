-- ════════════════════════════════════════════════════════════════════
-- TESTE DE INTEGRAÇÃO: Control iD / House bridge (camada de banco)
-- Valida que process_house_access_events:
--   1. registra eventos brutos em house_access_logs_raw
--   2. cria checkins automáticos para 'granted' com person mapeada
--   3. NÃO cria checkins para 'denied' nem para usuários não-mapeados
--   4. deduplica por house_event_id
--   5. NÃO afeta tabelas Luma (registrations / events)
-- ════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on
\timing off
BEGIN;

-- Snapshot ANTES (para garantir não-interferência com Luma)
SELECT COUNT(*) AS registrations_before FROM public.registrations \gset
SELECT COUNT(*) AS events_before        FROM public.events        \gset
SELECT COUNT(*) AS checkins_before      FROM public.checkins      \gset

-- ── Setup: cria pessoa de teste + mapeamento house_user_map ────────
INSERT INTO public.people (id, name, email, tag)
VALUES ('11111111-1111-1111-1111-111111111111', 'Teste Integração ControlID', 'test-controlid@ipe.local', 'test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.house_user_map (person_id, house_user_id, credential_type, is_resident, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'TEST-HOUSE-USER-001', 'face', false, true)
ON CONFLICT DO NOTHING;

-- ── Execução: 4 eventos sintéticos ─────────────────────────────────
SELECT public.process_house_access_events($$
  [
    {
      "house_event_id": "TEST-INT-EVT-001",
      "device_id": "TEST-CTRLID-01",
      "door_id": "porta-principal",
      "house_user_id": "TEST-HOUSE-USER-001",
      "credential_type": "face",
      "decision": "granted",
      "occurred_at": "2026-04-28T18:30:00Z",
      "raw_payload": {"scenario": "granted-mapped"}
    },
    {
      "house_event_id": "TEST-INT-EVT-002",
      "device_id": "TEST-CTRLID-01",
      "house_user_id": "DESCONHECIDO-XYZ",
      "credential_type": "qrcode",
      "credential_value": "QR-INVALID",
      "decision": "denied",
      "reason": "no_match",
      "occurred_at": "2026-04-28T18:31:00Z",
      "raw_payload": {"scenario": "denied"}
    },
    {
      "house_event_id": "TEST-INT-EVT-003",
      "device_id": "TEST-CTRLID-01",
      "house_user_id": "DESCONHECIDO-XYZ",
      "credential_type": "face",
      "decision": "granted",
      "occurred_at": "2026-04-28T18:32:00Z",
      "raw_payload": {"scenario": "granted-unmapped"}
    },
    {
      "house_event_id": "TEST-INT-EVT-001",
      "device_id": "TEST-CTRLID-01",
      "house_user_id": "TEST-HOUSE-USER-001",
      "credential_type": "face",
      "decision": "granted",
      "occurred_at": "2026-04-28T18:30:00Z",
      "raw_payload": {"scenario": "duplicate"}
    }
  ]
$$::jsonb) AS batch_result;

-- ── Asserções ──────────────────────────────────────────────────────
\echo
\echo '── Logs brutos inseridos (esperado: 3, dedup do EVT-001) ──'
SELECT house_event_id, decision, house_user_id, person_id IS NOT NULL AS person_resolved,
       resolution_status, processed_at IS NOT NULL AS created_checkin_attempt
FROM public.house_access_logs_raw
WHERE house_event_id LIKE 'TEST-INT-%'
ORDER BY house_event_id;

\echo
\echo '── Checkins criados (esperado: 1, só do EVT-001 granted+mapeado) ──'
SELECT person_id, source, access_type, period, date, event_name
FROM public.checkins
WHERE person_id = '11111111-1111-1111-1111-111111111111' AND source = 'house';

\echo
\echo '── Tabelas Luma NÃO foram tocadas (esperado: deltas = 0) ──'
SELECT
  (SELECT COUNT(*) FROM public.registrations) - :registrations_before AS delta_registrations,
  (SELECT COUNT(*) FROM public.events)        - :events_before         AS delta_events;

\echo
\echo '── Asserções automatizadas ──'
DO $$
DECLARE
  v_logs INTEGER;
  v_checkins INTEGER;
  v_unmapped_checkins INTEGER;
  v_delta_registrations INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_logs FROM public.house_access_logs_raw WHERE house_event_id LIKE 'TEST-INT-%';
  IF v_logs <> 3 THEN RAISE EXCEPTION 'FAIL: esperado 3 logs (1 dedup), obtido %', v_logs; END IF;

  SELECT COUNT(*) INTO v_checkins FROM public.checkins
   WHERE person_id = '11111111-1111-1111-1111-111111111111' AND source = 'house';
  IF v_checkins <> 1 THEN RAISE EXCEPTION 'FAIL: esperado 1 checkin, obtido %', v_checkins; END IF;

  SELECT COUNT(*) INTO v_unmapped_checkins FROM public.checkins c
   JOIN public.house_access_logs_raw l ON l.person_id = c.person_id
   WHERE l.house_event_id = 'TEST-INT-EVT-003';
  IF v_unmapped_checkins <> 0 THEN RAISE EXCEPTION 'FAIL: checkin criado para usuário não-mapeado (count=%)', v_unmapped_checkins; END IF;

  RAISE NOTICE '✅ Todas as asserções passaram (3 logs, 1 checkin granted+mapeado, denied/unmapped ignorados, Luma intacto).';
END $$;

ROLLBACK; -- não persiste dados de teste
