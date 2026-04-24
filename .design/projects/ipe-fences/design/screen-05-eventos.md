# Screen 05 — Eventos
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Purpose

Event management screen. Carlos views all events (past and upcoming), sees Luma sync status, and can manually trigger a re-sync. Read-heavy — no complex editing UI. The goal is confidence that the event data is current.

## User Flow Position

Accessible from nav item 4 (`/eventos`). Secondary management page, used weekly rather than daily.

---

## Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  [nav header — Layout.tsx]                                      │
├─────────────────────────────────────────────────────────────────┤
│  max-w-6xl mx-auto px-8 py-8                                    │
│                                                                 │
│  [SectionBadge: EVENTOS LUMA pulse=false]                       │
│  Eventos  [gradient-text "Eventos"]                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [LumaSyncStatus: "Sincronizado há 2h · 14 Abr 16:30"]      ││
│  │                                    [↺ Sincronizar Agora]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Tabs: Todos | Ativos | Passados]                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Event row                                                   ││
│  │ Event row                                                   ││
│  │ ...                                                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Luma Sync Status Bar

Full-width card: `rounded-xl border border-[--border] bg-[--card] p-4 flex items-center justify-between`.

**Left: `LumaSyncStatus` component**
```
┌── status indicator dot ── last sync text ──────────────────────┐
│  ● (pulse if stale > 4h)  "Sincronizado há 2h · 14 Abr 16:30" │
└──────────────────────────────────────────────────────────────────┘
```

- Dot: `h-2 w-2 rounded-full`
  - Fresh (< 4h): `bg-emerald-400` — no pulse
  - Stale (4–24h): `bg-amber-400 animate-pulse` (pulse-dot effect)
  - Error / never: `bg-red-400 animate-pulse`
- Sync time text: `text-sm text-muted-foreground`
- "Luma" wordmark: `text-sm font-semibold text-foreground` + small external link icon

**Right: "Sincronizar Agora" button**
- Primary gradient, `h-9 px-4 rounded-xl text-sm`, `RefreshCw` icon left
- During sync: spinner replaces icon (`animate-spin`), button `disabled`, `"Sincronizando..."`
- Post sync success: Toast "Sincronização concluída — {N} eventos atualizados." (Sonner green)
- Post sync error: Toast "Erro na sincronização. Verifique as configurações." (Sonner destructive)

---

## Tabs

shadcn `Tabs` component:
- `TabsList`: `glass` surface `rounded-xl`, full-width on mobile
- `TabsTrigger`: active state uses Electric Blue text `text-[#0052FF]` + `bg-[#0052FF]/10 rounded-lg` pill background
- Three tabs: **Todos**, **Ativos**, **Passados**

---

## Event List

Container: `rounded-xl border border-[--border] bg-[--card] overflow-hidden divide-y divide-[--border]`

**Event row anatomy:**
```
┌── left block ──────────────────────────────────────────────────────┬── right ──┐
│  ┌─ date block ─┐                                                  │  badge    │
│  │  APR          │  Nome do Evento (text-sm font-semibold)          │  count    │
│  │  14           │  text-xs text-muted · Local ou "Online"         │           │
│  └───────────────┘                                                  │           │
└────────────────────────────────────────────────────────────────────┴───────────┘
```

- Date block: `w-12 flex-shrink-0 rounded-lg bg-[--card] border border-[--border] flex flex-col items-center justify-center py-2`
  - Month: `text-[10px] font-mono uppercase tracking-widest text-[#0052FF]`
  - Day: `text-xl font-[Calistoga] text-foreground leading-none`
- Event name: `text-sm font-semibold text-foreground`
- Event meta (time range + location): `text-xs text-muted-foreground`
- Right: status badge + check-in count
  - Active event: `SectionBadge` with pulse dot, label "ATIVO" — small variant `px-3 py-1 text-[10px]`
  - Past event: plain Badge `text-muted-foreground border-[--border]`, label "PASSADO"
  - Count: `text-xs font-mono tabular-nums text-muted-foreground` — "{N} presentes"
- Row hover: `bg-[#0052FF]/3` tint, 150ms (not full card lift — rows are navigational, not CTA)
- Row click: expandable row (accordion — `details`/`summary` pattern) showing Luma event ID, full participant list count, and external link to Luma event

---

## States

### Default (loaded, Todos tab)
Full event list sorted by date descending. Luma sync bar shows last sync time.

### Loading (mount)
- Sync bar: `Skeleton h-[60px] rounded-xl`
- Tabs: skeleton
- List: 5× row skeletons `h-[72px]` with `animate-pulse`
- Fade-up-stagger on data load

### Empty (no events in selected tab)
Inside list container:
- Gradient icon bg with `Calendar` icon
- `"Nenhum evento encontrado"` heading
- Muted sub-text matching tab:
  - Ativos: "Nenhum evento ativo no momento."
  - Passados: "Nenhum evento registrado ainda."

### Error (sync failed)
`LumaSyncStatus` dot shows red pulse. Toast "Erro na sincronização." with retry.
List falls back to last-known data with stale indicator banner:
`"⚠ Mostrando dados desatualizados — falha na última sincronização."` — amber-tinted info banner at top of list.

### Syncing (in progress)
Button enters spinner/disabled state. Status dot changes to amber pulse with "Sincronizando..." text.

---

## Interactions

| Trigger | Element | Animation | Spec |
|---------|---------|-----------|------|
| Hover | Event row | bg-[#0052FF]/3 tint | 150ms ease-out |
| Click | Event row | Accordion expand | 200ms ease-out, height animate |
| Click | Tab | Active pill slides | 200ms |
| Click | Sincronizar | Button → spinner state | instant icon swap |
| Success | Sync | Toast slide-in | Sonner 300ms |
| Page load | List rows | fade-up-stagger | 0.1s increments, 700ms ease |
| Stale indicator | Sync dot | pulse-dot | 2s infinite |

---

## Accessibility

**VoiceOver order:**
1. Section badge "EVENTOS LUMA" (aria-hidden)
2. Heading "Eventos" (h1)
3. Sync status bar: `role="status"`, aria-label="Status de sincronização com Luma: {last sync text}"
4. "Sincronizar Agora" button
5. Tabs: `role="tablist"`, each tab `role="tab"`, aria-selected
6. Tab panel: `role="tabpanel"`
7. Event list: `role="list"`, each row `role="listitem"`, aria-label="{nome evento}, {data}, {N} presentes, {status}"
8. Expandable row: `aria-expanded`, toggle on Enter/Space

**Keyboard:** Tab → Shift-Tab through tabs + sync button. Arrow keys within tablist. Enter/Space on row to expand.

**Reduced motion:** Row hover: instant tint (no transition). Stagger: instant appear. Sync dot: static color (no pulse).

---

## Implementation Notes

- Route: `src/routes/eventos.tsx`
- Data: TanStack Query. Luma sync: `createServerFn` that calls Luma API and updates DB.
- LumaSyncStatus: inline component in `eventos.tsx`
- Tab state: URL search param `?tab=all|active|past`
- Event row accordion: native `<details><summary>` or controlled state in React — no new dependency
- Sync status polling: refetch last-sync-time every 60s while page is mounted
