# Ipê Village Design System

## Company Overview

**Ipê** is Brazil's first pop-up city — a temporary, curated village experience combining events, community, architecture, and technology. The product described here is the **Ipê Village Check-In & Security System**: a real-time check-in dashboard with facial recognition for the main entrance, integrated with [Luma](https://lu.ma) for event registrations, and Telegram for reporting.

**Domain:** [ipe.city](https://www.ipe.city)

---

## Sources

| Source | Path / URL | Notes |
|---|---|---|
| Codebase | `Sistema Checkin Ipe Village/` (mounted via File System Access API) | Full TanStack Start + Supabase app |
| GitHub repo | `Duquencesar/event-passport` (public) | Secondary event-passport product |
| Brand logo (vector) | `assets/ipe-city-logo.png` | Full wordmark "IPÊ city" |
| Brand icon | `assets/ipe-logo-icon.jpg` | Icon-only chevron/caret mark |
| Cover image | `assets/ipe-city-cover.jpg` | "Building Brazil's First Pop-Up Village" banner |
| Design tokens | `src/styles.css` in codebase | OKLCH CSS vars, glass utilities, animation keyframes |
| Design system docs | `.design/system/` in codebase | TOKENS.md, COMPONENTS.md, CONVENTIONS.md, STACK.md |

---

## Products

### 1. Check-In App (`/`)
Web dashboard for event staff to search and check in attendees by name. Supports event-centric mode (selecting an event first) and ad-hoc check-in. Real-time count refresh every 30s. Luma sync button. Bulk check-in from participant list.

### 2. Dashboard (`/dashboard`)
Analytics: total check-ins, unique people, architects active, daily attendance bar chart (Recharts), access-type pie chart, top attendees table. Date-range filter + event filter. CSV export.

### 3. People Manager (`/pessoas`)
Full CRUD for registered attendees. Tags, ticket types, registration history. Inline edit, search, pagination, person profile modal.

### 4. Events (`/eventos`)
Event listing synced from Luma. Shows registration count, check-in count, progress bar per event.

### 5. Import (`/import`)
CSV/XLSX import for bulk person registration. Tabs for people vs. registrations.

### 6. Configurations (`/configuracoes`)
Admin settings.

---

## CONTENT FUNDAMENTALS

### Language
- All copy is in **Brazilian Portuguese**.
- First person singular ("Entrar", "Buscar") — imperatives for actions.
- Second person implied (not explicit "você") for prompts.
- No emoji in UI copy. Section badges and labels use **ALL CAPS MONOSPACE** (e.g. "EVENTOS ATIVOS", "ANÁLISE", "MAIS PRESENTES").

### Tone
- **Direct and operational** — no marketing fluff inside the app. Every label is functional.
- **Numbers-forward** — large stat values displayed prominently with Calistoga display font.
- **Technical precision** — timestamps in Brasília timezone, ISO dates on export filenames, monospace labels.
- **Warm confidence** — the hero copy on login is poetic ("Gerencie check-ins com velocidade e elegância."), but within the app itself it's terse.

### Casing
- Section badges: ALL CAPS, letter-spacing 0.15em
- Nav items: Title Case (Check-in, Eventos, Inscritos, Importar, Dashboard, Config)
- Stat labels: ALL CAPS MONO
- Body/form labels: Sentence case

### Specific vocabulary
- **Check-in** (hyphenated, not "checkin")
- **Inscritos** (not "usuários" or "membros") for registered people
- **Arquiteto / Explorer / Day Pass / Week Pass** — ticket tier names
- **Brasília time** always for timestamps

---

## VISUAL FOUNDATIONS

### Color System
Dark navy base with electric lime accent and sky blue secondary.

| Token | OKLCH | Hex approx | Usage |
|---|---|---|---|
| `--background` | `oklch(0.11 0.05 250)` | `#0B1929` | Page background, deep navy |
| `--card` | `oklch(0.16 0.05 250)` | `#0F2035` | Cards, panels |
| `--foreground` | `oklch(0.95 0.005 265)` | `#EEF2FF` | Primary text |
| `--primary` | `oklch(0.82 0.24 130)` | `#84E400` | Ipê lime — CTAs, accents, active states |
| `--primary-foreground` | `oklch(0.11 0.05 250)` | `#0B1929` | Text on lime bg |
| `--secondary` | `oklch(0.72 0.13 210)` | `#29B6F6` | Sky blue — secondary actions, stat icons |
| `--muted` | `oklch(0.26 0.05 250)` | `#1E3352` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.58 0.05 250)` | `#94A3B8` | Labels, placeholders |
| `--border` | `oklch(0.23 0.06 250)` | `#1A2E44` | Borders, dividers |
| `--destructive` | `oklch(0.58 0.22 25)` | `#E05757` | Errors, deletes |
| `--gradient-signature` | lime → sky blue | `#84E400 → #29B6F6` | Gradient text, gradient accents |

### Typography
- **Display / Headings (h1, h2):** `Calistoga` — Google Fonts, chunky slab serif, used for hero numbers and section titles
- **Body:** `Inter` — clean, readable sans-serif for all labels, descriptions, form copy
- **Mono:** `JetBrains Mono` — section badge labels, stat sublabels, table indices, timestamps
- Type scale uses Tailwind defaults (`text-xs` through `text-5xl`). No fixed px scale.
- Gradient text via `background-clip: text` + `gradient-signature`.

