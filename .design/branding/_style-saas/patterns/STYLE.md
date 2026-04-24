# Style

## Brand: _style-saas
**Style:** saas | **Generated:** 2026-04-17

> STYLE.md is the single document designer and builder agents consume. It merges the structured rules from the `.yml` preset with the implementation knowledge from the `.md` companion.

---

## Intensity

| Dial | Value | Meaning |
|------|-------|---------|
| Variance | 4 | Structured layouts with strategic asymmetry (hero 1.1fr/0.9fr), not chaotic |
| Motion | 6 | Floating hero elements, pulsing indicators, entrance stagger, scroll parallax |
| Density | 5 | Balanced — generous section whitespace, denser within components |

---

## Philosophy

Clarity through structure, character through bold detail. This style operates on a fundamental tension: restraint in quantity, confidence in execution — every element earns its place, but is executed with deliberate flair. Think the intersection of a high-tech SaaS product's precision with a creative agency's bold portfolio sensibility: professional yet design-forward, sophisticated yet alive. The signature Electric Blue gradient (`#0052FF → #4D7CFF`) is the heartbeat — not just an accent, but a visual signature deployed on buttons, text highlights, icon backgrounds, and badges to command the eye wherever it appears. Minimalism through bold choices, not absence.

---

## Patterns

### Card
| Property | Rule |
|----------|------|
| border | 1px solid `#E2E8F0` |
| shadow | `shadow-md` resting, `shadow-xl` on hover |
| radius | 12px (`rounded-xl`) |
| background | `#FFFFFF` (pure white for maximum lift) |
| hover-overlay | `bg-gradient-to-br from-[#0052FF]/[0.03] to-transparent` fades in |

### Button (primary)
| Property | Rule |
|----------|------|
| background | `linear-gradient(135deg, #0052FF, #4D7CFF)` |
| border | none |
| shadow | `shadow-sm` resting → accent-tinted `0 4px 14px rgba(0,82,255,0.25)` on hover |
| text | weight 500, sentence case, white |
| radius | 12px (`rounded-xl`) |
| hover | `-translate-y-0.5`, `brightness-110`, arrow icon translates +1 |
| active | `scale-[0.98]` |

### Button (secondary)
| Property | Rule |
|----------|------|
| background | transparent |
| border | 1px solid `#E2E8F0` |
| text | weight 500, sentence case, `#0F172A` |
| radius | 12px (`rounded-xl`) |
| hover | border shifts to `#0052FF/30`, subtle shadow appears |

### Input
| Property | Rule |
|----------|------|
| border | 1px solid `#E2E8F0` |
| radius | `rounded-lg` or `rounded-xl` |
| background | transparent or `accent/10` |
| focus | `ring-2 ring-[#0052FF] ring-offset-2` |
| height | `h-12` to `h-14` |

### Badge
| Property | Rule |
|----------|------|
| shape | rounded-full, `border border-[#0052FF]/30 bg-[#0052FF]/5` |
| text | `font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]` |
| decoration | animated pulsing dot — `h-2 w-2 rounded-full bg-[#0052FF]` with scale/opacity pulse |

### Navigation
| Property | Rule |
|----------|------|
| style | clean horizontal, subtle border-bottom |
| links | font-medium, hover shifts to `#0052FF` |
| cta | gradient primary button in nav |

### Layout
| Property | Rule |
|----------|------|
| archetype | **asymmetric-hero-grid** |
| max-width | `max-w-6xl` (72rem) centered |
| section-spacing | `py-28` to `py-44` |
| grid-gap | `gap-5` to `gap-8` |
| surfaces | clean white with radial accent glows at 3–6% opacity on corners |
| decoration | dot-pattern on inverted sections, radial gradient overlays in hero |
| contrast-sections | inverted `bg-[#0F172A] text-white` for stats/CTA — needs dot-pattern texture |

---

## Constraints

### Never
- Flat dark sections without dot-pattern texture — inverted sections need texture or they feel sterile
- More than one gradient direction per element — 135deg diagonal or horizontal only
- Pure black text — always use deep slate `#0F172A`
- Decorative rotations or skew — this is polished, not playful
- Hard-offset shadows — all shadows soft and diffused
- More than two accent colors — single `#0052FF → #4D7CFF` gradient pair only
- Small hero headlines — minimum `text-5xl` mobile, `text-8xl` desktop

### Always
- Signature gradient on primary buttons, featured badges, and icon backgrounds
- Dual-font system — Calistoga (display serif) for h1/h2, Inter (sans-serif) for everything else
- Monospace section labels in pill badges with accent dot (JetBrains Mono, uppercase, `tracking-[0.15em]`)
- At least one inverted contrast section per page
- Gradient text treatment on key headline words via `bg-clip-text`
- Accent-tinted shadows on featured elements

---

## Effects

**Interaction vocabulary:** gradient-lift, gentle-lift, icon-nudge, pulse-dot, fade-up-stagger

