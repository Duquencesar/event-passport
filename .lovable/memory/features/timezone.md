---
name: Brasília timezone in Worker runtime
description: Always compute Brasília date with manual UTC-3 offset, never rely on Intl timeZone in Cloudflare Worker
type: constraint
---
Cloudflare Workers may lack full ICU data — `Intl.DateTimeFormat` with `timeZone: "America/Sao_Paulo"` can silently return UTC, causing "today" to be off by one day late at night. **Why:** Caused real bug where /eventos and home showed previous day's events.

**How to apply:** `src/lib/brasilia-time.ts` uses fixed `BRASILIA_OFFSET_MS = -3h` to shift UTC manually for date keys. Brasília has no DST since 2019. Don't reintroduce `Intl.DateTimeFormat` for date-key calculations server-side. `formatBrasiliaTime` / `formatBrasiliaLongDate` (display only) can keep using Intl since they run client-side.
