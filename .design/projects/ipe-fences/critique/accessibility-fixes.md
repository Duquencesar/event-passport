# Accessibility Fixes
> Phase: critique | Project: Ipê Fences | Generated: 2026-04-22
> Standard: WCAG 2.2 AA | Only Critical and Major severity items listed.

See [prioritized-fixes.md](./prioritized-fixes.md) for full design fix list.

---

## Violations Table

| ID | Issue | Severity | WCAG Criterion | Screen(s) | Remediation |
|----|-------|----------|---------------|-----------|-------------|
| AFX-01 | Missing `lang` attribute on `<html>` | Critical | 3.1.1 Language of Page | All pages | See detail below |
| AFX-02 | No skip navigation link | Critical | 2.4.1 Bypass Blocks | All authenticated pages | See detail below |
| AFX-03 | Insufficient contrast: card boundary vs background | Major | 1.4.11 Non-text Contrast | All pages with interactive cards | See detail below |
| AFX-04 | Muted text on card surfaces fails 4.5:1 | Major | 1.4.3 Contrast (Minimum) | All pages with `text-muted-foreground` inside cards | See detail below |
| AFX-05 | SectionBadge pulse dot not `aria-hidden` | Major | 4.1.2 Name, Role, Value | All pages using `SectionBadge` | See detail below |
| AFX-06 | White button text on lighter gradient stop fails for medium-weight font | Major | 1.4.3 Contrast (Minimum) | All pages — primary Button component | See detail below |

---

## Detailed Remediations

### AFX-01 — Missing `<html lang="pt-BR">`

**Issue:** Screen readers cannot determine the page language, resulting in incorrect pronunciation of Brazilian Portuguese text.

**WCAG Criterion:** 3.1.1 Language of Page (Level A — but required for AA conformance)

**Affected files:** `src/routes/__root.tsx` (root HTML document)

**Fix:**
```tsx
// In src/routes/__root.tsx, find the <html> element:
<html lang="pt-BR">
```

If using TanStack Start with a `<Html>` component:
```tsx
import { Html } from '@tanstack/start'
// <Html lang="pt-BR">
```

**Verification:** Run `axe` DevTools or WAVE on any page. Check for "html element must have a lang attribute" — should be resolved.

---

### AFX-02 — No skip navigation link

**Issue:** Keyboard users (and screen reader users in browse mode) must navigate through all 6 nav items + logout button before reaching page content on every page load or navigation. This adds 7-8 Tab presses of overhead on every page.

**WCAG Criterion:** 2.4.1 Bypass Blocks (Level A)

**Affected files:** `src/components/Layout.tsx`

**Fix:**
```tsx
// Add as the FIRST element inside <body> or inside the Layout wrapper, before the nav:
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#0052FF] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-medium"
>
  Ir para conteúdo principal
</a>

// Add id to the main content container in Layout:
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

**Note:** `tabIndex={-1}` on `<main>` allows the skip link to focus the element programmatically without adding it to the natural tab order.

---

### AFX-03 — Interactive card boundary contrast below 3:1

**Issue:** Cards that are interactive (event cards as `radiogroup` options, person cards as buttons) have a background of `#1E293B` on a page background of `#0F172A`. The contrast ratio is approximately 1.9:1 — below the 3:1 minimum required for UI components (WCAG 1.4.11).

**WCAG Criterion:** 1.4.11 Non-text Contrast (Level AA)

**Affected screens:**
- [../design/screen-02-checkin.md](../design/screen-02-checkin.md) — event cards (radiogroup)
- [../design/screen-03-pessoas.md](../design/screen-03-pessoas.md) — person cards (buttons)

**Fix options (choose one):**

Option A — Add a visible border to all interactive cards (current spec already includes `border border-[--border]`):
The `--border` token is `#334155`. `#334155` on `#0F172A` = approximately 2.1:1 — still below 3:1 for the border itself. Lighten the border for interactive cards: add `hover:border-[#4A5568]` and ensure resting border is `border-[#475569]` (approximately 2.9:1 — on threshold) or `border-[#64748B]` (approximately 4.0:1 — passes). 

Option B — Increase the card background contrast:
Update `--card` dark mode token from `#1E293B` to `#253047` — shifts the card-to-background ratio closer to 2.5:1. Still not 3:1, but combined with the border provides sufficient visual boundary.

Option C (recommended) — Add a compound focus + hover border that clearly delineates the card:
Apply `outline-1 outline-[#475569]` as the default interactive card state, upgrading to `outline-[#0052FF] outline-2` on focus/selected. This provides the required boundary contrast through explicit outline rather than background contrast.

