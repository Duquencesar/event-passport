# Component Plan
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20
> Target: shadcn/ui (New York) + Tailwind v4 + TanStack Start

---

## Reuse (as-is)

These components are already installed and used; no changes needed beyond Tailwind className updates.

| Component | Source | Screens Used | Notes |
|-----------|--------|-------------|-------|
| `Dialog` | `src/components/ui/dialog.tsx` | Pessoas | Used for person profile modal — keep as-is |
| `Select` | `src/components/ui/select.tsx` | Pessoas, Dashboard, Import | Tag editor, period selector |
| `Sheet` | `src/components/ui/sheet.tsx` | Layout (mobile nav) | Right-side drawer — no changes needed |
| `Tabs` | `src/components/ui/tabs.tsx` | Import, Eventos | TabsList, TabsContent |
| `Table` | `src/components/ui/table.tsx` | Dashboard, Import | Top attendees, import preview |
| `Skeleton` | `src/components/ui/skeleton.tsx` | All pages (loading) | Loading states — extend with gradient shimmer |
| `Progress` | `src/components/ui/progress.tsx` | Import, Check-In event cards | Import progress bar; event progress |
| `Separator` | `src/components/ui/separator.tsx` | Layout, Configurações | Section dividers |
| `Tooltip` | `src/components/ui/tooltip.tsx` | Dashboard | Chart hover tooltips |
| `Sonner (Toaster)` | `src/components/ui/sonner.tsx` | All pages | Already mounted in `__root.tsx` |

---

## Refactor (needs changes)

These exist but need token updates, variant additions, or className changes to implement the saas design system.

| Component | Source | Changes Needed | Screens Used |
|-----------|--------|---------------|-------------|
| `Button` | `src/components/ui/button.tsx` | Default variant: replace `bg-primary` with gradient `bg-gradient-to-r from-[#0052FF] to-[#4D7CFF]` + hover `gradient-lift` effect | All pages |
| `Badge` | `src/components/ui/badge.tsx` | Add `saas-label` variant using pill shape, Electric Blue border/tint, mono text. Keep existing variants for access-type badges | Pessoas, Eventos, Check-In |
| `Input` | `src/components/ui/input.tsx` | Update focus ring: `focus-visible:ring-[#0052FF]` — token via `--ring` override is sufficient (handled in TOKENS) | Login, Check-In, Pessoas, Configurações |
| `Layout` | `src/components/Layout.tsx` | Apply `glass-strong` to header, update nav active state to Electric Blue, add gradient indicator line, update logo mark | All authenticated pages |

---

## New (shared)

New components created for the saas design system, reusable across pages.

| Component | Path | Purpose | Screens Used |
|-----------|------|---------|-------------|
| `SectionBadge` | `src/components/SectionBadge.tsx` | Section label badge — pill with pulse dot + mono uppercase label. Props: `label: string`, `pulse?: boolean` | Check-In, Dashboard, Pessoas, Eventos |
| `StatCard` | `src/components/StatCard.tsx` | Inverted stat card with dot-texture, gradient icon background, label + value + optional delta. Props: `icon`, `label`, `value`, `delta?` | Dashboard, Pessoas stats bar |
| `GradientText` | CSS utility `.gradient-text` in `src/styles.css` | Key headline words rendered with Electric Blue gradient text fill + bg-clip-text | Login, Check-In |

---

## New (local)

New components created for a specific page, not intended for reuse.

| Component | Screen | Path (suggested) | Purpose |
|-----------|--------|-----------------|---------|
| `EventCard` | Check-In (`screen-02`) | inline in `src/routes/index.tsx` | Event selection card with progress bar, active indicator, gradient border on selected state |
| `PersonCard` | Pessoas (`screen-03`) | inline in `src/routes/pessoas.tsx` | Person card with avatar initials, tag chips, access badge, hover gentle-lift |
| `AccessWarningBanner` | Check-In (`screen-02`) | inline in `src/routes/index.tsx` | Semantic-coloured banner (emerald/amber/red per access type) — refactor existing to use `--card` token surface |
| `CheckInFeedItem` | Check-In (`screen-02`) | inline in `src/routes/index.tsx` | Feed row: avatar + name + event + timestamp + access badge |
| `LumaSyncStatus` | Eventos (`screen-05`) | inline in `src/routes/eventos.tsx` | Status pill showing last sync time and sync button |
| `TelegramConfigForm` | Configurações (`screen-06`) | inline in `src/routes/configuracoes.tsx` | Telegram bot token + chat ID form with save confirmation |
| `ImportDropZone` | Import (`screen-07`) | inline in `src/routes/import.tsx` | Drag-and-drop CSV upload zone with dashed border, upload icon, file state |

---

## CSS / Token Changes (not components)

| Change | File | Scope |
|--------|------|-------|
| CSS var overrides (saas dark tokens) | `src/styles.css` | Global — all pages |
| Glass utility refactor (token-based) | `src/styles.css` | All `glass*` usages |
| Add `--font-display: "Calistoga"` | `src/styles.css` | Typography |
| Add `.gradient-text` utility | `src/styles.css` | Login, Check-In |
| Add `.inverted-section` with dot texture | `src/styles.css` | Dashboard, any contrast section |
| Font imports (Calistoga + JetBrains Mono) | `src/routes/__root.tsx` | Global head |
| Keyframes: float-bob, pulse-dot, slow-spin, fade-up | `src/styles.css` | Animation |
