# Gap Analysis

> Phase: brief | Project: Ipê Fences | Generated: 2026-04-17

---

## Components in Brand System — Missing from Codebase

| Component | saas Spec | Status | Action |
|-----------|----------|--------|--------|
| `SectionBadge` | Pill badge with pulse dot, monospace label, Electric Blue border/tint | Missing | Create `src/components/SectionBadge.tsx` |
| Gradient text utility | `.gradient-text` CSS class | Missing | Add to `src/styles.css` |
| Featured card (gradient border) | 2px gradient stroke via nested divs | Missing | Add to high-priority cards in Dashboard |
| Gradient icon backgrounds | `bg-gradient-to-br from-[#0052FF] to-[#4D7CFF]` on icon wrappers | Missing | Apply to stats icons in Dashboard + Pessoas |
| Ambient animations (float-bob, pulse-dot, slow-spin) | CSS `@keyframes` | Missing | Add to `src/styles.css`; apply to Login hero |

---

## Tokens in Brand System — Missing from Codebase

| Token | saas Value | Gap | Action |
|-------|-----------|-----|--------|
| `--font-display` | `"Calistoga", Georgia, serif` | Not declared | Add to `:root` in `src/styles.css` |
| `--font-mono` | `"JetBrains Mono", monospace` | Not declared | Add to `:root` |
| `--shadow-accent` | `0 4px 14px rgba(0,82,255,0.25)` | Not declared | Add as CSS var |
| `--shadow-accent-lg` | `0 8px 24px rgba(0,82,255,0.35)` | Not declared | Add as CSS var |
| `--gradient-signature` | `linear-gradient(135deg, #0052FF, #4D7CFF)` | Not declared | Add as CSS var |
| Shadow tokens (sm/md/lg/xl) | See saas.yml `elevation` block | Not tokenised — raw values in `.glass*` | Extract to vars |

---

## Existing Tokens That Need Value Updates

These CSS vars exist in `src/styles.css` but need their values updated to match saas dark tokens:

| Var | Current (oklch) | saas Dark Target | Notes |
|-----|----------------|-----------------|-------|
| `--primary` | oklch blue (existing) | `oklch(0.48 0.27 265)` = #0052FF | Adjust hue/chroma to match Electric Blue |
| `--secondary` | existing | `oklch(0.58 0.20 265)` = #4D7CFF | Gradient endpoint |
| `--ring` | matches primary | Same as --primary | No change needed if --primary updated |
| `--background` | existing dark | `oklch(0.13 0.02 265)` = #0F172A | Slightly bluer/cooler slate |
| `--card` | existing surface | `oklch(0.18 0.02 265)` = #1E293B | Raised surface layer |
| `--border` | existing | `oklch(0.27 0.03 265)` = #334155 | Subtle divider |
| `--muted-foreground` | existing | `oklch(0.62 0.02 265)` = #94A3B8 | Secondary text |

---

## Glass Utility Gaps

The `.glass*` classes use hardcoded `oklch(1 0 0 / N%)` (white-alpha). With the saas dark palette they'll render as white washes on slate — must be refactored.

| Class | Current | Required |
|-------|---------|---------|
| `.glass` | `oklch(1 0 0 / 72%)` | `oklch(from var(--card) l c h / 72%)` |
| `.glass-strong` | `oklch(1 0 0 / 85%)` | `oklch(from var(--card) l c h / 85%)` |
| `.glass-subtle` | `oklch(1 0 0 / 45%)` | `oklch(from var(--card) l c h / 45%)` |

---

## shadcn Components — No Gaps

All required shadcn components are already installed:
- Button, Badge, Input, Dialog, Select, Sheet, Table, Tabs, Skeleton, Progress — ✅
- Calendar (for potential date picker upgrade) — ✅
- No additional `npx shadcn add` commands needed

---

## Related

- [scope.md](./scope.md)
- [target-adaptations.md](./target-adaptations.md)
- [CONCERNS.md](../../../.design/system/CONCERNS.md) — full issue list
