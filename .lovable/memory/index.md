# Project Memory

## Core
Ipê Village Check-In — dark theme navy #0F1729, lime green #BFFF00, sky blue #4FC3F7.
Internal tool, no auth. RLS permissive by design.
3 tables: people, registrations, checkins. All via supabaseAdmin (no client-side DB).
Portuguese (pt-BR) UI language.
Brasília date keys: use manual UTC-3 shift, NEVER Intl timeZone server-side (Worker ICU can fall back to UTC).

## Memories
- [Design tokens](mem://design/tokens) — Full color palette based on ipe.city branding
- [Database schema](mem://features/schema) — people, registrations, checkins tables
- [Brasília timezone](mem://features/timezone) — Manual UTC-3 offset; Worker ICU pitfall
