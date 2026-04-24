# Screen 02 — Check-In
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Purpose

Core operational screen. Ana (coordinator) uses this all day to check guests in. Must support: (1) select active event, (2) search guest by name, (3) manual check-in button, (4) monitor the live feed of recent check-ins. Speed and clarity are critical — no wasted interactions.

## User Flow Position

Default landing after login (`/`). Accessible from nav as "Check-In" with `LogIn` icon. Stays open throughout the workday.

---

## Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  [nav header — Layout.tsx]                                      │
├─────────────────────────────────────────────────────────────────┤
│  max-w-6xl mx-auto px-8 py-8                                    │
│                                                                 │
│  [SectionBadge: EVENTOS ATIVOS pulse=true]                      │
│  Check-In  [gradient-text on "Check-In"]                        │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Event Card  │ │ Event Card  │ │ Event Card  │               │
│  │ (selected)  │ │             │ │             │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  [AccessWarningBanner — conditional]                            │
│                                                                 │
│  ┌──────────────────────────────┐  [Fazer Check-In →]          │
│  │ 🔍 Buscar pessoa...          │                               │
│  └──────────────────────────────┘                              │
│                                                                 │
│  [SectionBadge: ATIVIDADE RECENTE pulse=true]                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Feed row: avatar · Nome · Evento · Hora · [access badge]   ││
│  │ Feed row: ...                                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Cards

Each event from the current day rendered as a tappable card. Selected event gets **gradient border** (bold bet 4).

**Unselected card:**
```
rounded-xl border border-[--border] bg-[--card] p-4 cursor-pointer
hover: gentle-lift (-translate-y-0.5, shadow deepens, gradient overlay fades in)
```

**Selected card (gradient border — bold bet):**
```
rounded-xl bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF] p-[2px]
  └─ inner: bg-[--card] rounded-[10px] p-4
```

**Card anatomy:**
- Top row: Event name (`text-sm font-semibold text-foreground`) + active/past badge (right-aligned)
  - Active: `SectionBadge` with pulse dot, label "ATIVO"
  - Past: plain Badge, `text-muted-foreground`, no pulse
- Middle: Date + time range `text-xs text-muted-foreground font-mono`
- Bottom: `Progress` bar — present / capacity, Electric Blue fill `bg-[#0052FF]`, track `bg-[--border]`
  - Count label: `text-xs text-muted-foreground tabular-nums`

**Card sizing:** `min-h-[130px]`, desktop `w-full` in grid, mobile `min-w-[200px]` in horizontal scroll.

---

## Access Warning Banner

Conditional — shown when the selected guest (after search) has restricted access.

**Layout:** `rounded-xl border p-4 flex items-start gap-3 mb-4`
**States:**

| Access Type | Border | Background | Icon |
|------------|--------|------------|------|
| Permitted | `border-emerald-500/30` | `bg-emerald-500/5` | `CheckCircle text-emerald-400` |
| Pending | `border-amber-500/30` | `bg-amber-500/5` | `Clock text-amber-400` |
| Blocked | `border-red-500/30` | `bg-red-500/5` | `XCircle text-red-400` |

Container: `bg-[--card] rounded-xl` — uses saas card token not white.
Text: `text-sm text-foreground` for label, `text-xs text-muted-foreground` for detail.

---

## Search + Check-In Row

```
┌──────────────────────────────────────┐  ┌──────────────────────┐
│  🔍  Buscar pessoa...                │  │  Fazer Check-In →    │
└──────────────────────────────────────┘  └──────────────────────┘
```

- Input: `h-12 rounded-xl`, full-width on mobile, `flex-1` on desktop. Electric Blue focus ring.
- Button: Primary gradient, `h-12 rounded-xl px-6`, arrow icon → translates +1 on hover (icon-nudge).
- On mobile: Input full-width, button below full-width.
- Search shows inline dropdown suggestion list (Combobox pattern using `Popover` + `Command`).

---

## Check-In Feed

**Section:** `SectionBadge label="ATIVIDADE RECENTE" pulse={true}` above the feed list.

**Feed row anatomy:**
```
┌─ avatar ─┬─ name + event ──────────────────────┬─ time ─┬─ badge ─┐
│ initials │ Nome Completo                        │ 14:32  │ MEMBRO  │
│  circle  │ text-xs text-muted · Evento Ativo    │        │         │
└──────────┴────────────────────────────────────────────────────────┘
```