**Brand-level note:** This is a brand-level issue — the `--border` and `--card` tokens need adjustment. Run `/gsp-brand-refine` to update `saas.yml` dark_mode border values.

---

### AFX-04 — Muted text on card surfaces fails 4.5:1

**Issue:** `#94A3B8` (muted-foreground token) on `#1E293B` (card background) = approximately 3.5:1 contrast ratio. Fails WCAG 1.4.3 (4.5:1 required for normal text). Affected text includes: event meta text ("14 Abr 09:00"), person "último: 12 Apr", dashboard label text, timestamp fields in the feed.

**WCAG Criterion:** 1.4.3 Contrast (Minimum) — Level AA

**Affected screens:** All screens using `text-muted-foreground` inside card surfaces.
- [../design/screen-02-checkin.md](../design/screen-02-checkin.md) — event card date/time, feed timestamps
- [../design/screen-03-pessoas.md](../design/screen-03-pessoas.md) — person card "último" date
- [../design/screen-04-dashboard.md](../design/screen-04-dashboard.md) — chart axis labels, table metadata
- [../design/screen-05-eventos.md](../design/screen-05-eventos.md) — event row meta text
- [../design/screen-06-configuracoes.md](../design/screen-06-configuracoes.md) — helper text below inputs

**Fix:** Lighten the `--muted-foreground` token for the dark mode context:

```css
/* Current: #94A3B8 (oklch(0.62 0.02 265)) */
/* Required for 4.5:1 on #1E293B: approximately #A8B8C8 or lighter */

/* Update in src/styles.css dark mode token block: */
--muted-foreground: oklch(0.68 0.02 265); /* approximately #A8B4C0 — ~4.5:1 on #1E293B */
```

Verify the updated value with WebAIM Contrast Checker against both `#0F172A` (page bg) and `#1E293B` (card bg).

**Brand-level note:** This is a brand-level token change. Run `/gsp-brand-refine` to update `saas.yml` dark_mode `muted-foreground` value.

---

### AFX-05 — SectionBadge pulse dot not aria-hidden

**Issue:** The pulsing dot element in `SectionBadge` is an empty `<span>` that some screen readers may attempt to describe or announce. Screen readers may announce "empty group" or the element may interrupt the flow of reading the badge label.

**WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)

**Affected files:** `src/components/SectionBadge.tsx`

**Fix:**
```tsx
export function SectionBadge({ label, pulse = false }: { label: string; pulse?: boolean }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-5 py-2">
      {/* Add aria-hidden="true" to the decorative dot */}
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full bg-[#0052FF] ${pulse ? "animate-pulse" : ""}`}
      />
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]">
        {label}
      </span>
    </div>
  );
}
```

**Verification:** Navigate to any page with VoiceOver (Mac) + Safari and tab to or swipe over a SectionBadge. The announcement should be only the label text, not the dot.

---

### AFX-06 — Button text contrast on lighter gradient stop

**Issue:** White text (`#FFFFFF`) on the lighter endpoint of the gradient button (`#4D7CFF`) = approximately 3.86:1. This falls below the 4.5:1 required for normal text (non-bold text ≤ 18pt / non-bold text ≤ 14pt bold). At `font-medium` (weight 500) and `text-base` (16px), the button label is not classified as large text, so 4.5:1 applies.

**WCAG Criterion:** 1.4.3 Contrast (Minimum) — Level AA

**Affected files:** `src/components/ui/button.tsx` — default variant

**Fix Option A — Increase font weight to `font-semibold` (600):**
At 16px semi-bold, some WCAG interpretations classify this as meeting the "bold" threshold (≥14pt bold = 18.67px in pt, or approximately 600 weight at 16px is commonly accepted). At minimum, it improves readability. Change button default variant from `font-medium` to `font-semibold`.

**Fix Option B — Darken the gradient lighter stop:**
Change `to-[#4D7CFF]` to `to-[#3D6AEE]` in the button gradient. `#FFFFFF` on `#3D6AEE` = approximately 4.6:1 — passes AA. Visual impact is minimal (slightly less light at the gradient endpoint).

**Fix Option C (recommended) — Both:** Apply `font-semibold` + darken gradient stop slightly for comfortable margin above 4.5:1.

**Verification:** Use WebAIM Contrast Checker with `#FFFFFF` on `#4D7CFF` before and after the change.
