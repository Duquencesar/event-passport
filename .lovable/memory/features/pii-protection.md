---
name: PII / Email Protection
description: Emails são internos (cruzamento Luma/import) — nunca expostos ao cliente nem na UI
type: constraint
---

# Proteção de emails

Emails são PII e tratados como dados estritamente internos:

- **NUNCA** retornar `email` em payloads de server functions consumidas pelo cliente.
- **NUNCA** exibir email na UI (listas, modais, search results, exports CSV).
- Server functions usam `supabaseAdmin` (service role) e podem ler email para cruzamento (busca por email no Luma sync, dedupe na importação CSV, ILIKE em searchPeople), mas projetam só `id, name, tag` no retorno.
- Busca: o backend ainda faz `ilike` em `email`, mas o resultado para o cliente vem sem o campo.

## DB
- RLS de `people` e `registrations`: `USING (false)` para anon/authenticated. Só service role acessa.
- View `people_safe` (security_invoker) expõe `id, name, tag, created_at` — usar caso algum dia precise leitura direta do cliente.
- `checkins`: SELECT autenticado liberado (sem PII além de FK), INSERT/UPDATE/DELETE só servidor.
- `events`: SELECT autenticado.
- `telegram_*`: sem políticas (só servidor).

## Por quê
Cliente nunca deve receber a lista de emails de inscritos — vazaria 2400+ emails só pelo bundle JS + chave pública.
