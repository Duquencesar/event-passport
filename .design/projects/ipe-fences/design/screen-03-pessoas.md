# Screen 03 — Pessoas
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Purpose

People management screen. Carlos (admin) browses the full member/guest roster, edits tags and access types, and opens detailed profiles. Ana (coordinator) uses it to look up a specific person when check-in search isn't enough. Speed of finding + editing a record is the primary metric.

## User Flow Position

Accessible from nav item 2 (`/pessoas`). Reachable from check-in "Novo cadastro" link when a person isn't found during search.

---

## Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  [nav header — Layout.tsx]                                      │
├─────────────────────────────────────────────────────────────────┤
│  max-w-6xl mx-auto px-8 py-8                                    │
│                                                                 │
│  [SectionBadge: MEMBROS e VISITANTES pulse=false]               │
│  Pessoas  [gradient-text on "Pessoas"]                          │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ MEMBROS  │ │VISITANTES│ │ PENDENTES│ │ BLOQUEADOS│           │
│  │   142    │ │    38    │ │    7     │ │    3     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌───────────────────────────┐  [Filtro: Select ▼] [+ Novo]    │
│  │ 🔍 Buscar pessoa...       │                                  │
│  └───────────────────────────┘                                  │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ Person   │ │ Person   │ │ Person   │                        │
│  │ Card     │ │ Card     │ │ Card     │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│  ... (grid continues, 3-4 cols)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stats Bar

Four inverted stat cards in a `grid-cols-4 gap-4` row. Each uses the `StatCard` component (saas inverted-section pattern with dot texture — bold bet 2).

**StatCard anatomy:**
```
bg-[#0F172A] rounded-xl border border-[--border] p-5
inverted dot texture (radial-gradient 32px)
├── gradient icon bg: h-10 w-10 rounded-lg bg-gradient-to-br from-[#0052FF] to-[#4D7CFF]
│   └── icon: h-5 w-5 text-white
├── value: text-3xl font-[Calistoga] text-white tabular-nums
└── label: text-xs font-mono uppercase tracking-[0.15em] text-[#94A3B8]
```

| Stat | Icon | Color |
|------|------|-------|
| Membros | `Users` | Electric Blue gradient (default) |
| Visitantes | `UserCheck` | Electric Blue gradient |
| Pendentes | `Clock` | amber tinted icon `text-amber-400` on `bg-amber-500/10` |
| Bloqueados | `UserX` | red tinted icon `text-red-400` on `bg-red-500/10` |

Pending and blocked cards: icon bg uses semantic color tint, not Electric Blue. Rest of card stays inverted-section.

---

## Search + Filter Row

```
┌──────────────────────────────────────┐  ┌─────────────────┐  ┌──────────┐
│  🔍  Buscar por nome ou tag...       │  │  Tipo de acesso │  │  + Novo  │
└──────────────────────────────────────┘  └─────────────────┘  └──────────┘
```

- Search input: `h-12 rounded-xl flex-1`, Electric Blue focus ring. Debounced 300ms.
- Filter select (shadcn `Select`): `w-[180px] h-12 rounded-xl`. Options: Todos, Membro, Visitante, Pendente, Bloqueado.
- "Novo" button: Primary gradient, `h-12 px-5 rounded-xl`, `Plus` icon + label.
- Mobile: search full-width, filter + button in 2-col row below.

---

## Person Cards

`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`

**Card anatomy (`PersonCard`):**
```
rounded-xl border border-[--border] bg-[--card] p-4 cursor-pointer
gentle-lift on hover: -translate-y-0.5, shadow md→xl, gradient overlay fades in
relative overflow-hidden group
```

```
┌─ avatar ───┬─ name + meta ─────────────────────────────────────┐
│  initials  │ Nome Completo                    [access badge]   │
│  h-10 w-10 │ text-xs text-muted · último: 12 Apr              │
│  grad bg   ├────────────────────────────────────────────────────│
│            │ [tag chip] [tag chip] [+ 2]                       │
└────────────┴────────────────────────────────────────────────────┘
```

- Avatar: `h-10 w-10 rounded-full bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] flex items-center justify-center text-white text-xs font-semibold` — initials (gradient icon bg — bold bet 3)
- Name: `text-sm font-semibold text-foreground`
- Last seen: `text-xs text-muted-foreground`
- Access badge: `Badge` component — semantic variant (green/amber/red/neutral)
- Tag chips: `text-xs rounded-full px-2 py-0.5 border border-[--border] text-muted-foreground` — up to 2 shown; overflow `+N` chip
- Hover gradient overlay: `absolute inset-0 bg-gradient-to-br from-[#0052FF]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200`

