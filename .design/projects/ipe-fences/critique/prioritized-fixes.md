# Prioritized Fixes
> Phase: critique | Project: Ipê Fences | Generated: 2026-04-22

See [critique.md](./critique.md) for full heuristic scores. See [accessibility-fixes.md](./accessibility-fixes.md) for WCAG violations.

---

## Critical (Must Fix Before Ship)

**C1 — Missing `<html lang="pt-BR">` attribute**
- Screen: All pages (root layout)
- Issue: WCAG 3.1.1 — page language not declared
- Fix: Set `lang="pt-BR"` on the `<html>` element in `src/routes/__root.tsx`
- Reference: `accessibility-fixes.md` — AFX-01

**C2 — Missing skip navigation link**
- Screen: All authenticated pages (Layout.tsx)
- Issue: WCAG 2.4.1 — no skip-nav mechanism. Keyboard users must tab through all 6 nav items + logout button before reaching main content on every page.
- Fix: Add `<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#0052FF] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl">Ir para conteúdo principal</a>` as first child of `<body>`. Add `id="main-content"` to the `<main>` element in Layout.tsx.
- Reference: `accessibility-fixes.md` — AFX-02

**C3 — "Esqueceu a senha?" missing from Login**
- Screen: [../design/screen-01-login.md](../design/screen-01-login.md)
- Issue: H10 (Help — 2/5). For a deployed production app, no password reset path means locked-out users cannot self-recover. This is a functional gap, not just a design polish item.
- Fix: Add `<a href="/reset-password" className="text-sm text-[#0052FF] hover:underline">Esqueceu a senha?</a>` below the password field in the login card. Create a `/reset-password` route (or Supabase auth modal).

**C4 — "Novo cadastro" navigates away from Check-In (breaks flow)**
- Screen: [../design/screen-02-checkin.md](../design/screen-02-checkin.md)
- Issue: H9 (Error recovery — 4/5). When Ana can't find a guest, clicking "+ Novo cadastro" currently navigates to `/pessoas`, losing her event selection and search context during peak check-in.
- Fix: Replace navigation link with a `Sheet` (slide-over) containing a minimal create-person form (name, type, optional tags). On save, return to Check-In with the new person pre-selected in the search field. Implement as `CreatePersonSheet` component inline in `index.tsx`.

---

## Important (High Priority)

**I1 — No undo for check-in action**
- Screen: [../design/screen-02-checkin.md](../design/screen-02-checkin.md)
- Issue: H3 (User control — 3/5). A misfire (wrong person checked in) has no recovery path except navigating to Pessoas.
- Fix: Extend the post-check-in Sonner toast to include an "Desfazer" action button with a 30-second window. The toast action calls a `cancelCheckin(id)` server function. Toast: `"✓ [Nome] registrado — Desfazer (30s)"`. After 30s, the action expires.

**I2 — No keyboard shortcut for search focus (Check-In)**
- Screen: [../design/screen-02-checkin.md](../design/screen-02-checkin.md)
- Issue: H7 (Flexibility — 3/5). Ana at a reception desk would benefit greatly from a keyboard shortcut to jump to the search input without reaching for the mouse.
- Fix: Add `Ctrl+K` (or `⌘K` on Mac) global shortcut that focuses the search input on Check-In. Show hint in placeholder: `"Buscar pessoa... (Ctrl+K)"`. Use a `useEffect` with `document.addEventListener("keydown", ...)` in `index.tsx`.

**I3 — Last-selected event not persisted**
- Screen: [../design/screen-02-checkin.md](../design/screen-02-checkin.md)
- Issue: H7 (Flexibility — 3/5). When Ana refreshes the page or returns to Check-In after navigating away, event selection resets. On event days with multiple events, this is constant friction.
- Fix: Persist `selectedEventId` to `localStorage`. On mount, restore last selection if the event still exists in today's event list.

**I4 — Configurações form has no unsaved changes guard**
- Screen: [../design/screen-06-configuracoes.md](../design/screen-06-configuracoes.md)
- Issue: H3 (User control — 3/5). If Carlos edits the Bot Token and navigates away without saving, changes are silently lost.
- Fix: Track `isDirty` state. Show `"Alterações não salvas"` warning badge near the save button when dirty. On navigation away with unsaved changes, show a browser `confirm()` dialog or custom `AlertDialog`.

**I5 — Import CSV: no column format reference**
- Screen: [../design/screen-07-import.md](../design/screen-07-import.md)
- Issue: H10 (Help — 2/5). The drop zone shows ".csv · máx. 5 MB" but does not tell Carlos what columns are expected. An incorrectly formatted CSV gives a generic parse error.
- Fix: Add below the constraint text: `"Colunas: nome, tipo_acesso, email (opcional)"`. Add a `"Baixar modelo .csv"` Ghost link that downloads a template file. Generate the template via a simple server function returning a CSV with example rows.

**I6 — Telegram config: no contextual help for Chat ID**
- Screen: [../design/screen-06-configuracoes.md](../design/screen-06-configuracoes.md)
- Issue: H10 (Help — 2/5). `Chat ID` in format `-1001234567890` is non-obvious. Carlos (low-tech fluency) will not know how to find this.
- Fix: Add a `?` icon button after the Chat ID label. On click, open a `Popover` with brief instructions: `"1. Adicione o bot ao grupo Telegram. 2. Envie /start. 3. Acesse t.me/getmyid_bot para obter o ID do grupo."` Include an external link to Telegram's documentation.

