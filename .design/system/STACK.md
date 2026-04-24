# STACK.md — Ipê Village Check-In Design System

## Classification

**Type:** Existing (feature-active, mid-development)

**Rationale:** The codebase has multiple completed pages (check-in, eventos, pessoas, import, dashboard, configuracoes), a real auth layer, server functions backed by Supabase, and production deployment configuration (Cloudflare Workers via `wrangler.jsonc`). It is not a greenfield scaffold. There are active unmerged conflicts in several files indicating ongoing concurrent development. The UI layer sits on top of shadcn/ui with significant project-specific customisation (glass utility classes, oklch-based token palette, SF Pro Display font choice).

---

## Tech Stack

| Category        | Choice                                          | Version / Notes                                  |
|-----------------|------------------------------------------------|--------------------------------------------------|
| Framework       | TanStack Start (React SSR/SPA hybrid)          | `@tanstack/react-start` ^1.167.14                |
| Language        | TypeScript                                     | ^5.8.3, strict mode, ES2022 target               |
| Styling         | Tailwind CSS v4 + custom CSS vars              | `tailwindcss` ^4.2.1, `@tailwindcss/vite` plugin |
| UI Kit          | shadcn/ui (New York style, Radix UI primitives)| `components.json` style: "new-york", base: slate |
| Package Manager | Bun                                            | `bunfig.toml` present; `package-lock.json` also exists (legacy) |
| Build Tool      | Vite 7 via `@lovable.dev/vite-tanstack-config` | Wraps Vite 7, Cloudflare Workers adapter         |
| Deployment      | Cloudflare Workers                             | `wrangler.jsonc`, `@cloudflare/vite-plugin`      |
| Backend         | Supabase (PostgreSQL + Auth + Realtime)        | `@supabase/supabase-js` ^2.103.2                 |
| Icons           | Lucide React                                   | ^0.575.0 (configured in `components.json`)       |
| Charts          | Recharts                                       | ^2.15.4                                          |
| Forms           | React Hook Form + Zod + @hookform/resolvers    | RHF ^7.71.2, Zod ^3.24.2                         |
| Animation       | tw-animate-css                                 | ^1.3.4                                           |

---

## Architecture Patterns

| Category          | Pattern / Detail                                                                 |
|-------------------|----------------------------------------------------------------------------------|
| Component style   | Functional components with hooks; `forwardRef` in shadcn primitives              |
| State management  | Local `useState` per page; no global state library; Supabase Realtime for live sync |
| Data fetching     | TanStack Server Functions (`createServerFn`) called directly from components; `@tanstack/react-query` present but not seen in page code |
| Routing           | TanStack Router (file-based, `src/routes/`); auto-generated `routeTree.gen.ts`  |
| Auth              | Supabase Auth + custom `AuthProvider` context + `useAuth` hook; redirect guard in `Layout` |
| File organisation | Feature-flat (`src/routes/` for pages, `src/server/` for server fns, `src/components/ui/` for shadcn, `src/components/` for app components, `src/hooks/`, `src/lib/`) |
| Styling approach  | Tailwind utility-first with CSS custom properties; glass utilities in global CSS; `cn()` helper via clsx + tailwind-merge |

---

## Key Paths

| Purpose                     | Path                                              |
|-----------------------------|---------------------------------------------------|
| Global styles / tokens      | `src/styles.css`                                  |
| Shared layout + nav         | `src/components/Layout.tsx`                       |
| Root route / shell          | `src/routes/__root.tsx`                           |
| Check-in page               | `src/routes/index.tsx`                            |
| Pessoas (people) page       | `src/routes/pessoas.tsx`                          |
| Eventos page                | `src/routes/eventos.tsx`                          |
| Import page                 | `src/routes/import.tsx`                           |
| Dashboard page              | `src/routes/dashboard.tsx`                        |
| Configuracoes page          | `src/routes/configuracoes.tsx`                    |
| Login page                  | `src/routes/login.tsx`                            |
| shadcn/ui components        | `src/components/ui/`                              |
| Auth hook + context         | `src/hooks/useAuth.tsx`                           |
| Mobile breakpoint hook      | `src/hooks/use-mobile.tsx`                        |
| cn() utility                | `src/lib/utils.ts`                                |
| Brasilia timezone utils     | `src/lib/brasilia-time.ts`                        |
| Supabase client (browser)   | `src/integrations/supabase/client.ts`             |
| Supabase client (server)    | `src/integrations/supabase/client.server.ts`      |
| Server functions — checkin  | `src/server/checkin.functions.ts`                 |
| Server functions — people   | `src/server/people.functions.ts`                  |
| Server functions — events   | `src/server/event.functions.ts`                   |
| Server functions — dashboard| `src/server/dashboard.functions.ts`               |
| Server functions — luma     | `src/server/luma.functions.ts`                    |
| Server functions — telegram | `src/server/telegram-report.functions.ts`         |
| shadcn config               | `components.json`                                 |
| TS config                   | `tsconfig.json`                                   |
| Vite config                 | `vite.config.ts`                                  |
| Cloudflare config           | `wrangler.jsonc`                                  |
