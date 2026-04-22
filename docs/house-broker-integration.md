# House Broker Integration

Este app é o intermediário entre `Luma` e o sistema da casa.

Fluxo mínimo:
1. `Luma` alimenta `events`, `people` e `registrations`.
2. O broker projeta apenas convidados do `Luma` em `house_access_grants`.
3. O sistema da casa faz `bootstrap` inicial e depois consome `changes` por cursor.
4. A casa devolve `access-events` com acessos `granted` e `denied`.
5. O broker grava os eventos brutos e materializa presença em `checkins`.

## O que precisa estar pronto

### 1. Banco

Aplicar a migration [20260419103000_house_integration_foundation.sql](/home/arthursalmoria/event-passport/supabase/migrations/20260419103000_house_integration_foundation.sql:1) no banco que a app usa.

Ela cria:
- `house_user_map`
- `house_access_grants`
- `house_access_logs_raw`
- `house_devices`
- `house_sync_state`

### 2. Variáveis de ambiente

Obrigatórias para o broker:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOUSE_API_TOKEN`

Base recomendada:
- copiar `.env.example` para um `.env` local não versionado
- preencher com o projeto Supabase do time

Obrigatórias para o sync do Luma:
- `LUMA_API_KEY`
- `LUMA_CALENDAR_API_ID`

Obrigatória para disparo HTTP externo do sync do Luma:
- `LUMA_SYNC_TOKEN`

Obrigatória para ingestão do webhook do Luma:
- `LUMA_WEBHOOK_TOKEN`

Sem `SUPABASE_SERVICE_ROLE_KEY`, o servidor cai para a publishable key e não deve operar corretamente com as tabelas novas.

### 3. Mapeamento da casa

Popular `house_user_map` com o identificador que o sistema da casa reconhece:
- residentes: `house_user_id` estável da casa
- convidados Luma: opcionalmente um `house_user_id` próprio da casa; se não houver, o broker cai para `people.id`

O `feed` não exporta residentes. Eles continuam apenas no lado da casa / `Control iD` e voltam ao dashboard por `access-events/batch`.

## Endpoints do broker

### Contrato oficial

Leitura pela casa:
- `GET /api/house/v1/feed`
- `GET /api/house/v1/feed?cursor=...`

Escrita de volta para o dashboard:
- `POST /api/house/v1/access-events/batch`

Endpoints auxiliares:
- `GET /api/house/v1/health`
- `POST /api/house/v1/heartbeat`

Os endpoints antigos `bootstrap` e `access-grants/changes` continuam existindo por compatibilidade, mas o sistema da casa deve usar `feed`.

## Ordem recomendada de ativação

1. Aplicar a migration no banco.
2. Configurar `SUPABASE_SERVICE_ROLE_KEY` e `HOUSE_API_TOKEN`.
3. Subir a app.
4. Rodar `feed` sem cursor para a casa puxar o snapshot inicial.
5. Salvar `next_cursor`.
6. Passar a usar `feed?cursor=...` em loop.
7. Quando a casa validar alguém, enviar `access-events/batch`.

## Simulador local da casa

O script [simulate_house_door.py](/home/arthursalmoria/event-passport/scripts/simulate_house_door.py:1) simula esse fluxo.

Exemplos:

```bash
export HOUSE_API_TOKEN=house-test-token
python3 scripts/simulate_house_door.py --base-url http://127.0.0.1:3000 health
python3 scripts/simulate_house_door.py --base-url http://127.0.0.1:3000 heartbeat --device-id door-main
python3 scripts/simulate_house_door.py --base-url http://127.0.0.1:3000 bootstrap
python3 scripts/simulate_house_door.py --base-url http://127.0.0.1:3000 changes
python3 scripts/simulate_house_door.py --base-url http://127.0.0.1:3000 emit-event --house-user-id resident-001 --decision granted
python3 scripts/simulate_house_door.py --base-url http://127.0.0.1:3000 demo-cycle --device-id door-main
```

O script salva cursor e grants em `.house-sim-state.json`.

## Demo completo do diagrama

Além do cliente direto do broker, agora existem dois simuladores para reproduzir o fluxo do desenho:

- [founder_haus_system.py](/home/arthursalmoria/event-passport/scripts/founder_haus_system.py:1)
- [mock_door.py](/home/arthursalmoria/event-passport/scripts/mock_door.py:1)

Eles permitem demonstrar:
- `dashboard -> founder haus system` via `feed`
- `founder haus system -> door` via `GET /door/grants-map`
- `door -> founder haus system` via `POST /door/validate`
- `founder haus system -> dashboard` via `POST /api/house/v1/access-events/batch`

### Subir o Founder Haus System em modo demo

```bash
HOUSE_API_TOKEN=house-test-token \
python3 scripts/founder_haus_system.py serve \
  --host 127.0.0.1 \
  --port 8100 \
  --fixture scripts/fixtures/founder_haus_demo_grants.json \
  --auto-load-fixture