**Card click:** Opens Profile Modal (Dialog).

---

## Profile Modal (Dialog)

`max-w-lg` Dialog, centered on tablet+. Full-screen Sheet on mobile.

**Dialog anatomy:**
```
header: avatar (h-16 w-16 gradient bg) · name · access badge
body:
  ├── Section: Informações — email, telefone, tipo de acesso (Select editable inline)
  ├── Section: Tags — existing tag chips + inline add input
  │   Tag input: h-9 rounded-lg border text-sm, press Enter to add
  │   Tag chip: has × remove button on right
  └── Section: Histórico — last 5 check-ins (date + event name), table-like
footer: [Salvar] gradient primary · [Cancelar] ghost
```

Save confirmation: Toast "Perfil de [Nome] atualizado." (Sonner, green richColors).

---

## States

### Default (loaded)
Stats bar with counts. Search empty, all people visible in grid. 3-4 columns desktop.

### Loading (mount)
Stats bar: 4× `Skeleton` blocks `h-[88px] rounded-xl animate-pulse`.
Grid: 8× `Skeleton` cards `h-[100px] rounded-xl animate-pulse`.
Fade-up-stagger entrance once data loads.

### Empty (no matching search/filter)
Centered empty state inside grid area:
- Gradient icon bg with `Search` icon
- `"Nenhuma pessoa encontrada"` — `text-sm font-medium text-foreground`
- Muted sub-text: `"Tente buscar por outro nome ou remover o filtro."`
- "Limpar filtros" Ghost button

### Error
Toast: `"Erro ao carregar pessoas. Tente novamente."` Sonner destructive.
Grid area: error card — `AlertCircle` icon + retry Ghost button.

### Modal saving
Dialog save button: spinner replaces icon, `disabled`, gradient maintained.
On save error: `"Erro ao salvar. Tente novamente."` — text-destructive below save button.

---

## Interactions

| Trigger | Element | Animation | Spec |
|---------|---------|-----------|------|
| Hover | Person card | gentle-lift | -translate-y-0.5, shadow md→xl, gradient overlay 200ms |
| Click | Person card | Dialog opens | slide-up enter, 200ms ease-out (Radix Dialog) |
| Hover | + Novo button | gradient-lift | -translate-y-0.5, accent shadow, 200ms |
| Press | Any button | scale-press | scale-[0.98], 100ms |
| Page load | Stats bar | fade-up-stagger | 0.1s each card, 700ms ease |
| Page load | Person cards | fade-up-stagger | 0.1s increments, cap 0.6s |
| Tag add | Tag input | chip fades in | opacity 0→1, 200ms |
| Tag remove | × on chip | chip fades out | opacity 1→0, scale 1→0.8, 150ms |

---

## Accessibility

**VoiceOver order:**
1. Section badge "MEMBROS E VISITANTES" (aria-hidden)
2. Heading "Pessoas" (h1)
3. Stats bar (role="list", aria-label="Estatísticas de acesso") — each card role="listitem"
4. Search input (label: "Buscar pessoa", role="searchbox")
5. Filter select (label: "Filtrar por tipo de acesso")
6. "Novo" button
7. Person cards grid (role="list", aria-label="Lista de pessoas")
   - Each card: role="button", aria-label="{nome}, {tipo de acesso}, último check-in {data}"
8. Profile Dialog: focus trap on open, close on Escape, return focus to card on close

**Keyboard:** Tab through search → filter → Novo → first card. Arrow keys within modal form fields. Enter on card opens modal. Escape closes modal.

**Reduced motion:** Disable gentle-lift transform, fade-up-stagger. Cards appear instantly on load.

---

## Implementation Notes

- Route: `src/routes/pessoas.tsx`
- Data: TanStack Query. People list filtered client-side after initial load (list < 500 — no server-side pagination needed initially).
- StatCard: `src/components/StatCard.tsx` (new shared component)
- PersonCard: inline component in `pessoas.tsx`
- Profile modal: `Dialog` component from shadcn
- Tag editing: optimistic update via `createServerFn` — tag add/remove updates local query cache immediately
- Mobile: Dialog replaced with full-height Sheet (`side="bottom"`)
