# Responsive Behavior
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Breakpoints

| Name | Width | Tailwind Prefix |
|------|-------|----------------|
| Mobile | < 640px | default |
| Tablet | 640px – 1024px | `sm:` / `md:` |
| Desktop | > 1024px | `lg:` |

App max-width: `max-w-6xl` (72rem) centered with `mx-auto px-4 md:px-6 lg:px-8`.

---

## Per-Screen Responsive Behavior

### Login (`screen-01`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile | Single column, centered card. Hero right column (animated graphic) hidden below `md:`. Login card fills `max-w-sm` centered. |
| Tablet | Split 50/50. Left: text stack + badge. Right: login card. |
| Desktop | Split 55/45. Left: hero text + decorative graphic (float-bob cards, slow-spin ring). Right: login card surface. |

Login card: always `max-w-sm`, `rounded-2xl`, `glass-strong`.
Hero headline: mobile `text-[2.75rem]`, desktop `text-[5.25rem]` per STYLE.md.

---

### Check-In (`screen-02`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile | Single column. Event selector: horizontal scroll row of cards (`flex overflow-x-auto snap-x`). Search bar full-width. Feed list single column. |
| Tablet | Two columns: event cards grid `grid-cols-2`. Search + warning full-width. Feed full-width below. |
| Desktop | `max-w-6xl`. Event cards `grid-cols-3` or `grid-cols-4` depending on count. Search + warning stacked. Feed with wider row layout. |

Event cards: `min-w-[200px] snap-start` on mobile scroll. Grid gap `gap-4` all breakpoints.

---

### Pessoas (`screen-03`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile | Stats bar: 2×2 grid (`grid-cols-2`). Person cards: `grid-cols-1`. Profile modal: full-screen sheet. |
| Tablet | Stats bar: 4-col row. Person cards: `grid-cols-2`. Profile modal: centered Dialog. |
| Desktop | Stats bar: 4-col row with extra spacing. Person cards: `grid-cols-3` or `grid-cols-4`. Profile modal: Dialog with `max-w-lg`. |

Search + filter controls: stack on mobile, row on tablet+.

---

### Dashboard (`screen-04`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile | Stat cards: `grid-cols-2`. Charts: stacked, full-width. Top attendees table: horizontal scroll. |
| Tablet | Stat cards: `grid-cols-2` or `grid-cols-4`. Charts: side-by-side `grid-cols-2`. |
| Desktop | Stat cards: `grid-cols-4`. Charts: `grid-cols-2` or `grid-cols-3`. Top attendees: full-width table. |

Period selector (Select): full-width on mobile, `w-auto` on desktop, right-aligned.

---

### Eventos (`screen-05`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile | Tabs full-width. Event rows: compact, icon-leading. Luma sync: badge in header. |
| Tablet | Same structure, more horizontal breathing room. |
| Desktop | Two-column potential: event list left, selected event detail panel right (future). Currently single column. |

---

### Configurações (`screen-06`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile | Single column form. Reference table: horizontal scroll. |
| Tablet | Form `max-w-lg`, centered. Table fits viewport. |
| Desktop | Form `max-w-xl` with comfortable padding. Table full-width. |

---

### Import (`screen-07`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile | Tabs full-width. Upload zone stacks below tab selector. Progress: full-width bar. |
| Tablet | Same as mobile but more padding. |
| Desktop | `max-w-2xl` centered — upload utility doesn't benefit from width. |

---

## Touch Targets

All interactive elements: minimum `44×44px` tap area (per Apple HIG). Enforced via:
- Button: `h-10` default (40px) → use `h-12` for primary actions on mobile
- Nav items in Sheet: `h-12 px-4` rows
- Person cards: full card is tappable, `min-h-[80px]`
- Event cards: full card, `min-h-[120px]`

---

## Typography Scaling

| Token | Mobile | Desktop |
|-------|--------|---------|
| Hero h1 | `text-[2.75rem] leading-[1.05]` | `text-[5.25rem] leading-[1.05]` |
| Section h1 | `text-3xl` | `text-4xl` |
| Section h2 | `text-xl` | `text-2xl` |
| Body | `text-sm` | `text-sm` |
| Mono label | `text-xs` | `text-xs` |

Both sizes use Calistoga (display headings) — size only changes, not font.