```

Isso sobe um serviço local com estes endpoints:
- `GET /health`
- `GET /grants`
- `GET /door/grants-map`
- `GET /door/entries`
- `POST /sync/bootstrap`
- `POST /sync/changes`
- `POST /sync/heartbeat`
- `POST /sync/load-fixture`
- `POST /dashboard/replay-pending`
- `POST /door/validate`

Na fixture de demo:
- `grants` contém apenas guests vindos do feed
- `residents` representa usuários locais da casa, fora do feed

### Simular a porta

```bash
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 pull-map
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 scan-qr --qr qr-ana-2026-04-19
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 scan-face --house-user-id resident-arthur-001
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 entries
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 demo
```

### Conectar o Founder Haus System no broker real

Se o broker estiver com migration aplicada e envs corretos:

```bash
HOUSE_API_TOKEN=house-test-token \
python3 scripts/founder_haus_system.py serve \
  --host 127.0.0.1 \
  --port 8100 \
  --broker-base-url http://127.0.0.1:3000 \
  --broker-token house-test-token \
  --fixture scripts/fixtures/founder_haus_demo_grants.json
```

Depois:

```bash
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 sync-bootstrap
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 sync-changes
```

No contrato real, isso significa:
- `sync-bootstrap` -> `GET /api/house/v1/feed`
- `sync-changes` -> `GET /api/house/v1/feed?cursor=...`

Se o broker estiver indisponível, o Founder Haus System continua útil em modo fixture para demonstração local.

## Runbook da demo resetável

Fluxo recomendado para repetir a demo sem depender de `LUMA_API_KEY`:

1. Abrir o dashboard e clicar em `Preparar Demo Test`.
2. Confirmar que o evento `Demo Test` apareceu no filtro de eventos do dashboard.
3. Sincronizar a casa:

```bash
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 prepare-demo
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 pull-map
```

4. Executar a demo ponta a ponta:

```bash
python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 demo
```

5. Validar no dashboard:
- `Presentes` deve incluir ao menos um guest e um residente
- `Ausentes / no-show` deve listar guests seeded que nao passaram pela porta
- `Acessos negados` deve mostrar o QR invalido apenas em log bruto

## Verificacao automatizada da demo

Com a app rodando e as envs do Supabase configuradas localmente:

```bash
export HOUSE_API_TOKEN=house-test-token
python3 scripts/verify_house_demo.py --base-url http://127.0.0.1:3000
```

O verificador cobre:
- reset repetido do `Demo Test`
- `feed` com guests apenas
- residentes fora do `feed`
- `granted` de guest e residente criando presenca
- `denied` sem criar `checkin`
- replay idempotente por `house_event_id`
- resolucao dos eventos para o `Demo Test`

## Observações de implementação

- `feed` exporta apenas guests `source = luma`.
- `access-events/batch` grava o bruto com auditoria de resolução e materializa `checkins` em transação única.
- residentes são reconciliados por `house_user_map` e podem virar presença mesmo sem grant no feed.
- `credential_value` de grants do Luma ainda usa `luma_guest_id`, não o payload final de QR offline.
