# Project Memory

## Core
Ipê Village Check-In — dark theme navy #0F1729, lime green #BFFF00, sky blue #4FC3F7.
Internal tool, no auth. RLS permissive by design.
3 tables: people, registrations, checkins. All via supabaseAdmin (no client-side DB).
Portuguese (pt-BR) UI language.
Brasília time via Intl.DateTimeFormat (America/Sao_Paulo). No external clock API.

## Memories
- [Design tokens](mem://design/tokens) — Full color palette based on ipe.city branding
- [Database schema](mem://features/schema) — people, registrations, checkins tables
- [Access rules](mem://features/access-rules) — Architects/Explorers full access, no Day Pass tag
