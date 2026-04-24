# Design
> Phase: design | Project: Ipê Fences | Generated: 2026-04-22

---

## Screen Chunks

| # | Screen | File | Route | Priority |
|---|--------|------|-------|----------|
| 01 | Login | [screen-01-login.md](./screen-01-login.md) | `/login` | P0 |
| 02 | Check-In | [screen-02-checkin.md](./screen-02-checkin.md) | `/` | P0 |
| 03 | Pessoas | [screen-03-pessoas.md](./screen-03-pessoas.md) | `/pessoas` | P1 |
| 04 | Dashboard | [screen-04-dashboard.md](./screen-04-dashboard.md) | `/dashboard` | P1 |
| 05 | Eventos | [screen-05-eventos.md](./screen-05-eventos.md) | `/eventos` | P2 |
| 06 | Configurações | [screen-06-configuracoes.md](./screen-06-configuracoes.md) | `/configuracoes` | P2 |
| 07 | Import | [screen-07-import.md](./screen-07-import.md) | `/import` | P3 |

---

## Shared Chunks

| Chunk | File | Content |
|-------|------|---------|
| Personas | [shared/personas.md](./shared/personas.md) | Ana (coordinator), Carlos (admin), Beatriz (volunteer) |
| Information Architecture | [shared/information-architecture.md](./shared/information-architecture.md) | App hierarchy, content grouping, nav structure |
| Navigation | [shared/navigation.md](./shared/navigation.md) | Header spec, nav items, active states, responsive |
| Micro-Interactions | [shared/micro-interactions.md](./shared/micro-interactions.md) | Full interaction table, stagger delays, reduced motion |
| Responsive | [shared/responsive.md](./shared/responsive.md) | Per-screen breakpoint behavior, touch targets, type scale |
| Component Plan | [shared/component-plan.md](./shared/component-plan.md) | Reuse / refactor / new (shared) / new (local) / CSS changes |

---

## Design System Applied

**Brand:** _style-saas | **Style preset:** saas (Electric Blue — `#0052FF → #4D7CFF`)

| Decision | Spec |
|----------|------|
| Color | Electric Blue primary; slate dark-mode token set in `src/styles.css` |
| Typography | Calistoga (h1/h2 display), Inter (body), JetBrains Mono (section labels) |
| Cards | `rounded-xl border border-[--border] bg-[--card]` + gentle-lift hover |
| Buttons | Gradient primary `from-[#0052FF] to-[#4D7CFF]` + gradient-lift hover |
| Badges | Pill SectionBadge — `border-[#0052FF]/30 bg-[#0052FF]/5` + pulse dot |
| Inverted sections | `bg-[#0F172A]` + dot-grid texture for stat cards and feeds |
| Gradient text | `bg-clip-text text-transparent` on key headline words |
| Gradient border | `p-[2px] bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF]` for featured cards |
| Animations | float-bob, slow-spin, fade-up-stagger, pulse-dot, gentle-lift, gradient-lift |
| Focus | `ring-2 ring-[#0052FF] ring-offset-2 ring-offset-background` |

---

## Key Bold Bets Applied

1. **Gradient text highlights** — Login h1 ("Ipê Village") and all screen h1 key words
2. **Inverted contrast sections with dot texture** — Stats bar (Pessoas, Dashboard), check-in feed
3. **Animated hero graphic** — Login left column (float-bob cards + slow-spin ring + dot grid)
4. **Gradient border on selected/featured cards** — Selected event card (Check-In), #1 rank (Dashboard top attendees)
5. **Section label badge system** — Every page section opens with `SectionBadge` component

---

## New Components Required

| Component | Path | Used By |
|-----------|------|---------|
| `SectionBadge` | `src/components/SectionBadge.tsx` | All 7 screens |
| `StatCard` | `src/components/StatCard.tsx` | Dashboard, Pessoas |
| `.gradient-text` utility | `src/styles.css` | Login, Check-In |
| `.inverted-section` utility | `src/styles.css` | Dashboard, Pessoas, Check-In |

---

## Implementation Target

`shadcn/ui (New York)` + Tailwind CSS v4 + TanStack Start. See [component-plan.md](./shared/component-plan.md) for full reuse/refactor/new breakdown.
