# Screen 07 — Import
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Purpose

Data import utility. Carlos imports guest lists from CSV files or pulls them directly from Luma. Infrequent use — before major events. The experience must communicate progress clearly and give confidence that the import completed without errors.

## User Flow Position

Accessible from nav item 6 (`/import`). Utility page, used before events or when onboarding new members.

---

## Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  [nav header — Layout.tsx]                                      │
├─────────────────────────────────────────────────────────────────┤
│  max-w-2xl mx-auto px-8 py-8                                    │
│  (centered utility — max-w-2xl, not full 6xl)                   │
│                                                                 │
│  [SectionBadge: IMPORTAÇÃO pulse=false]                         │
│  Importar Pessoas  [gradient-text "Pessoas"]                    │
│                                                                 │
│  [Tabs: CSV | Luma]                                             │
│                                                                 │
│  ─── CSV Tab ─────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │   ┌──────────────────────────────────────────────────────┐  ││
│  │   │                                                      │  ││
│  │   │  [↑ Upload icon - gradient bg]                       │  ││
│  │   │  Arraste um arquivo CSV aqui                         │  ││
│  │   │  ou clique para selecionar                           │  ││
│  │   │  text-xs muted: .csv · máx. 5 MB                    │  ││
│  │   │                                                      │  ││
│  │   └──────────────────────────────────────────────────────┘  ││
│  │                                                             ││
│  │  [Importar →]  gradient primary                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ─── Progress / Result ───────────────────────────────────────  │
│  [Progress bar — conditionally visible during/after import]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Max-width `max-w-2xl`:** Import is a single-action utility — wide layouts waste space and dilute focus.

---

## Tabs

shadcn `Tabs`:
- `TabsList`: `glass rounded-xl`
- Tabs: **CSV** (Upload icon), **Luma** (external link icon)
- Active tab: Electric Blue text + `bg-[#0052FF]/10` pill background

---

## CSV Tab

### Drop Zone (`ImportDropZone`)

`rounded-xl border-2 border-dashed border-[--border] bg-[--card] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200`

**Idle state:**
- Upload icon: gradient icon bg `h-14 w-14 rounded-xl bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] shadow-[0_4px_14px_rgba(0,82,255,0.3)]` + `Upload h-7 w-7 text-white`
- Heading: `text-sm font-semibold text-foreground mt-4` — "Arraste um arquivo CSV aqui"
- Sub: `text-xs text-muted-foreground mt-1` — "ou clique para selecionar"
- Constraint: `text-xs text-muted-foreground mt-2` — ".csv · máximo 5 MB"

**Drag-over state (dragenter):**
`border-[#0052FF]/60 bg-[#0052FF]/5` — zone border and background shift to Electric Blue tint. Upload icon icon-nudge: `scale-110` on icon container.

**File selected (before import):**
Zone shrinks to a compact file-pill row:
```
┌── FileIcon ──┬── filename.csv ──────────────────┬── × remove ─┐
│  h-5 w-5     │  text-sm font-medium text-fg      │  Ghost btn  │
└──────────────┴───────────────────────────────────┴─────────────┘
```
`rounded-xl border border-[--border] bg-[--card] p-3 flex items-center gap-3`
Remove (×): Ghost icon button — clears selection, returns to idle drop zone.

### Import button

`w-full h-12 rounded-xl` primary gradient, `ArrowRight` icon right. Disabled until file is selected.

**During import:** spinner + "Importando...", `disabled`. Progress section appears below.

---

## Luma Tab

### Content

Card: `rounded-xl border border-[--border] bg-[--card] p-6`

Heading: `"Importar do Luma"` (Calistoga `text-lg`)
Sub-text: `text-sm text-muted-foreground mt-1` — "Importa participantes do próximo evento Luma vinculado."

**Last Luma import row:**
```
┌── Calendar icon ─── text ───────────────────────────────────────┐
│  (muted)            "Última importação: 12 Abr · 47 registros"  │
└──────────────────────────────────────────────────────────────────┘
```

Action button: `"Importar do Luma →"` primary gradient, `w-full h-12 rounded-xl`. `Download` icon left.

**Luma sync note:** `text-xs text-muted-foreground mt-3` — "Certifique-se que o evento está sincronizado em /eventos antes de importar."

---

## Progress Section

Shown below the import card during and after import. Fades in with `fade-up` (700ms).

### During import

