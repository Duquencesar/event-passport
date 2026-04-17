# Project Memory

## Core
Ipê Village Check-In — dark theme navy #0F1729, lime green #BFFF00, sky blue #4FC3F7.
Internal admin tool. Auth required. RLS: people/registrations bloqueados para clientes; só servidor acessa.
**Emails são PII e NUNCA aparecem em respostas ao cliente nem na UI** — uso interno apenas (cruzamento Luma/import).
3 tabelas: people, registrations, checkins + events, telegram_bot_state, telegram_messages.
All server functions use requireSupabaseAuth middleware (except Telegram cron handlers).
Portuguese (pt-BR) UI language.

## Memories
- [Design tokens](mem://design/tokens) — Full color palette based on ipe.city branding
- [Database schema](mem://features/schema) — people, registrations, checkins tables
- [Access rules](mem://features/access-rules) — RLS and server auth enforcement details
- [PII protection](mem://features/pii-protection) — Email handling: server-only, never returned to client
