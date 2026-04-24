# Navigation
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Pattern

**Desktop:** Sticky top header (`Layout.tsx`) with horizontal nav links + logout button.
**Mobile:** Hamburger → Sheet drawer (right-slide, existing `Sheet` component).

This is a web app (TanStack Start), not a native app — tab bar is not used. Navigation lives in `Layout.tsx` which wraps all authenticated routes.

---

## Header Anatomy (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  [●] Ipê Village        Check-In  Pessoas  Dashboard  ···  [→ Sair] │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Container | `sticky top-0 z-50`, `glass-strong` surface (`bg-[--card]/85 backdrop-blur-xl`) |
| Logo mark | Gradient dot `h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#0052FF] to-[#4D7CFF]` + wordmark "Ipê Village" in Calistoga, foreground |
| Nav links | `font-medium text-sm`, default `text-muted-foreground`, hover `text-[#0052FF] transition-colors duration-200` |
| Overflow | When > 5 links, collapse P2/P3 into "···" dropdown (Popover) |
| Active link | `text-[#0052FF]` + bottom indicator line `h-0.5 bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] rounded-full` |
| Logout | Ghost Button, right-aligned, `text-muted-foreground hover:text-destructive` |
| Border | `border-b border-[--border]` with `box-shadow: 0 1px 0 oklch(from var(--border) l c h / 60%)` |

---

## Mobile Header

```
┌──────────────────────────────┐
│  [●] Ipê Village         [≡] │
└──────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Hamburger | `MenuIcon` 24px, `text-muted-foreground`, touch target `44×44px` minimum |
| Sheet | Right-side slide, full-height, `glass-strong` background |
| Sheet content | Logo row → vertical nav list → separator → Logout |
| Nav item height | `h-12 px-4` — 48px rows for thumb safety |
| Active state | `bg-[#0052FF]/10 text-[#0052FF] rounded-lg` pill highlight |

---

## Primary Nav Items

| # | Label | Route | Icon | Notes |
|---|-------|-------|------|-------|
| 1 | Check-In | `/` | `LogIn` | Default landing after auth |
| 2 | Pessoas | `/pessoas` | `Users` | People management |
| 3 | Dashboard | `/dashboard` | `BarChart2` | Metrics |
| 4 | Eventos | `/eventos` | `Calendar` | P2 — may collapse mobile |
| 5 | Configurações | `/configuracoes` | `Settings` | P2 |
| 6 | Import | `/import` | `Upload` | P3 |

---

## Active State

**Link color:** `text-[#0052FF]` (Electric Blue)
**Desktop indicator:** 2px bottom border, gradient, absolute-positioned under link text
**Mobile indicator:** `bg-[#0052FF]/10 rounded-lg` full-row pill background
**Transition:** `duration-200 ease-out` color shift — color-shift effect from STYLE.md

---

## Auth Guard

All routes under `Layout.tsx` check `isAuthenticated` from `useAuth()`. If falsy, redirect to `/login`. Login page is outside `Layout` wrapper (no nav).

---

## Responsive Behavior

| Breakpoint | Behavior |
|-----------|---------|
| `< 768px` | Header shows logo + hamburger only. Nav hidden. Sheet drawer for full menu. |
| `768px – 1024px` | Header shows P0 links (Check-In, Pessoas, Dashboard) + `···` popover for rest. |
| `> 1024px` | Full horizontal nav — all 6 links visible. |
