# Screen 04 — Dashboard
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Purpose

Analytics and reporting screen. Carlos (admin) reviews weekly/monthly attendance trends, identifies top attendees, and validates event participation. The dashboard should feel authoritative — data-dense but visually legible, not visually sparse.

## User Flow Position

Accessible from nav item 3 (`/dashboard`). No entry requirement. Standalone analytics view.

---

## Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  [nav header — Layout.tsx]                                      │
├─────────────────────────────────────────────────────────────────┤
│  max-w-6xl mx-auto px-8 py-8                                    │
│                                                                 │
│  [SectionBadge: ANÁLISE pulse=false]     [Período: Select ▼]   │
│  Dashboard  [gradient-text "Dashboard"]                         │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Total    │ │ Esta     │ │ Novos    │ │ Taxa de  │           │
│  │ Check-ins│ │ Semana   │ │ Membros  │ │ Presença │           │
│  │   1,247  │ │   84     │ │   12     │ │  78%     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌────────────────────────────────────┐ ┌─────────────────────┐│
│  │ [SectionBadge: PRESENÇA SEMANAL]   │ │[SectionBadge: TOP]  ││
│  │                                    │ │                     ││
│  │   Recharts BarChart                │ │  Top Attendees      ││
│  │   (attendance per day of week)     │ │  Table              ││
│  │                                    │ │                     ││
│  └────────────────────────────────────┘ └─────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [SectionBadge: EVENTOS RECENTES]                            ││
│  │   Recharts LineChart (check-ins per event, last 30 days)   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Stat Cards Row

`grid grid-cols-2 lg:grid-cols-4 gap-4`

Each `StatCard` — inverted-section pattern with dot texture (bold bet 2).

```
bg-[#0F172A] rounded-xl border border-[--border] p-5
inverted dot texture (radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px) 32px)
├── top row: gradient icon bg (h-10 w-10 rounded-lg) + optional delta badge (top-right)
│   delta: if positive → "▲ +5%" in emerald, if negative → "▼ -3%" in red, text-xs font-mono
├── value: text-3xl font-[Calistoga] text-white tabular-nums
└── label: text-xs font-mono uppercase tracking-[0.15em] text-[#94A3B8]
```

| Stat | Icon | Notes |
|------|------|-------|
| Total Check-ins | `Activity` | Gradient icon bg; shows delta vs. prior period |
| Esta Semana | `CalendarCheck` | Gradient icon bg; delta vs. last week |
| Novos Membros | `UserPlus` | Gradient icon bg; delta vs. last month |
| Taxa de Presença | `TrendingUp` | Gradient icon bg; percentage value `78%` |

Fade-up-stagger on mount: cards animate in with 0.1s delay increments.

---

## Period Selector

shadcn `Select` right-aligned in the page header row. Options:
- `Última semana` (default)
- `Último mês`
- `Últimos 3 meses`
- `Último ano`

Width: `w-[180px]`, height `h-10 rounded-xl`. Changing period triggers a data refetch (TanStack Query invalidation).

---

## Presença Semanal Chart

Section opens with `SectionBadge label="PRESENÇA SEMANAL" pulse={false}`.

**Recharts `BarChart`:**
- X-axis: days of week (Seg, Ter, Qua, Qui, Sex, Sáb, Dom) — `font-mono text-xs text-muted-foreground`
- Y-axis: check-in count — `tabular-nums text-xs text-muted-foreground`
- Bar fill: `#0052FF` — accent-tinted, `radius={[4, 4, 0, 0]}` on top corners
- Bar hover: `fill="#4D7CFF"` (lighter shade), `Tooltip` styled: `bg-[--card] border border-[--border] rounded-xl shadow-lg px-3 py-2 text-xs`
- Chart container: `rounded-xl border border-[--border] bg-[--card] p-6`
- CartesianGrid: `strokeDasharray="3 3" stroke="var(--border)" opacity={0.5}`

---

## Top Attendees Table

Section opens with `SectionBadge label="MAIS PRESENTES" pulse={false}`.

shadcn `Table` inside `rounded-xl border border-[--border] bg-[--card]`:

| # | Nome | Presenças | Último Check-in | Tipo |
|---|------|-----------|-----------------|------|
| 1 | Avatar + Name | 47 | 18 Abr | Membro badge |