**I7 — Confirm step for access type downgrade**
- Screen: [../design/screen-03-pessoas.md](../design/screen-03-pessoas.md)
- Issue: H5 (Error prevention — 4/5). Changing a person's access type to "Bloqueado" via the Profile modal Select is irreversible without manual re-edit. A blocked member who shows up at an event will be denied.
- Fix: Add an `AlertDialog` confirm step when the new type is "Bloqueado" or when downgrading from "Membro" to "Pendente". Dialog: `"Confirmar alteração de acesso" / "Mudar [Nome] para Bloqueado irá negar seu acesso em próximos eventos. Confirmar?"` / `[Confirmar] [Cancelar]`.

**I8 — [STYLE] Mobile hero headline below minimum spec**
- Screen: [../design/screen-01-login.md](../design/screen-01-login.md)
- Issue: Brand contract constraint — STYLE.md `never: "small hero headlines — minimum text-5xl mobile"`. Current spec: `text-[2.75rem]` (44px) on mobile; STYLE.md minimum is `text-5xl` (80px) for desktop and `text-5xl` (80px equivalent).
- Note: The STYLE.md constraint says "minimum text-5xl mobile" — this refers to the preset's intended mobile scale for hero headlines. The 2.75rem (≈44px, 2.75 × 16 = 44px) is below text-5xl (48px). Fix: bump to `text-[3rem] sm:text-[3.5rem]` to stay above the minimum on all mobile sizes. Brand-level: if this minimum seems too large for the app context, run `/gsp-brand-refine` to adjust the preset's mobile hero constraint.

---

## Polish (If Time Allows)

**P1 — Page transition loading indicator**
- All pages
- Add a thin 2px Electric Blue progress bar below the header during route transitions. Example: `nprogress` or a custom `RouterProgressBar` component that activates on TanStack Router pending state.

**P2 — Configurações: connection status badge on card header**
- Screen: [../design/screen-06-configuracoes.md](../design/screen-06-configuracoes.md)
- Add a `SectionBadge` or status indicator on the Telegram card header when the bot is successfully connected: `"CONECTADO"` with emerald pulse dot. When not configured: muted `"NÃO CONFIGURADO"` label. Adds reassurance for Carlos's weekly check.

**P3 — SectionBadge pulse dot: `aria-hidden` missing**
- All pages using `SectionBadge`
- The pulse dot `<span>` is an empty decorative element. Screen readers may announce it. Add `aria-hidden="true"` to the dot span in `SectionBadge.tsx`.
- Reference: `accessibility-fixes.md` — AFX-05

**P4 — Dashboard: asymmetric chart layout**
- Screen: [../design/screen-04-dashboard.md](../design/screen-04-dashboard.md)
- Issue: Intensity calibration (variance:4). All interior layouts are symmetric grids. The Dashboard 2-section chart area could use a 3/5 + 2/5 split (BarChart larger, Top Attendees narrower) to create the "strategic asymmetry" STYLE.md declares at variance:4.
- Fix: Change the chart/table grid to `grid-cols-[3fr_2fr]` on desktop.

**P5 — Recharts tooltip requires custom content renderer**
- Screen: [../design/screen-04-dashboard.md](../design/screen-04-dashboard.md)
- The chart tooltip spec targets Recharts' default tooltip DOM. In practice, `Tooltip` in Recharts renders a `<div>` outside the CSS scope. Use `content={<CustomTooltip />}` prop with the custom component applying the specified `bg-[--card] border border-[--border] rounded-xl` classes.

**P6 — Progress component fill color override**
- Screen: [../design/screen-07-import.md](../design/screen-07-import.md), [../design/screen-02-checkin.md](../design/screen-02-checkin.md)
- shadcn Progress (New York) uses `bg-primary` for the indicator. Override with `[&>[data-slot='progress-indicator']]:bg-[#0052FF]` or set `--primary` to `#0052FF` in the token layer (which the design already does — verify this auto-resolves).

**P7 — Calistoga restricted to `text-2xl`+ only**
- All pages
- The global `h1, h2 { font-family: var(--font-display) }` rule in `target-adaptations.md` applies Calistoga to small h2s (e.g. "Integração Telegram" at `text-xl`). At small sizes, Calistoga's display character looks out of place. Add a size gate: only apply Calistoga to headings that are `text-2xl` or larger. Implement via a utility class `font-display` applied manually rather than a blanket h2 selector.

**P8 — Eventos: accordion pattern needs keyboard clarification**
- Screen: [../design/screen-05-eventos.md](../design/screen-05-eventos.md)
- The spec uses `<details><summary>` or controlled state for row expansion. If using controlled state, ensure `aria-expanded` is set and `Enter`/`Space` toggles the row. Native `<details>` handles this automatically; a custom implementation must replicate it.

**P9 — Login: reduced-motion fallback for hero column**
- Screen: [../design/screen-01-login.md](../design/screen-01-login.md)
- When `prefers-reduced-motion` is active, the float-bob cards and slow-spin ring become static decorative elements with no purpose. Add `@media (prefers-reduced-motion: reduce) { .float-card-1, .float-card-2, .dashed-ring { display: none; } }` to keep the left column clean on reduced-motion, showing only the dot grid, corner accent, and the text stack.