- Avatar: `h-9 w-9 rounded-full bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] flex items-center justify-center text-white text-xs font-semibold` — initials from name (gradient icon background — bold bet 3)
- Name: `text-sm font-medium text-foreground`
- Event + timestamp: `text-xs text-muted-foreground`
- Time: `tabular-nums text-xs text-muted-foreground`
- Access badge: existing Badge component with semantic color className

**Row hover:** subtle `bg-[#0052FF]/3` background tint on hover (not full gentle-lift — this is a list, not a card).
**Separator:** `Separator` between rows.

**Inverted contrast section for feed (bold bet 2):**
The feed container uses `inverted-section` class:
```css
.inverted-section {
  background-color: var(--background); /* #0F172A */
  background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  border-radius: 1rem;
  border: 1px solid var(--border);
  padding: 1.5rem;
}
```

---

## States

### Default (event selected, no search yet)
Event cards rendered. Selected event has gradient border. Banner hidden. Search empty. Feed shows latest 20 check-ins.

### Loading (page mount)
- Event cards: `Skeleton` blocks — `rounded-xl h-[130px] animate-pulse` × 3
- Feed: `Skeleton` rows × 5
- Fade-up-stagger entrance once data loads

### Empty (no events today)
- Event card area: empty state card — gradient icon background with `Calendar` icon + "Nenhum evento hoje" + muted text
- Feed: "Sem atividade recente" centered in feed container

### Error (failed to load)
- Toast (Sonner): "Erro ao carregar eventos. Tente novamente." with retry action
- Event cards area: error state card — `AlertCircle` icon + "Erro ao carregar eventos" + retry button (ghost)

### Search result found
- Access warning banner appears with person's access status
- "Fazer Check-In" button becomes active (no longer disabled)

### Search no result
- Inline dropdown shows "Nenhuma pessoa encontrada" empty state
- Suggestion: "+ Novo cadastro" link (ghost, opens Pessoas page or modal)

### Post check-in
- Toast: "✓ [Nome] registrado com sucesso!" — Sonner richColors, green
- Feed row prepends at top with `fade-up` entrance (opacity + translateY)
- Button returns to default state

---

## Interactions

| Trigger | Element | Animation | Spec |
|---------|---------|-----------|------|
| Hover | Event card (unselected) | gentle-lift | -translate-y-0.5, shadow deepens, gradient overlay fades in, 200ms |
| Click | Event card | Selected state → gradient border, instant | No animation — state change is data-driven |
| Hover | Fazer Check-In button | gradient-lift | -translate-y-0.5, accent shadow, 200ms |
| Press | Fazer Check-In button | scale-press | scale-[0.98], 100ms |
| Success | Check-in | Sonner toast slide-in | 300ms ease-out |
| New feed row | Feed prepend | fade-up | opacity+translateY(28→0), 700ms |
| Page load | Content | fade-up-stagger | badge→h1→event cards→search→feed, 0.1s stagger |

---

## Accessibility

**VoiceOver order:**
1. "Eventos ativos" section badge (aria-hidden)
2. Heading "Check-In" (h2)
3. Event cards — each as `role="radio"` in a `role="radiogroup"` ("Selecionar evento")
   - Each card: `aria-label="{nome do evento}, {data}, {count} presentes, {ativo/passado}"`
4. Access warning banner (aria-live="polite")
5. Search input (label: "Buscar pessoa", `role="combobox"`, `aria-expanded`)
6. "Fazer Check-In" button (aria-label: "Fazer check-in para [nome da pessoa selecionada]")
7. Feed section (aria-label: "Atividade recente de check-in")
8. Feed rows: each `role="listitem"`, aria-label: "{nome}, check-in às {hora}, acesso {tipo}"

**Keyboard:**
- Arrow keys navigate event cards (radio group)
- `Enter`/`Space` selects event
- Tab moves to search, then to button
- Feed is not focusable by default — screen reader navigates as list

**Reduced motion:** Disable float-bob, slow-spin, fade-up-stagger. Feed prepend: instant appearance.

---

## Implementation Notes

- Screen maps to `src/routes/index.tsx`
- Event cards sourced from TanStack Query / server functions — existing data layer
- Search: debounced 300ms, minimum 2 chars
- Check-in action: `createServerFn` call in `src/server/checkin.functions.ts`
- Feed: real-time or polled every 30s
- Inverted-section class added to `src/styles.css`