### Glass System
Three levels of frosted-glass card, all dark-navy tinted:

| Class | Opacity | Blur | Usage |
|---|---|---|---|
| `.glass-subtle` | 45% | 8px | Secondary containers, activity feeds |
| `.glass` | 72% | 12px | Main content cards (search card, event cards) |
| `.glass-strong` | 85% | 20px | Header bar, login form card, floating stats |

All glass has `border: 1px solid oklch(from var(--border) l c h / 60%)` and layered box-shadows.

### Backgrounds & Textures
- **Page:** Deep navy `#0B1929` solid
- **Stat cards / inverted sections:** `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)` at 32px×32px — subtle dot-grid texture
- **Section glow:** Radial lime gradient `rgba(132,228,0,0.08)` blurred 60px, top-right corner decoration
- **No full-bleed photography** in UI — cover image used for marketing only

### Spacing & Radius
- Base radius: `0.75rem` (12px)
- Scale: sm (8px), md (10px), lg (12px), xl (16px), 2xl (20px), 3xl (24px), 4xl (28px)
- Frequent usage: `rounded-xl` (16px) for inputs/buttons, `rounded-2xl` (20px) for panels, `rounded-3xl` (24px) for hero cards

### Animation
- `fade-up`: 0.7s cubic-bezier(0.16,1,0.3,1) — page entry
- `float-bob`: 5s ease-in-out infinite — decorative floating cards on login
- `pulse-dot`: 2s ease-in-out — active indicator dots in SectionBadge
- `slow-spin`: 60s linear — dashed ring on login
- `stagger > *:nth-child(n)` — 100ms incremental delays for grid entries
- Hover: `translateY(-2px)` + enhanced box-shadow (`.gentle-lift`)
- Button press: `scale(0.98)` (`.gradient-lift:active`)
- Nav active: lime underline via `::after` pseudo-element

### Cards
- Background: `oklch(0.10 0.02 265)` with dot-pattern (StatCard) or `.glass` (event cards)
- Border: `1px solid var(--border)`
- Radius: `rounded-xl` standard
- Hover: `translateY(-0.5px)` + shadow-[0_10px_25px_rgba(0,0,0,0.2)]

### Icons
- **Lucide React** — consistent stroke-width 2, 16–20px sizes
- No icon fonts or sprite sheets
- Icon color: `text-primary` (lime) for primary actions, `text-muted-foreground` for decorative/secondary

### Imagery
- Cover: dark navy base, white type, architecture-themed
- Color vibe: cool-dark, desaturated except for lime and blue accents
- No grain/noise effects; no hand-drawn illustrations
- Avatar initials: gradient `from-[#0d2a54] to-[#29B6F6]`

### Transparency & Blur
- Used extensively via glass utilities
- Blurs are layered: header uses glass-strong (20px), cards use glass (12px), activity feed uses glass-subtle (8px)
- Background-attachment: fixed for consistent glass effect on scroll

---

## ICONOGRAPHY

**Library:** Lucide React `^0.575.0` (configured via `components.json` `"iconLibrary": "lucide"`)

**Usage:**
- Imported individually from `lucide-react` — no icon font or sprite
- Stroke-weight: default (2px)
- Sizes: `w-3 h-3` (micro), `w-4 h-4` (standard), `w-5 h-5` (medium), `w-12 h-12` (hero/empty states)
- Nav icons: ClipboardList, CalendarDays, Users, Upload, BarChart3, Settings, LogOut
- Feature icons: Search, UserCheck, Clock, MapPin, ChevronRight, ArrowLeft, AlertTriangle, ShieldCheck, RefreshCw, Download, Activity, HardHat, TrendingUp

**Logo assets:**
- `assets/ipe-city-logo.png` — Full wordmark "IPÊ city" (white, transparent bg, for dark surfaces)
- `assets/ipe-logo-icon.jpg` — Icon-only chevron/caret mark (for favicon, small placements)

**No emoji** in UI. Unicode arrows (`→`) used sparingly in CTAs (e.g. "Entrar →").

---

## FILE INDEX

```
README.md                     ← This file
SKILL.md                      ← Agent skill definition
colors_and_type.css           ← CSS custom properties for all brand tokens
assets/
  ipe-city-logo.png           ← Full wordmark (white on transparent)
  ipe-city-cover.jpg          ← Marketing cover photo
  ipe-logo-icon.jpg           ← Icon/chevron mark
  ipe-logo-icon-2.jpg         ← Icon variant
preview/
  brand-logo.html             ← Logo & brand identity card
  colors-base.html            ← Base color palette
  colors-semantic.html        ← Semantic color tokens
  colors-gradient.html        ← Gradients and glow effects
  type-scale.html             ← Typography scale
  type-specimens.html         ← Font specimens
  spacing-radius.html         ← Radius tokens
  spacing-glass.html          ← Glass system
  spacing-shadows.html        ← Shadow & elevation
  components-buttons.html     ← Button variants
  components-badges.html      ← Badges & SectionBadge
  components-statcard.html    ← StatCard component
  components-inputs.html      ← Input & form elements
  components-cards.html       ← Card patterns
  components-nav.html         ← Navigation bar
  animations.html             ← Animation utilities
ui_kits/
  checkin-app/
    README.md
    index.html                ← Full check-in app prototype
```
