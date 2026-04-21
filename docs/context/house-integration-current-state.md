# House Integration Current State

## Branch

Trabalho atual na branch:
- `feat/controlid-house-integration`

## Objetivo do projeto

O projeto quer integrar:
- `Luma` como origem de convidados e elegibilidade
- `Natalia's dashboard` como broker e registro operacional
- `Founder Haus System` como sistema intermediario da casa
- `Door / Control iD` como camada de validacao local

O dashboard deve receber:
- convidados do Luma
- presencas de convidados
- presencas de residentes

## Arquitetura implementada hoje

### Broker no dashboard

Ja existem endpoints HTTP no app para a casa:
- `GET /api/house/v1/feed`
- `POST /api/house/v1/access-events/batch`
- `GET /api/house/v1/health`
- `POST /api/house/v1/heartbeat`
- `GET /api/house/v1/luma-guest`

Arquivos principais:
- [src/server/house.server.ts](/home/arthursalmoria/event-passport/src/server/house.server.ts:1)
- [src/routes/api/house/v1/feed.ts](/home/arthursalmoria/event-passport/src/routes/api/house/v1/feed.ts:1)
- [src/routes/api/house/v1/access-events/batch.ts](/home/arthursalmoria/event-passport/src/routes/api/house/v1/access-events/batch.ts:1)
- [src/routes/api/house/v1/luma-guest.ts](/home/arthursalmoria/event-passport/src/routes/api/house/v1/luma-guest.ts:1)

### Banco para a integracao da casa

Existe migration para:
- `house_user_map`
- `house_access_grants`
- `house_access_logs_raw`
- `house_devices`
- `house_sync_state`

Arquivo:
- [supabase/migrations/20260419103000_house_integration_foundation.sql](/home/arthursalmoria/event-passport/supabase/migrations/20260419103000_house_integration_foundation.sql:1)

### Integracao com Luma

Ja existe sync de:
- eventos
- people
- registrations
- checkins

Arquivos principais:
- [src/server/luma.server.ts](/home/arthursalmoria/event-passport/src/server/luma.server.ts:1)
- [src/server/luma.functions.ts](/home/arthursalmoria/event-passport/src/server/luma.functions.ts:1)
- [src/routes/hooks/luma-sync.ts](/home/arthursalmoria/event-passport/src/routes/hooks/luma-sync.ts:1)

Mudancas recentes no Luma:
- base atualizada para `https://public-api.luma.com/v1`
- sync de guests ajustado para `event_id`
- normalizacao de `pk` do QR
- endpoint auxiliar de lookup por guest id / email / guest key / ticket key / URL do QR

### Demo local

Existe uma pilha de demo local sem depender do broker real:
- [scripts/founder_haus_system.py](/home/arthursalmoria/event-passport/scripts/founder_haus_system.py:1)
- [scripts/mock_door.py](/home/arthursalmoria/event-passport/scripts/mock_door.py:1)
- [scripts/simulate_house_door.py](/home/arthursalmoria/event-passport/scripts/simulate_house_door.py:1)
- [scripts/fixtures/founder_haus_demo_grants.json](/home/arthursalmoria/event-passport/scripts/fixtures/founder_haus_demo_grants.json:1)

Documentacao:
- [docs/house-broker-integration.md](/home/arthursalmoria/event-passport/docs/house-broker-integration.md:1)

## O que funciona hoje

### Pronto para demo

- `Founder Haus System` local funciona
- `mock door` funciona
- QR valido pode ser aceito
- face valida pode ser aceita
- QR invalido pode ser negado
- logs locais de acesso funcionam

### Pronto em codigo, mas dependente de ambiente

- broker com `feed` e `access-events`
- integracao de sync com Luma
- lookup auxiliar do guest do Luma

## O que ainda nao funciona em producao

### Broker real com Supabase

Bloqueios atuais:
- migration `house_*` ainda nao aplicada no banco conectado
- falta `SUPABASE_SERVICE_ROLE_KEY`
- o server cai para `SUPABASE_PUBLISHABLE_KEY` no runtime sem service role

Sintomas ja vistos:
- erro `Could not find the table 'public.house_user_map' in the schema cache`
- `feed` e `access-events` falhando no broker real

### Gaps funcionais

- o `feed` ainda mistura convidados do Luma com residentes
- residentes ainda nao sao tratados como fonte exclusiva da casa / Control iD
- acessos de residentes ainda podem virar `checkin` com `event_id = null`
- `changes` ainda nao e delta real
- `access-events/batch` ainda nao e transacional
- webhook do Luma ainda nao existe
- revogacao de convidados do Luma ainda nao existe
- `/hooks/luma-sync` ainda aceita qualquer Bearer nao vazio

## Modelo desejado

O modelo alvo correto e:
- dashboard envia para a casa apenas convidados do Luma
- residentes continuam 100% no sistema da casa / Control iD
- a casa devolve para o dashboard todos os eventos de acesso
- o dashboard registra convidados e residentes
- o dashboard tenta atribuir cada acesso ao evento ativo

## Observacoes importantes para um novo agente

- a branch ainda tem mudancas locais nao commitadas
- existem arquivos locais que nao devem ir para PR, como `.codex` e `scripts/__pycache__`
- `package-lock.json` esta alterado e precisa ser tratado com cuidado
- a demo local ja e suficiente para mostrar o fluxo, mesmo sem Supabase real

