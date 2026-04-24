# File References

> Phase: brief | Project: Ipê Fences | Generated: 2026-04-17

---

## Files to Modify

### Token & Style Layer

| File | Change | Priority |
|------|--------|----------|
| `src/styles.css` | CSS var override (saas dark tokens), glass utility refactor, font vars, new utility classes (`.gradient-text`, shadow vars, animation keyframes) | P0 |
| `src/routes/__root.tsx` | Add Google Fonts `<link>` tags (Calistoga + JetBrains Mono) | P0 |

### Components

| File | Change | Priority |
|------|--------|----------|
| `src/components/ui/button.tsx` | Default variant → gradient background + hover lift | P0 |
| `src/components/Layout.tsx` | Nav hover → Electric Blue; Calistoga for brand name if present | P1 |

### New Files

| File | Purpose | Priority |
|------|---------|----------|
| `src/components/SectionBadge.tsx` | Reusable section label badge with pulse dot | P1 |

### Pages

| File | Key Changes | Priority |
|------|------------|----------|
| `src/routes/login.tsx` | Hero heading → Calistoga; primary button → gradient; layout refresh | P0 |
| `src/routes/index.tsx` | Page title → Calistoga; event cards → gentle-lift; SectionBadge on event section | P0 |
| `src/routes/pessoas.tsx` | Person cards → gentle-lift + gradient overlay; stats bar → gradient icon backgrounds; SectionBadge | P1 |
| `src/routes/dashboard.tsx` | Stat cards → saas card tokens; section headings → Calistoga; replace raw oklch with CSS vars; SectionBadge | P1 |
| `src/routes/eventos.tsx` | Event list → gentle-lift cards; SectionBadge; Luma sync banner polish | P2 |
| `src/routes/configuracoes.tsx` | Form card → saas card; access type table → gradient icon backgrounds; SectionBadge | P2 |
| `src/routes/import.tsx` | Import card → saas tokens; progress feedback polish | P3 |

---

## Files — Read Only (Context)

| File | Purpose |
|------|---------|
| `src/integrations/supabase/types.ts` | Type reference — no visual changes |
| `src/server/*.functions.ts` | No changes — business logic stays |
| `components.json` | shadcn config reference |
| `src/lib/utils.ts` | `cn()` helper — no changes |
| `src/lib/brasilia-time.ts` | Utility — no changes |

---

## Token Files

| File | Purpose |
|------|---------|
| `.design/branding/_style-saas/patterns/saas.yml` | Token source of truth |
| `.design/branding/_style-saas/patterns/STYLE.md` | Agent contract (patterns, effects, code hints) |

---

## Related

- [scope.md](./scope.md)
- [target-adaptations.md](./target-adaptations.md)
- [gap-analysis.md](./gap-analysis.md)
