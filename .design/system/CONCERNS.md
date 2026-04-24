# CONCERNS.md — Ipê Village Check-In Design System

## Design Debt

| Issue                                          | File(s)                                         | Severity | Fix Approach                                                                                  |
|------------------------------------------------|-------------------------------------------------|----------|-----------------------------------------------------------------------------------------------|
| Unresolved git merge conflicts in production files | `src/routes/index.tsx`, `src/routes/pessoas.tsx`, `src/server/checkin.functions.ts`, `src/server/luma.server.ts`, `src/server/people.functions.ts`, `src/integrations/supabase/types.ts` | High | Resolve all `<<<<<<< HEAD` / `=======` / `>>>>>>>` conflict markers; the branch merges a `week_pass_start_date` → `weekly_start_date` rename plus Weekly Pass logic |
| Glass utilities defined as global classes, not Tailwind tokens | `src/styles.css`, all pages using `.glass` | Medium | Convert `.glass`, `.glass-strong`, `.glass-subtle` to Tailwind plugins or CSS layer utilities so they benefit from Tailwind's purge and JIT |
| Hardcoded oklch literals in component code    | `src/routes/dashboard.tsx` (`PIE_COLORS` array) | Medium | Replace with `var(--chart-1)` through `var(--chart-5)` CSS vars that are already defined     |
| No spacing / typography token layer           | `src/styles.css`                                | Medium | Define `--font-size-*` and `--spacing-*` tokens in `:root` and map via `@theme inline` for consistent scale |
| `any[]` typed state throughout pages          | `src/routes/index.tsx` (todayCheckins, eventCheckins), `src/routes/dashboard.tsx` | Low | Define proper TypeScript interfaces for checkin row shapes; eliminates `c.people?.name` unsafe access |
| Duplicate stats-bar tag entry ("Weekly" listed twice) | `src/routes/pessoas.tsx` line 265-271    | Low | Remove the duplicate `{ tag: "Weekly", label: "Weekly" }` object in the stats array          |

---

## Component Fragility

| Issue                                          | File(s)                                        | Severity | Fix Approach                                                                    |
|------------------------------------------------|------------------------------------------------|----------|---------------------------------------------------------------------------------|
| `Layout` has embedded auth redirect logic      | `src/components/Layout.tsx`                    | Medium   | Auth guard (`useEffect` → `navigate`) mixes routing concern into a presentational wrapper; move to a route-level loader or middleware |
| Nav `to` values typed `as const` with hard strings | `src/components/Layout.tsx`               | Low      | Use TanStack Router's typed `Link` `to` with the generated route tree for compile-time safety |
| Inline `button` elements for card-clicks       | `src/routes/index.tsx`, `src/routes/pessoas.tsx` | Low    | Replace with proper `<Button asChild>` or `<button>` with accessible `role`/`aria-*` — current pattern lacks keyboard-accessible semantics on some cards |
| Progress bar built with inline `style={{ width }}` | `src/routes/index.tsx`                    | Low      | Use the installed `<Progress>` component (`src/components/ui/progress.tsx`) for consistency |
| `Sheet`/hamburger icon switches between `<Menu>` and `<X>` via `drawerOpen` state | `src/components/Layout.tsx` | Low | Minor: works but the `<X>` icon rendered via `SheetTrigger` while Sheet is open creates a double-close affordance; simplify to a single `Menu` icon |

---

## Accessibility Gaps

| Issue                                          | File(s)                                        | Severity | Fix Approach                                                                    |
|------------------------------------------------|------------------------------------------------|----------|---------------------------------------------------------------------------------|
| Logout button has no visible label on desktop  | `src/components/Layout.tsx` (line 91–96)       | Medium   | Has `title="Sair"` but no `aria-label`; add `aria-label="Sair"` for screen reader support |
| Tag filter pill buttons have no `aria-pressed` | `src/routes/pessoas.tsx`                       | Medium   | Active filter state is visual only; add `aria-pressed={tagFilter === tag}` to each filter button |
| Person card `<button>` in pessoas list lacks descriptive label | `src/routes/pessoas.tsx`         | Medium   | Inner text is person name but no `aria-label`; add `aria-label={p.name}`       |
| Event card `<button>` in index.tsx lacks label | `src/routes/index.tsx`                         | Medium   | Add `aria-label={event.name}` to the clickable event card button               |
| Native `<input type="date">` styled raw, not wrapped | `src/routes/pessoas.tsx` (modal day pass / weekly pass inputs) | Low | Use shadcn `Calendar` + `Popover` for date picking for consistent style + a11y |
| Focus ring relies on Tailwind defaults         | All pages                                      | Low      | The `focus-visible:ring-1 focus-visible:ring-ring` on shadcn components is correct; ensure custom `<button>` elements without className also get visible focus rings |
| No skip-navigation link                        | `src/routes/__root.tsx`, `src/components/Layout.tsx` | Low | Add a visually hidden "Skip to main content" link before the nav for keyboard users |

---

## Token Coverage Gaps

