# Micro-Interactions
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

All interactions drawn exclusively from the STYLE.md effects vocabulary: **gradient-lift, gentle-lift, icon-nudge, pulse-dot, fade-up-stagger, float-bob, slow-spin, color-shift, scale-press.**

---

## Interaction Table

| Trigger | Element | Animation | Duration | Easing | Effect Name |
|---------|---------|-----------|---------|--------|-------------|
| Hover | Primary Button | `-translate-y-0.5`, shadow → `0 4px 14px rgba(0,82,255,0.3)`, `brightness-110` | 200ms | ease-out | gradient-lift |
| Active/Press | Primary Button | `scale-[0.98]` | 100ms | ease-out | scale-press |
| Hover | Card (event, person) | `-translate-y-0.5`, shadow `shadow-md → shadow-xl`, gradient overlay `opacity-0 → opacity-100` | 200ms | ease-out | gentle-lift |
| Hover | Nav Link | `color → #0052FF` | 200ms | ease-out | color-shift |
| Hover | Icon button / action icon | `scale-110` on icon container | 200ms | ease-out | icon-nudge |
| Continuous | Badge indicator dot | `scale(1→1.3→1)`, `opacity(1→0.7→1)` infinite | 2s | ease-in-out | pulse-dot |
| Page enter | Content sections (staggered) | `opacity: 0→1`, `translateY(28px→0)` | 700ms | cubic-bezier(0.16,1,0.3,1) | fade-up-stagger |
| Page enter | Hero decorative cards | `translateY(0 → -10px → 0)` sine, staggered | 4s–5s | ease-in-out infinite | float-bob |
| Page enter | Decorative ring (login hero) | `rotate(0 → 360deg)` | 60s | linear infinite | slow-spin |
| Focus | Any input / button | `ring-2 ring-[#0052FF] ring-offset-2 ring-offset-background` | instant | — | focus-ring |
| Success | Check-in toast | Slide-in from bottom-right, `opacity: 0→1`, stays 3s, fade-out | 300ms in / 200ms out | ease-out | Sonner toast |
| Submit | Check-in button | Spinner replaces icon, `disabled` state, gradient maintained | during fetch | — | loading-state |
| Error | Form field | Border shifts to `--destructive`, shake animation `translateX(±4px)` × 3 | 300ms total | ease-in-out | error-shake |

---

## Stagger Delay Reference

For `fade-up-stagger` on card grids and stat rows:

| Child Index | Delay |
|------------|-------|
| 1st | 0.1s |
| 2nd | 0.2s |
| 3rd | 0.3s |
| 4th | 0.4s |
| 5th+ | +0.1s increments, cap at 0.6s |

---

## Reduced Motion

All transform + opacity animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .fade-up, .float-card, .slow-spin, .pulse-dot {
    animation: none;
  }
  * {
    transition-duration: 0.01ms !important;
  }
}
```

Float-bob and slow-spin: disable entirely.
Fade-up-stagger: collapse to instant opacity reveal, no transform.
Pulse-dot: static opacity-100 (no pulse).

---

## Gesture Notes

- **Tap** — primary action on all interactive elements
- **Long press** — not used (web context; no native long-press pattern)
- **Swipe** — Sheet drawer dismisses on swipe-right (Radix Sheet built-in)
- **Scroll** — Standard; no scroll-hijacking; no sticky-scroll sequences

---

## Related

- [screen-01-login.md](../screen-01-login.md) — float-bob, slow-spin, fade-up-stagger on hero
- [screen-02-checkin.md](../screen-02-checkin.md) — gentle-lift on event cards, pulse-dot on section badge
- [screen-03-pessoas.md](../screen-03-pessoas.md) — gentle-lift on person cards
- [screen-04-dashboard.md](../screen-04-dashboard.md) — fade-up-stagger on stat cards