### Hover
| Element | Technique | Description |
|---------|-----------|-------------|
| card | gentle-lift | `-translate-y-0.5`, shadow deepens md→xl, gradient overlay fades in |
| button | gradient-lift | `-translate-y-0.5`, shadow shifts to accent-tinted, `brightness-110` |
| link | color-shift | color shifts to `#0052FF` |
| icon | icon-nudge | `scale-110` on icon container |

### Active
| Element | Technique | Description |
|---------|-----------|-------------|
| button | scale-press | `scale-[0.98]` — tactile press feedback |

### Focus
| Element | Rule |
|---------|------|
| general | `ring-2 ring-[#0052FF] ring-offset-2 ring-offset-background` |

### Transition
`duration-200` to `duration-300`, `ease-out`. Entrance animations: `duration-700` with `0.1s` stagger between children.

### Ambient

- **pulse-dot** — Badge indicator dot: `scale/opacity` pulse (scale: [1, 1.3, 1], opacity: [1, 0.7, 1]) — `2s` infinite
- **float-bob** — Hero cards bob on y-axis sine wave — `4–5s` ease-in-out infinite, ±10px amplitude
- **slow-spin** — Decorative dashed ring rotates — `60s` linear infinite
- **fade-up-stagger** — Entrance: `opacity: 0 → 1`, `y: 28 → 0`, `duration-700`, `0.1s` delay between children

---

## Bold Bets

1. **Gradient text highlights** — Key words in h1/h2 use the Electric Blue gradient as text fill via `bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] bg-clip-text text-transparent`. Pair with a translucent underline bar (`h-3 rounded-sm bg-gradient-to-r from-[#0052FF]/15 to-[#4D7CFF]/10`) for extra punch.

2. **Inverted contrast section with dot texture** — Stats blocks and final CTAs use `bg-[#0F172A] text-white` with a dot-grid overlay: `background: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)` at `background-size: 32px 32px`. Never use a flat dark section without it.

3. **Animated hero graphic** — An abstract generative composition in the hero right column: a rotating outer dashed ring (`60s` linear infinite), two floating cards with staggered y-axis bobs (`4s` and `5s`), a `3×3` dot grid, and a corner accent block in solid `#0052FF` with `shadow-accent`. Reveal via entrance stagger.

4. **Gradient border on featured elements** — Pricing tiers and featured cards use a 2px gradient stroke: outer `div` with `bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF] p-[2px] rounded-xl`, inner `div` with `bg-card h-full w-full rounded-[10px]`.

5. **Section label badge system** — Every section opens with: `inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-5 py-2` containing a pulsing dot + `font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]`. This is non-negotiable visual rhythm.

---

## Implementation

### Component Code Hints

**Featured card gradient border:**
```tsx
<div className="rounded-xl bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF] p-[2px]">
  <div className="h-full w-full rounded-[10px] bg-card p-6">
    {/* content */}
  </div>
</div>
```

**Section label badge:**
```tsx
<div className="inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-5 py-2">
  <span className="h-2 w-2 animate-pulse rounded-full bg-[#0052FF]" />
  <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]">
    Section Name
  </span>
</div>
```

**Gradient icon background:**
```tsx
<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] shadow-[0_4px_14px_rgba(0,82,255,0.3)]">
  <Icon className="h-6 w-6 text-white" />
</div>
```

### Textures & Surfaces

**Dot-pattern overlay (inverted sections):**
```css
.inverted-section {
  background-color: #0F172A;
  background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

**Radial glow corners:**
```css
.section-with-glow::before {
  content: '';
  position: absolute;
  top: -150px; right: -150px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(0,82,255,0.06), transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}
```

### Typography Treatments

**Gradient text highlight:**
```css
.gradient-text {
  background: linear-gradient(to right, #0052FF, #4D7CFF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

**Hero headline sizing:**
```
Mobile:  text-[2.75rem] leading-[1.05] tracking-[-0.02em] font-normal font-[Calistoga]
Desktop: text-[5.25rem] leading-[1.05] tracking-[-0.02em] font-normal font-[Calistoga]
```

**Section label:**
```
font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]
```

### Animation Recipes

**Float-bob (hero cards):**
```css
@keyframes float-bob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
.float-card-1 { animation: float-bob 5s ease-in-out infinite; }
.float-card-2 { animation: float-bob 4s ease-in-out infinite 0.5s; }
```

**Pulse dot:**
```css
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}
.pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
```

**Slow-spin ring:**
```css
@keyframes slow-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.slow-spin { animation: slow-spin 60s linear infinite; }
```

**Fade-up entrance stagger (Tailwind / custom CSS):**
```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
.stagger > *:nth-child(1) { animation-delay: 0.1s; }
.stagger > *:nth-child(2) { animation-delay: 0.2s; }
.stagger > *:nth-child(3) { animation-delay: 0.3s; }
```

---

## Related

- [saas.yml](./saas.yml) — Source of truth (tokens, intensity, patterns, constraints, effects)