| Gap                                            | File(s)                                        | Severity | Fix Approach                                                                    |
|------------------------------------------------|------------------------------------------------|----------|---------------------------------------------------------------------------------|
| No dark-mode token overrides despite dark variant being registered | `src/styles.css`        | High     | Add `.dark { --background: ...; --foreground: ...; ... }` block for all semantic tokens; the `@custom-variant dark` is declared but never used |
| Font size / line-height not tokenised          | `src/styles.css`                               | Medium   | Add `--font-size-xs` through `--font-size-3xl` and `--line-height-*` vars to `:root` + `@theme inline` |
| Spacing not tokenised                          | `src/styles.css`                               | Low      | Optional; Tailwind's built-in scale is adequate but custom tokens would make tighter design decisions explicit |
| Shadow tokens absent                           | `src/styles.css`                               | Low      | Extract the `box-shadow` literals from `.glass*` classes into `--shadow-glass`, `--shadow-glass-strong`, `--shadow-glass-subtle` vars |
| Chart colours defined only as raw oklch strings | `src/routes/dashboard.tsx` (`PIE_COLORS`)     | Low      | Use `--chart-1` through `--chart-5` CSS vars already defined in `:root`         |

---

## Dark Mode Gaps

| Gap                                            | File(s)                                        | Severity | Fix Approach                                                                    |
|------------------------------------------------|------------------------------------------------|----------|---------------------------------------------------------------------------------|
| Zero dark-mode styles defined                  | `src/styles.css`                               | High     | The `@custom-variant dark` hook exists but has no corresponding dark token values; the entire app is light-only |
| Body gradient is hardcoded light               | `src/styles.css` (`body {}`)                   | High     | The multi-stop `oklch` gradient is not parameterised; needs a dark equivalent under `.dark body {}` |
| Glass backgrounds use hardcoded white alpha    | `src/styles.css` (`.glass*` classes)           | High     | `oklch(1 0 0 / 72%)` is white-alpha; in dark mode this renders as white washes over dark backgrounds; must be converted to `--glass-bg` token |
| Recharts tooltips / grid lines not theme-aware | `src/routes/dashboard.tsx`                     | Medium   | Recharts inline style props use raw oklch values; would need CSS var wiring     |
| Success / warning / error indicator colours are hardcoded | `src/routes/index.tsx`, `src/routes/pessoas.tsx` | Low | `bg-emerald-500/10 text-emerald-400` etc. are semantic colours that should come from tokens |

---

## Responsive Gaps

| Gap                                            | File(s)                                        | Severity | Fix Approach                                                                    |
|------------------------------------------------|------------------------------------------------|----------|---------------------------------------------------------------------------------|
| Stats bar in pessoas.tsx has wrong grid count  | `src/routes/pessoas.tsx` (line 263)            | Medium   | `grid-cols-2 sm:grid-cols-5` renders 6 items in a 5-column grid; the duplicate "Weekly" entry causes an orphaned 6th tile — fix by removing duplicate |
| Date display in header hidden on sm           | `src/components/Layout.tsx` (`hidden lg:block`) | Low     | The date is hidden on mobile and small tablet; acceptable UX but worth revisiting if date context matters on mobile |
| Dashboard Table has no horizontal scroll wrapper | `src/routes/dashboard.tsx`                   | Low      | On narrow screens the table may overflow; wrap in `overflow-x-auto` or use shadcn's `ScrollArea` |
| Progress bars in person modal can clip long event names | `src/routes/pessoas.tsx`             | Low      | `max-w-[140px] truncate` chip in registrations preview; fine but worth a tooltip on hover |

---

## Naming Inconsistencies

| Issue                                          | File(s)                                        | Severity | Fix Approach                                                                    |
|------------------------------------------------|------------------------------------------------|----------|---------------------------------------------------------------------------------|
| Hook filename inconsistency: `useAuth.tsx` vs `use-mobile.tsx` | `src/hooks/`                  | Low      | Standardise to one convention; shadcn default is `use-mobile.tsx` (kebab); consider renaming `useAuth.tsx` → `use-auth.tsx` or vice versa |
| `week_pass_start_date` vs `weekly_start_date` conflict | multiple files (unresolved conflict)  | High     | Part of the unresolved merge conflict; choose one column name and update DB schema + all references atomically |
| `setWeekPassStartDate` vs `setWeeklyStartDate` | `src/routes/pessoas.tsx` (conflict)            | High     | Same merge conflict; resolve alongside column rename                            |
| Tag `"Weekly"` used both as `"Weekly"` and with label `"Semanal"` in stats | `src/routes/pessoas.tsx` | Low | Pick one display label per tag and use consistently                             |
| Server file `luma.server.ts` vs `luma.functions.ts` | `src/server/`                         | Low      | Two different naming conventions for server files in same directory; standardise to `*.functions.ts` |

---

## Summary

| Category             | High | Medium | Low  |
|----------------------|------|--------|------|
| Design Debt          | 1    | 3      | 2    |
| Component Fragility  | 0    | 1      | 4    |
| Accessibility Gaps   | 0    | 4      | 3    |
| Token Coverage Gaps  | 1    | 1      | 3    |
| Dark Mode Gaps       | 3    | 1      | 1    |
| Responsive Gaps      | 0    | 1      | 3    |
| Naming Inconsistencies | 2  | 0      | 3    |
| **Totals**           | **7**| **11** | **19**|

**Overall health: Fair.** The core UI patterns are solid — the token system is well structured, the glass aesthetic is coherent, and the shadcn component library is fully installed. The three critical issues to address first are: (1) resolve the active git merge conflicts, (2) add dark-mode token overrides (the variant hook is already wired), and (3) fix the missing `aria-*` labels on interactive card buttons.
