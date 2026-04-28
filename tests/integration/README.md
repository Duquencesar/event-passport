# Testes de integração

## House / Control iD bridge

```bash
psql -f tests/integration/house-controlid.test.sql
```

Valida `process_house_access_events` end-to-end:

| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Granted + pessoa mapeada | `TEST-INT-EVT-001` | log inserido + checkin auto criado |
| Denied | `TEST-INT-EVT-002` | log inserido, sem checkin |
| Granted mas usuário não-mapeado | `TEST-INT-EVT-003` | log inserido, sem checkin |
| Duplicate `house_event_id` | `TEST-INT-EVT-001` (rep.) | deduplicado |

Também garante que `registrations` e `events` (Luma) **não são modificados**.
Roda dentro de `BEGIN ... ROLLBACK`, então não persiste nada.

### Resultado da última execução
```
batch: {"received": 4, "inserted": 3, "duplicated": 1, "granted_checkins_created": 1}
✅ Todas as asserções passaram
```
