# CONVENTIONS.md — Ipê Village Check-In Design System

## Naming Patterns

| Entity            | Pattern                          | Examples                                                       |
|-------------------|----------------------------------|----------------------------------------------------------------|
| React component   | PascalCase function              | `Layout`, `CheckinPage`, `PessoasPage`, `DashboardPage`       |
| Route component   | PascalCase, named inline         | `function LoginPage()`, `function CheckinPage()`              |
| Hook              | `use` prefix, camelCase          | `useAuth`, `useIsMobile`                                      |
| Server functions  | camelCase verbs, domain-grouped  | `createCheckin`, `searchPeople`, `getDashboardStats`          |
| Server function files | `<domain>.functions.ts`      | `checkin.functions.ts`, `people.functions.ts`, `event.functions.ts` |
| Route files       | lowercase, hyphen where needed   | `index.tsx`, `pessoas.tsx`, `configuracoes.tsx`, `dashboard.tsx` |
| UI component files| lowercase, hyphen                | `button.tsx`, `badge.tsx`, `alert-dialog.tsx`, `input-otp.tsx`|
| App component files| PascalCase                      | `Layout.tsx`                                                  |
| Hook files        | camelCase (`use` prefix)         | `useAuth.tsx`, `use-mobile.tsx` (slight inconsistency — see CONCERNS) |
| Type names        | PascalCase                       | `PersonWithRegs`, `CheckinRecord`, `EventWithStats`           |
| CSS custom props  | `--kebab-case`                   | `--primary`, `--card-foreground`, `--radius-xl`               |
| CSS utility classes| `.kebab-case`                   | `.glass`, `.glass-strong`, `.glass-subtle`                    |
| Constants         | SCREAMING_SNAKE or camelCase     | `PIE_COLORS`, `TAG_CONFIG`, `MOBILE_BREAKPOINT`               |

---

## Export Style

| Category           | Style             | Detail                                                             |
|--------------------|-------------------|--------------------------------------------------------------------|
| shadcn components  | Named export      | `export { Button, buttonVariants }`, `export { Badge, badgeVariants }` |
| Route components   | Not directly exported; exposed via `Route` | `export const Route = createFileRoute(...)` |
| App components     | Named export      | `export function Layout(...)`, `export function AuthProvider(...)`|
| Hooks              | Named export      | `export function useAuth()`, `export function useIsMobile()`      |
| Utilities          | Named export      | `export function cn(...)`, `export function formatBrasiliaTime(...)` |
| Server functions   | Named export      | `export const createCheckin = createServerFn(...)...`             |
| Types              | Named `type` export where shared | `type Person = {...}` (often file-local); `type AuthState` in hook file |
| No default exports | Consistent        | No `export default` observed in any file                          |

---

## Styling Approach

| Layer              | Approach                          | Detail                                                                       |
|--------------------|-----------------------------------|------------------------------------------------------------------------------|
| Base tokens        | CSS custom properties in `:root`  | OKLCH colour tokens, radius base, font stack                                 |
| Tailwind mapping   | `@theme inline` block             | Maps CSS vars to Tailwind utility classes (`bg-primary`, `text-foreground`)  |
| Component variants | `cva` (class-variance-authority)  | Used in `button.tsx`, `badge.tsx`; generates stable variant strings          |
| Class composition  | `cn()` helper                     | `clsx` + `tailwind-merge`; used in every component file                      |
| Glass effects      | Global `.glass` / `.glass-strong` / `.glass-subtle` | Raw CSS classes applied via className string; not Tailwind utilities |
| Inline overrides   | Tailwind utilities via className  | Pages override shadcn defaults (e.g., `rounded-2xl` on Input, `rounded-xl` on Button) |
| Arbitrary values   | Tailwind `[value]` syntax         | Used sparingly; e.g., `bg-white/[0.05]`, `bg-white/[0.06]`                  |
| Animation          | tw-animate-css + Tailwind         | `animate-in`, `fade-in`, `zoom-in-95`, `animate-spin`, `animate-pulse`       |
| No CSS Modules     | Confirmed                         | No `.module.css` files found                                                 |
| No styled-components/emotion | Confirmed             | Pure Tailwind + CSS vars                                                     |

---

## Import Aliases

| Alias    | Resolves to   | Configured in                    |
|----------|--------------|----------------------------------|
| `@/*`    | `./src/*`    | `tsconfig.json` → `paths`; also auto-injected by `@lovable.dev/vite-tanstack-config` |
| `@/components` | `src/components/` | Also in `components.json` aliases |
| `@/components/ui` | `src/components/ui/` | `components.json` aliases    |
| `@/lib`  | `src/lib/`   | `components.json` aliases        |
| `@/hooks`| `src/hooks/` | `components.json` aliases        |

---

## File Organisation

```
src/
  components/
    ui/           # shadcn/ui primitives (46 files, do not hand-edit)
    Layout.tsx    # single app-level layout component
  hooks/
    useAuth.tsx   # auth context + hook
    use-mobile.tsx# viewport hook
  integrations/
    supabase/
      client.ts         # browser Supabase client
      client.server.ts  # server-side Supabase client
      types.ts          # generated DB types
      auth-middleware.ts
  lib/
    utils.ts          # cn() helper
    brasilia-time.ts  # timezone utilities
    access-validation.ts
  middleware/
    auth-client.ts
  routes/
    __root.tsx        # shell + RootComponent + Toaster
    index.tsx         # /  (Check-in)
    login.tsx         # /login
    eventos.tsx       # /eventos
    pessoas.tsx       # /pessoas
    import.tsx        # /import
    dashboard.tsx     # /dashboard
    configuracoes.tsx # /configuracoes
    hooks/            # TanStack Router API-route hooks (webhook handlers)
  router.tsx          # router creation
  routeTree.gen.ts    # auto-generated; do not edit
  server/
    checkin.functions.ts
    dashboard.functions.ts
    db.ts
    event.functions.ts
    import.functions.ts
    luma.functions.ts
    luma.server.ts
    luma-status.functions.ts
    pagination.ts
    people.functions.ts
    telegram.functions.ts
    telegram-report.functions.ts
  styles.css          # global styles + design tokens
```

---

## Where to Add

| What to add                   | Where                                         | Notes                                                        |
|-------------------------------|-----------------------------------------------|--------------------------------------------------------------|
| New page / route              | `src/routes/<slug>.tsx`                       | Use `createFileRoute`; wrap content in `<Layout>`            |
| New shadcn component          | `src/components/ui/<name>.tsx`                | Add via shadcn CLI (`bunx shadcn add <name>`)                |
| New app-level component       | `src/components/<Name>.tsx`                   | Named export, PascalCase; import via `@/components/<Name>`   |
| New hook                      | `src/hooks/use<Name>.tsx`                     | Named export; prefer `use-` file naming for consistency      |
| New server function           | `src/server/<domain>.functions.ts`            | Use `createServerFn`; group by domain                        |
| New CSS token                 | `src/styles.css` `:root {}` block             | Use OKLCH; also add to `@theme inline` if used in Tailwind   |
| New glass variant             | `src/styles.css` after `.glass-subtle`        | Follow existing `backdrop-filter + box-shadow` pattern       |
| New utility function          | `src/lib/<name>.ts`                           | Pure TS, no React                                            |
