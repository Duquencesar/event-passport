# Screen 01 — Login
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Purpose

Authentication gate. First impression of the redesigned system. Sets the tone for the entire Electric Blue saas identity. Hero typography + gradient primary button must feel premium and decisive.

## User Flow Position

Entry point for unauthenticated users. After successful login → redirect to `/` (Check-In). No back navigation — this is the root unauthenticated route.

---

## Layout (Desktop — 55/45 split)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Left column (55%)               Right column (45%)            │
│  ─────────────────               ──────────────────            │
│  [section badge: ACESSO]         ┌──────────────────────────┐  │
│                                  │    glass-strong card     │  │
│  Bem-vindo ao                    │                          │  │
│  Ipê Village [gradient]          │  Email                   │  │
│                                  │  [──────────────────────]│  │
│  Gerencie check-ins com          │                          │  │
│  velocidade e elegância.         │  Senha                   │  │
│                                  │  [──────────────────────]│  │
│  [float-bob card 1]              │                          │  │
│  [slow-spin ring]                │  [Entrar →] gradient btn │  │
│  [float-bob card 2]              │                          │  │
│                                  │  error message slot      │  │
│  3×3 dot grid accent             └──────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Bold bet: Animated hero graphic** (left column)
- Outer dashed ring `border-2 border-dashed border-[#0052FF]/25 rounded-full w-80 h-80`, `slow-spin` (60s linear infinite)
- Float card 1 (inside ring): `glass-strong rounded-xl shadow-lg px-4 py-3 float-card-1` — shows "✓ Carlos Mendes · Check-in registrado" with emerald dot
- Float card 2 (below ring, offset): `glass-strong rounded-xl shadow-lg px-4 py-3 float-card-2` — shows "47 presentes · Evento Ativo" with `#0052FF` dot
- 3×3 dot grid top-right corner: `grid grid-cols-3 gap-3` of `w-1.5 h-1.5 rounded-full bg-[#0052FF]/20` dots
- Corner accent block: `w-16 h-16 rounded-xl bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] shadow-[0_4px_14px_rgba(0,82,255,0.3)]`

---

## Layout (Mobile — stacked)

Right column only (login card) displayed full-width. Left hero column with animated graphic hidden (`hidden md:flex`). Section badge and tagline shown above card in a condensed hero text block (`max-w-xs mx-auto text-center`).

Mobile: `min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8`

---

## Components Used

| Component | Usage | Variant/Notes |
|-----------|-------|--------------|
| `SectionBadge` | "ACESSO" label above hero h1 | `pulse={false}` — this is a hero label, not a live indicator |
| `Input` | Email + password fields | `type="email"`, `type="password"`, `h-12`, `rounded-xl`, focus ring `#0052FF` |
| `Button` | "Entrar" primary action | Default variant (gradient), `w-full h-12 rounded-xl text-base font-medium` |
| Auth (useAuth hook) | `login()` function | Supabase email/password auth |

---

## Typography

**Hero h1:** `font-[Calistoga] text-[2.75rem] md:text-[5.25rem] leading-[1.05] tracking-[-0.02em] text-foreground`
- Key word "Ipê Village" on second line: wrapped in `<span class="gradient-text">` for Electric Blue gradient fill
- Optional: translucent underline bar beneath "Ipê Village": `block h-3 rounded-sm bg-gradient-to-r from-[#0052FF]/15 to-[#4D7CFF]/10 -mt-2`

**Tagline:** `text-base md:text-lg text-muted-foreground max-w-sm` (Inter, normal weight)

**Form labels:** `text-sm font-medium text-foreground` (Inter)

**Section badge text:** `font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]` (JetBrains Mono)

---

## Visual Surface

**Login card:**
- `glass-strong` (`bg-[--card]/85 backdrop-blur-xl rounded-2xl`)
- Border: `border border-[--border]`
- Shadow: `shadow-[0_8px_32px_rgba(0,0,0,0.3)]`
- Padding: `p-8`
- Max-width: `max-w-sm w-full`

**Page background:**
- `bg-[--background]` (`#0F172A`)
- Radial glow top-left: `absolute top-[-150px] left-[-150px] w-[400px] h-[400px] rounded-full bg-[#0052FF]/6 blur-[60px] pointer-events-none`
- Radial glow bottom-right: same but bottom-right, `bg-[#4D7CFF]/4`

**Image resources:** CSS-only. No photos. The animated graphic (float cards + ring + dots) is pure HTML/CSS per STYLE.md bold bet 3.

---

## States

### Default
Section badge → hero text stack → animated graphic (left). Email input → password input → Entrar button (right card).

### Loading (after submit)
- "Entrar" button: gradient maintained, spinner icon replaces arrow icon (`animate-spin`), button `disabled`, `cursor-not-allowed opacity-90`
- Inputs: `disabled` — prevent resubmit

### Error (wrong credentials)
- `error-shake` on card: `translateX(±4px)` × 3, 300ms
- Error text below button: `text-sm text-destructive flex items-center gap-2` with `AlertCircle` icon
- Message: "E-mail ou senha incorretos. Tente novamente."
- Inputs not cleared — user may fix email/password

### Empty (first load, no prefill)
Default state. Placeholder text in inputs: `"seu@email.com"`, `"••••••••"`.

---

## Interactions & Animations

| Trigger | Element | Animation | Spec |
|---------|---------|-----------|------|
| Page load | Float cards | `float-bob` — `translateY(0 → -10px → 0)` sine | card-1: 5s, card-2: 4s 0.5s delay, ease-in-out infinite |
| Page load | Dashed ring | `slow-spin` — `rotate(0 → 360deg)` | 60s linear infinite |
| Page load | Left column content | `fade-up-stagger` — opacity+translateY | badge: 0.1s, h1: 0.2s, tagline: 0.3s, graphic: 0.4s |
| Hover | Entrar button | `gradient-lift` — `-translate-y-0.5`, shadow accent-tinted | 200ms ease-out |
| Press | Entrar button | `scale-press` — `scale-[0.98]` | 100ms |
| Focus | Email / Password | `ring-2 ring-[#0052FF] ring-offset-2 ring-offset-background` | instant |
| Submit error | Login card | `error-shake` — `translateX(±4px)` × 3 | 300ms |

---

## Accessibility

**VoiceOver order (logical DOM):**
1. Section badge "ACESSO" (aria-hidden — decorative)
2. Heading "Bem-vindo ao Ipê Village" (h1)
3. Tagline paragraph
4. Email input (label: "E-mail", autocomplete="email")
5. Password input (label: "Senha", autocomplete="current-password")
6. Entrar button (aria-label: "Entrar no sistema")
7. Error message (aria-live="polite" region, visible only on error)

**Animated elements:** Float-bob cards and slow-spin ring are `aria-hidden="true"`. Respect `prefers-reduced-motion` — disable all keyframe animations.

**Contrast:** Electric Blue `#0052FF` on `#0F172A` background = 5.2:1 (AA pass on large text). White on gradient button = 4.8:1 (AA).

**Form:** `<form>` with `noValidate`, client-side validation before submit. Password field: show/hide toggle button with `aria-label="Mostrar senha"`.

---

## Implementation Notes

- Page is outside `Layout.tsx` — no nav wrapper. Standalone route: `src/routes/login.tsx` (or similar — check existing file structure).
- Animated hero graphic: use `position: absolute` containers within the left column. All animation via CSS keyframes in `src/styles.css`.
- Float cards content is static markup — no data binding needed on this page.
- `useAuth().login(email, password)` → on success, router push to `/`.