```
┌──────────────────────────────────────────────────────────────────┐
│  Importando...                     text-sm font-medium           │
│  ████████████████████░░░░░░░░      Progress bar                  │
│  34 de 120 registros processados   text-xs text-muted tabular-nums│
└──────────────────────────────────────────────────────────────────┘
```

Progress bar: shadcn `Progress` component. Fill: `bg-[#0052FF]`. Track: `bg-[--border]`. `rounded-full`.

### After import — Success

```
┌──────────────────────────────────────────────────────────────────┐
│  ✓  Importação concluída            text-sm font-semibold        │
│  ████████████████████████████      Progress bar 100%             │
│  120 registros importados · 3 ignorados (duplicatas)             │
│                                                                  │
│  [Ver em Pessoas →]  ghost link                                  │
└──────────────────────────────────────────────────────────────────┘
```

Checkmark icon: `CheckCircle2 h-5 w-5 text-emerald-400`.
Summary line: `text-xs text-muted-foreground`.
"Ver em Pessoas" link: Ghost, small, navigates to `/pessoas`.

### After import — Error

```
┌──────────────────────────────────────────────────────────────────┐
│  ✗  Falha na importação             text-sm font-semibold text-destructive │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    Progress bar reset            │
│  Erro ao processar o arquivo. Verifique o formato CSV.           │
│                                                                  │
│  [Tentar novamente]  primary gradient                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## States

### Default (idle, no file)
Drop zone in idle state. Import button disabled. No progress section.

### Loading (page mount)
Skeleton for tab selector + card area. Instantly replaced — no data fetch on mount.

### File selected
Drop zone collapses to file-pill. Import button enabled (gradient-lift on hover).

### Importing
Progress section fades in. Tab switching disabled. Cancel button (optional Ghost) shows — "Cancelar" — though cancel may not be implemented server-side, it resets UI.

### Complete (success)
Progress bar fills to 100%. Success summary. Toast: "✓ Importação concluída — 120 registros." (Sonner green). Import button re-enabled for another import.

### Error
Progress section shows error state. Toast: "Falha na importação." (Sonner destructive).

### Empty (Luma — no event linked)
Luma tab shows: gradient icon bg + `Link` icon + "Nenhum evento Luma vinculado. Configure em /eventos." + "Ir para Eventos" Ghost button.

---

## Interactions

| Trigger | Element | Animation | Spec |
|---------|---------|-----------|------|
| Drag enter | Drop zone | border + bg tint to Electric Blue, icon scale-110 | 150ms ease-out, icon-nudge |
| Drag leave | Drop zone | returns to idle state | 150ms |
| File selected | Drop zone | zone collapses → file-pill | fade + height animate 200ms |
| Hover | Import button | gradient-lift | -translate-y-0.5, accent shadow, 200ms |
| Press | Import button | scale-press | scale-[0.98], 100ms |
| Import start | Progress section | fade-up entrance | 700ms ease |
| Progress update | Progress bar | animated fill | `transition-all duration-300` |
| Success | Progress bar | 100% fill + success state | smooth |
| Page load | Tab + card | fade-up-stagger | badge 0.1s, card 0.2s |

---

## Accessibility

**VoiceOver order:**
1. Section badge "IMPORTAÇÃO" (aria-hidden)
2. Heading "Importar Pessoas" (h1)
3. Tabs: role="tablist"
4. Tab panel

**CSV tab:**
5. Drop zone: `role="button"`, aria-label="Área de upload de CSV. Clique para selecionar arquivo."
6. Hidden `<input type="file" accept=".csv">` triggered by drop zone click
7. File selected: file name announced, remove button (aria-label: "Remover arquivo selecionado")
8. Import button (aria-disabled when no file)

**Progress:**
9. Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100`
10. Status text: `aria-live="polite"` — announces stage changes

**Keyboard:** Tab to drop zone → Enter/Space activates file picker. Tab to Import button → Enter imports.

**Drag-and-drop:** Always provide click-to-upload fallback — drag-and-drop is an enhancement, not the only path.

**Reduced motion:** Drop zone drag animation: instant border/bg color change (no scale). Progress fill: instant.

---

## Implementation Notes

- Route: `src/routes/import.tsx`
- `ImportDropZone`: inline component in `import.tsx`
- File input: `<input type="file" accept=".csv" className="sr-only" ref={fileRef}>` triggered by drop zone click/keydown
- CSV parsing: client-side with `papaparse` (check if installed) or server-side streaming
- Luma import: `createServerFn` — calls Luma API and inserts/upserts persons
- Progress: server-sent events or polling endpoint every 500ms during import
- Tab state: URL search param `?tab=csv|luma`
