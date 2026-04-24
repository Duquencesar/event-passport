# COMPONENTS.md — Ipê Village Check-In Design System

## UI Kit Detection

**Kit:** shadcn/ui (New York style)

**How detected:**
- `components.json` at root with `"$schema": "https://ui.shadcn.com/schema.json"`, `"style": "new-york"`, `"baseColor": "slate"`, `"cssVariables": true`
- All Radix UI primitives listed in `package.json` dependencies (accordion through tooltip)
- `src/components/ui/` directory contains the full set of generated shadcn component files
- `cn()` helper pattern (`clsx` + `tailwind-merge`) in `src/lib/utils.ts`
- `class-variance-authority` used in `button.tsx`, `badge.tsx`, etc.
- Icon library: Lucide React (configured via `"iconLibrary": "lucide"`)

---

## Existing Components

### shadcn/ui Components (src/components/ui/) — 46 files

All standard shadcn New York components are present. The table below covers the subset actively used in app pages.

| Name             | Path                             | Variants / Props                                                     | Reusable? | Notes                                                   |
|------------------|----------------------------------|----------------------------------------------------------------------|-----------|---------------------------------------------------------|
| Button           | `src/components/ui/button.tsx`   | variant: default, destructive, outline, secondary, ghost, link; size: default, sm, lg, icon | Yes | CVA-based; `asChild` via Radix Slot                     |
| Badge            | `src/components/ui/badge.tsx`    | variant: default, secondary, destructive, outline                    | Yes       | Pages add custom colours via className (e.g., `bg-primary/12 text-primary border-0 rounded-lg`) |
| Input            | `src/components/ui/input.tsx`    | Standard HTML input props                                            | Yes       | Used everywhere with `rounded-2xl` or `rounded-xl` override |
| Dialog           | `src/components/ui/dialog.tsx`   | DialogContent, DialogHeader, DialogTitle                             | Yes       | Used for person profile modal in pessoas.tsx            |
| Select           | `src/components/ui/select.tsx`   | SelectTrigger, SelectContent, SelectItem, SelectValue                | Yes       | Used in pessoas.tsx (tag editor), dashboard.tsx, import.tsx |
| Sheet            | `src/components/ui/sheet.tsx`    | side: right; SheetContent, SheetTrigger                              | Yes       | Used for mobile nav drawer in Layout.tsx                |
| Table            | `src/components/ui/table.tsx`    | TableBody, TableCell, TableHead, TableHeader, TableRow               | Yes       | Used in dashboard.tsx (top attendees), import.tsx       |
| Tabs             | `src/components/ui/tabs.tsx`     | TabsContent, TabsList, TabsTrigger                                   | Yes       | Used in import.tsx, eventos.tsx                         |
| Sonner (Toaster) | `src/components/ui/sonner.tsx`   | richColors, position props                                           | Yes       | Mounted in `__root.tsx`; toast() calls use `sonner` pkg |
| Skeleton         | `src/components/ui/skeleton.tsx` | —                                                                    | Yes       | Used for loading states (animate-pulse pattern)         |
| Progress         | `src/components/ui/progress.tsx` | value prop                                                           | Yes       | Present; custom progress bars also built inline         |
| Separator        | `src/components/ui/separator.tsx`| —                                                                    | Yes       | Present                                                 |
| Tooltip          | `src/components/ui/tooltip.tsx`  | —                                                                    | Yes       | Present                                                 |
| Popover          | `src/components/ui/popover.tsx`  | —                                                                    | Yes       | Present                                                 |
| Calendar         | `src/components/ui/calendar.tsx` | —                                                                    | Yes       | Present (react-day-picker)                              |

Remaining 31 shadcn files (accordion, alert, alert-dialog, aspect-ratio, avatar, breadcrumb, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, label, menubar, navigation-menu, pagination, radio-group, resizable, scroll-area, slider, switch, textarea, toggle, toggle-group) are installed but not observed in active page code. They are available for future use.

### Custom / App Components

| Name            | Path                          | Props / Variants                                      | Reusable? | Notes                                                                 |
|-----------------|-------------------------------|-------------------------------------------------------|-----------|-----------------------------------------------------------------------|
| Layout          | `src/components/Layout.tsx`   | `{ children: React.ReactNode }`                       | Yes       | Sticky glass-strong header, desktop nav, mobile Sheet drawer, auth redirect guard; max-w-6xl content |
| AuthProvider    | `src/hooks/useAuth.tsx`       | `{ children: ReactNode }`                             | Yes       | Supabase auth context; exposes `isAuthenticated`, `user`, `loading`, `login`, `logout` |
| NotFoundComponent | `src/routes/__root.tsx` (inline) | —                                                 | No        | 404 page, inline in root route                                        |

---

## Where to Add

| Category        | Location                                    | Convention                                            |
|-----------------|---------------------------------------------|-------------------------------------------------------|
| UI component    | `src/components/ui/<name>.tsx`              | Follow shadcn pattern: named export + CVA variants + `cn()` |
| Page / route    | `src/routes/<name>.tsx`                     | `createFileRoute("/path")({ component: PageFn })`; wrap with `<Layout>` |
| App component   | `src/components/<Name>.tsx`                 | Named export, PascalCase filename                     |
| Hook            | `src/hooks/use<Name>.tsx` or `useAuth.tsx`  | `use` prefix, named export; place context providers here |
| Utility / lib   | `src/lib/<name>.ts`                         | Pure functions, no React; named exports               |
| Server function | `src/server/<domain>.functions.ts`          | `createServerFn` calls; one file per domain           |
