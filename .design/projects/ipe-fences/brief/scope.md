# Scope

> Phase: brief | Project: Ipê Fences | Generated: 2026-04-17

---

## What We're Building

A full visual refresh of the **Ipê Village Check-In** app — applying the `saas` design preset's Electric Blue identity, dual-font typography (Calistoga + Inter), and clean card surfaces across all 7 existing pages. The app is already feature-complete; this project upgrades the aesthetic layer without changing business logic.

**Strategy:** Apply saas dark-mode tokens to the existing CSS token system, replace glass utilities with token-based surfaces, introduce Calistoga for display headings, and add saas signature elements (gradient badges, section labels, gradient text on key headings).

---

## Screen List (Prioritised)

| Priority | Screen | Route | Focus |
|----------|--------|-------|-------|
| P0 | Login | `/login` | First impression — auth gate, hero typography, gradient primary button |
| P0 | Check-In | `/` | Core feature — event selection cards, search card, access warning, checkin feed |
| P1 | Pessoas (People) | `/pessoas` | Management — person cards, stats bar, profile modal, tag editor |
| P1 | Dashboard | `/dashboard` | Metrics — stat cards, Recharts integration, section labels |
| P2 | Eventos | `/eventos` | Event management — event list, Luma sync status |
| P2 | Configurações | `/configuracoes` | Admin — Telegram config form, access type reference table |
| P3 | Import | `/import` | Utility — CSV/Luma import UI, progress feedback |

---

## Component Scope

Components touched by this refresh (mapped to saas patterns):

| Component | saas Pattern | Change Type |
|-----------|-------------|-------------|
| `<Button>` default/primary | gradient button | Token-level: primary bg → gradient |
| `<Badge>` | section badge | New variant: `saas-label` with pulse dot |
| `<Input>` | clean input | Token-level: focus ring → Electric Blue |
| Person card (pessoas.tsx) | card + gentle-lift | Shadow depth + hover overlay |
| Event card (index.tsx) | card + gentle-lift | Same; progress bar → Electric Blue |
| Stat card (dashboard.tsx) | inverted section pattern | Dark surface → saas card tokens |
| Access warning banner | semantic colour | Emerald/amber/red stay; container → saas card |
| `<Layout>` header | clean nav | Nav hover → Electric Blue; logo area |
| Section headings (h1/h2) | gradient text | Key words → gradient text treatment |

---

## Project Boundaries

**In scope:**
- CSS token replacement in `src/styles.css` (saas dark tokens → existing vars)
- Typography: add Calistoga + JetBrains Mono via Google Fonts in `__root.tsx`
- Glass utility refactor: convert `.glass*` from white-alpha to token-based vars
- Tailwind/className updates on all 7 pages + Layout
- Section label badge component (`src/components/SectionBadge.tsx`)
- Gradient text utility class

**Out of scope:**
- Business logic, server functions, database schema
- New pages or features
- React Native / mobile app (this is web-only)
- Framer Motion (not installed; use Tailwind animations only)
- Dark/light toggle (app is dark-mode only — keep it)

---

## Success Criteria

1. All 7 pages use Electric Blue (`#0052FF`) as primary — no residual oklch primary literals
2. Login and Check-In pages have at least one Calistoga display heading
3. The stats bar in `/pessoas` and stat cards in `/dashboard` feel like saas inverted-section elements
4. Primary `<Button>` renders the gradient background consistently across all pages
5. Section label badges appear on at least Check-In event selection and Dashboard sections
6. No visual regressions — existing access warning colours (emerald/amber/red) preserved
7. Glass utilities work — surfaces remain elevated, no flat dark sections

---

## Dependencies

| Dependency | Notes |
|-----------|-------|
| Google Fonts | Calistoga + JetBrains Mono — add to `__root.tsx` head |
| `src/styles.css` | Central token file — all CSS var changes go here |
| Existing shadcn tokens | `--primary`, `--ring`, `--border` etc. already wired; we override values only |
| CONCERNS.md issues | Merge conflicts resolved ✅. Dark-mode token block (high severity) — addressed by this project. Duplicate Weekly stats entry fixed ✅. |

---

## Issue Framing

Suggested PR breakdown:

| PR | Scope |
|----|-------|
| PR 1 | Token layer — `src/styles.css` saas token values, glass utility refactor, font imports |
| PR 2 | Layout + shared components — `Layout.tsx`, gradient Button, SectionBadge component |
| PR 3 | P0 pages — Login, Check-In |
| PR 4 | P1 pages — Pessoas, Dashboard |
| PR 5 | P2/P3 pages — Eventos, Configurações, Import |

---

## Related

- [target-adaptations.md](./target-adaptations.md)
- [gap-analysis.md](./gap-analysis.md)
- [file-references.md](./file-references.md)
- [saas.yml](../../branding/_style-saas/patterns/saas.yml)
