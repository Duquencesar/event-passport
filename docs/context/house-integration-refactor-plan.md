# House Integration Refactor Plan

## Objetivo da refatoracao

Ajustar a integracao para o seguinte modelo:
- dashboard envia para a casa somente convidados do Luma
- residentes nao sao exportados no `feed`
- residentes sao de responsabilidade do sistema da casa / Control iD
- a casa devolve para o dashboard todos os eventos de acesso
- o dashboard registra presenca de convidados e residentes
- o dashboard tenta vincular o acesso ao evento correto

## Contrato alvo

### Leitura pela casa

- `GET /api/house/v1/feed`
- `GET /api/house/v1/feed?cursor=...`

Sem `cursor`:
- snapshot completo

Com `cursor`:
- delta

### Escrita da casa

- `POST /api/house/v1/access-events/batch`

Payload minimo esperado:
- `house_event_id`
- `device_id`
- `door_id`
- `house_user_id`
- `credential_type`
- `credential_value`
- `decision`
- `occurred_at`

Opcional:
- `event_id`
- `event_name`
- `reason`
- `raw_payload`

## Mudancas necessarias

### 1. Refatorar o feed

No `feed`:
- exportar somente grants `source = luma`
- remover grants `resident` da resposta

Arquivo principal:
- [src/server/house.server.ts](/home/arthursalmoria/event-passport/src/server/house.server.ts:1)

### 2. Manter residentes apenas para reconciliacao

`house_user_map` deve continuar existindo para:
- resolver `house_user_id -> person_id`
- marcar `is_resident`

Mas nao para:
- exportar residente no `feed`

### 3. Resolver evento de acessos de residentes

Quando a casa devolver um acesso:
- se vier `event_id`, usar esse valor
- se nao vier `event_id`, tentar descobrir o evento ativo pelo `occurred_at`

Criar uma funcao do tipo:
- `resolveEventForAccess(occurredAt, doorId?)`

Regras sugeridas:
- se houver um unico evento ativo naquele horario, usar ele
- se houver varios, marcar como ambiguo em log
- se nao houver nenhum, deixar `event_id = null`

### 4. Materializar checkins de residentes

Ao processar `access-events/batch`:
- continuar gravando log bruto
- converter `granted` em `checkin`
- para residente, usar `house_user_map` para achar `person_id`
- vincular ao evento resolvido

### 5. Tornar ingestao transacional

Hoje:
- o bruto pode ser marcado cedo demais

Refatorar para:
- gravar bruto com estado pendente
- materializar `checkin`
- so depois marcar processado

### 6. Corrigir delta do feed

Hoje:
- o rebuild tende a regravar `updated_at`

Refatorar para:
- so alterar `updated_at` quando o grant realmente mudar

### 7. Fechar o lado do Luma

Continuar usando Luma para:
- eventos
- convidados
- elegibilidade
- lookup online do QR pelo `pk`

Adicionar:
- webhook do Luma
- revogacao de convidados
- endurecimento do `/hooks/luma-sync`

## Ordem recomendada

1. refatorar `feed` para guests apenas
2. refatorar `access-events/batch`
3. implementar `resolveEventForAccess`
4. ajustar migration / schema para logs de resolucao
5. atualizar scripts de demo
6. testar ponta a ponta

## Criterio de pronto

A refatoracao esta pronta quando:
- o `feed` exporta so convidados do Luma
- residentes nao aparecem no `feed`
- convidados e residentes entram via `access-events`
- residentes podem aparecer como presentes em um evento
- o log bruto preserva tudo para auditoria
- a demo local reproduz esse comportamento