- Row `#`: `text-xs text-muted-foreground tabular-nums`
- Avatar: `h-7 w-7 rounded-full bg-gradient-to-br from-[#0052FF] to-[#4D7CFF]` — initials (gradient icon bg)
- Name: `text-sm font-medium text-foreground`
- Presença count: `text-sm tabular-nums text-foreground font-semibold`
- Last check-in: `text-xs text-muted-foreground`
- Access badge: semantic `Badge` variant
- Row hover: `bg-[#0052FF]/3` background tint (not full lift — this is a table row)
- Top row has gradient border treatment (bold bet 4): outer `div` with `bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF] p-[2px] rounded-xl`, signals #1 rank
- Table shows top 10. "Ver todos" Ghost link below.
- Mobile: horizontal scroll wrapper `overflow-x-auto`

---

## Eventos Recentes Chart

Section opens with `SectionBadge label="EVENTOS RECENTES" pulse={false}`.

**Recharts `LineChart`:**
- X-axis: event names (abbreviated, `font-mono text-xs`)
- Y-axis: total check-ins per event
- Line stroke: `#0052FF` 2px, dots at data points `fill="#0052FF" r={4}`
- Line hover: `fill="#4D7CFF"` dots, Tooltip same style as bar chart
- Container: `rounded-xl border border-[--border] bg-[--card] p-6`
- Area fill under line: `fill="url(#blueGradient)"` — SVG linearGradient from `#0052FF/20` → transparent

**SVG gradient definition (inline):**
```tsx
<defs>
  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#0052FF" stopOpacity={0.2} />
    <stop offset="100%" stopColor="#0052FF" stopOpacity={0} />
  </linearGradient>
</defs>
```

---

## States

### Default (loaded)
All 4 stat cards with real values. Both charts rendered. Top attendees table populated.

### Loading (mount)
- Stat cards: 4× `Skeleton h-[88px] rounded-xl animate-pulse` in grid
- Charts: `Skeleton h-[300px] rounded-xl animate-pulse` placeholders
- Table: 5× row skeletons
- Fade-up-stagger entrance on data resolve

### Empty (no data for period)
- Stat cards: values show `—` (em-dash), muted text
- Charts: empty state inside chart container — `BarChart3` icon (gradient bg) + "Sem dados para o período selecionado" + muted sub-text
- Table: "Nenhum check-in registrado" centered row

### Error
Toast: "Erro ao carregar dashboard." Sonner destructive.
Each section shows error state card with retry Ghost button.

---

## Interactions

| Trigger | Element | Animation | Spec |
|---------|---------|-----------|------|
| Page load | Stat cards | fade-up-stagger | 0.1s per card, 700ms ease |
| Page load | Charts | fade-up | opacity+translateY, 700ms |
| Hover | Bar / Line datapoint | fill shifts to lighter #4D7CFF | 150ms |
| Hover | Table row | bg-[#0052FF]/3 tint | 150ms |
| Change | Period select | Skeleton replaces content | instant swap during refetch |
| Hover | Stat card | subtle scale-[1.01] + shadow deepens | 200ms (not full gentle-lift — stat card is informational, not CTA) |

---

## Accessibility

**VoiceOver order:**
1. Section badge "ANÁLISE" (aria-hidden)
2. Heading "Dashboard" (h1)
3. Period selector (label: "Selecionar período de análise")
4. Stat cards (role="list", aria-label="Métricas do período")
   - Each: role="listitem", aria-label="{label}: {value}"
5. "Presença semanal" section heading (h2)
6. BarChart: `role="img"`, `aria-label="Gráfico de barras: presença por dia da semana"`, data table fallback
7. "Mais presentes" section heading (h2)
8. Table: standard `<table>` with `<caption>Top 10 pessoas mais presentes</caption>`
9. "Eventos recentes" section heading (h2)
10. LineChart: `role="img"`, `aria-label="Gráfico de linha: check-ins por evento"`

**Charts:** Provide `<table>` data fallback inside each chart container, `className="sr-only"`.

**Reduced motion:** Recharts animation prop `isAnimationActive={!prefersReducedMotion}`. Stat card stagger: instant appearance.

---

## Implementation Notes

- Route: `src/routes/dashboard.tsx`
- Data: TanStack Query; period state in URL search param `?period=week`
- Charts: existing `recharts` dependency — already imported in codebase
- StatCard: `src/components/StatCard.tsx` (new shared component — see component-plan)
- Responsive: `grid-cols-2 lg:grid-cols-4` for stat row; charts stack to single column on mobile
- Table mobile: `<div className="overflow-x-auto"><Table>...</Table></div>`
