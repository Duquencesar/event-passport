# Target Adaptations

> Phase: brief | Project: Ipê Fences | Generated: 2026-04-17

---

## Token Strategy

The existing app is dark-mode only with a custom oklch palette. The `saas` preset provides explicit dark-mode tokens. **Strategy: apply saas dark tokens to the existing CSS vars, preserving the dark aesthetic while replacing the oklch literals with saas Electric Blue identity.**

### CSS var overrides in `src/styles.css`

```css
:root {
  /* Electric Blue primary — replaces oklch primary */
  --primary: oklch(0.48 0.27 265);          /* #0052FF in oklch */
  --primary-foreground: oklch(1 0 0);       /* white */
  --ring: oklch(0.48 0.27 265);

  /* Slate background family — matches saas dark_mode */
  --background: oklch(0.13 0.02 265);       /* #0F172A */
  --foreground: oklch(0.94 0.01 265);       /* #F1F5F9 */
  --card: oklch(0.18 0.02 265);             /* #1E293B */
  --card-foreground: oklch(0.94 0.01 265);
  --muted: oklch(0.42 0.03 265);            /* #64748B */
  --muted-foreground: oklch(0.62 0.02 265); /* #94A3B8 */
  --border: oklch(0.27 0.03 265);           /* #334155 */
  --input: oklch(0.27 0.03 265);

  /* Accent — secondary blue */
  --secondary: oklch(0.58 0.20 265);        /* #4D7CFF */
  --secondary-foreground: oklch(1 0 0);

  /* Semantic — keep existing emerald/amber/red */
  /* --destructive stays; success/warning stay in component classes */
}
```

### Glass utility refactor

Replace white-alpha hardcodes with token vars:
```css
.glass        { background: oklch(from var(--card) l c h / 72%); backdrop-filter: blur(12px); }
.glass-strong { background: oklch(from var(--card) l c h / 85%); backdrop-filter: blur(16px); }
.glass-subtle { background: oklch(from var(--card) l c h / 45%); backdrop-filter: blur(8px); }
```

---

## Typography Adaptations

Add to `src/routes/__root.tsx` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Calistoga&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

Add to `src/styles.css`:
```css
:root {
  --font-display: "Calistoga", Georgia, serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

/* Apply display font to h1, h2 */
h1, h2, .display { font-family: var(--font-display); }
```

**Per-page application:**
- Login: `h1` → `font-[Calistoga]` class or `font-display`
- Check-In page title: `text-3xl font-bold` → `text-3xl font-[Calistoga]`
- Dashboard section headings: apply Calistoga
- All other text: stays Inter (system-ui already matches)

---

## Component Adaptations

### Button (primary)
**From:** solid `bg-primary` (oklch blue)
**To:** gradient `bg-gradient-to-r from-[#0052FF] to-[#4D7CFF]` + `hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,82,255,0.3)]`

Update `src/components/ui/button.tsx` default variant:
```ts
default: "bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,82,255,0.25)] hover:brightness-110 active:scale-[0.98] transition-all duration-200",
```

### Section Label Badge (new component)
Create `src/components/SectionBadge.tsx`:
```tsx
export function SectionBadge({ label, pulse = false }: { label: string; pulse?: boolean }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-5 py-2">
      <span className={`h-2 w-2 rounded-full bg-[#0052FF] ${pulse ? "animate-pulse" : ""}`} />
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]">
        {label}
      </span>
    </div>
  );
}
```

### Cards (pessoa, event)
Add hover lift to existing card buttons:
```
hover:-translate-y-0.5 hover:shadow-[0_10px_15px_rgba(0,0,0,0.15)] transition-all duration-200
```
Add gradient overlay on hover:
```
relative overflow-hidden group
// inner div:
<div className="absolute inset-0 bg-gradient-to-br from-[#0052FF]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
```

### Gradient Text Utility
Add to `src/styles.css`:
```css
.gradient-text {
  background: linear-gradient(to right, #0052FF, #4D7CFF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```
Apply to key words in login hero and check-in page title.

---

## Platform Considerations

- **Web only** — no mobile app targets
- **Dark mode only** — saas dark tokens applied to `:root`, no `.dark {}` toggle needed
- **Tailwind v4** — `@theme inline` syntax for CSS var mapping; `from-[#0052FF]` arbitrary values work without config

---

## Implementation Target Mapping

| Design Component | Target Primitive | File |
|----------------|-----------------|------|
| Section badge | New `SectionBadge.tsx` | `src/components/SectionBadge.tsx` |
| Gradient button | `button.tsx` default variant | `src/components/ui/button.tsx` |
| Gradient text | `.gradient-text` utility | `src/styles.css` |
| Glass surfaces | `.glass*` refactor | `src/styles.css` |
| Token layer | CSS vars override | `src/styles.css` |
| Font imports | `<head>` links | `src/routes/__root.tsx` |
| Display headings | `font-[Calistoga]` className | Per-page (7 routes) |

---

## Related

- [scope.md](./scope.md)
- [gap-analysis.md](./gap-analysis.md)
- [saas.yml](../../branding/_style-saas/patterns/saas.yml)
- [STYLE.md](../../branding/_style-saas/patterns/STYLE.md)
