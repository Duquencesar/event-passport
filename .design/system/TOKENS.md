# TOKENS.md — Ipê Village Check-In Design System

## Token Source

| Property    | Value                                      |
|-------------|--------------------------------------------|
| File        | `src/styles.css`                           |
| Format      | CSS custom properties (`--name: value`)    |
| Color model | OKLCH throughout (`oklch(L C H)`)          |
| Consumed by | Tailwind v4 `@theme inline {}` block; shadcn components via `var(--token)` references |
| Font import | Declared in `@theme inline` as `--font-sans`; no `@font-face` — relies on system / CDN fallback |

---

## Token Coverage

| Category   | Defined? | Detail                                                                                                               |
|------------|----------|----------------------------------------------------------------------------------------------------------------------|
| Colors     | Yes — full set | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`; plus 5 chart vars, 8 sidebar vars. Brand accent: Ipê lime green `oklch(0.72 0.19 135)`, sky blue `oklch(0.68 0.12 240)`. |
| Typography | Partial  | `--font-sans` declared in `@theme inline` as `"SF Pro Display", "Inter", ui-sans-serif, ...`. No `--font-size-*` or `--line-height-*` tokens; type scale relies on Tailwind defaults (`text-sm`, `text-lg`, etc.). No `@font-face` or explicit font loading.  |
| Spacing    | No       | No custom spacing tokens. Relies entirely on Tailwind's default spacing scale (`p-4`, `gap-3`, etc.).               |
| Radii      | Yes — full set | Base `--radius: 0.875rem`; derived: `--radius-sm` through `--radius-4xl` in `@theme inline`. Pages frequently override with `rounded-2xl`, `rounded-3xl` inline.   |
| Shadows    | Partial  | No `--shadow-*` CSS tokens. Shadows are defined inline inside `.glass`, `.glass-strong`, `.glass-subtle` utility classes using `box-shadow` literals. One inline `shadow-primary/20` usage in index.tsx.      |
| Dark mode  | No       | `@custom-variant dark (&:is(.dark *))` is registered but **no `.dark` token overrides are defined**. There is no dark-mode variant block in `:root` or any `@layer`. The design is light-only.          |

---

## Theme Configuration

Relevant excerpts from `src/styles.css`:

```css
/* Base radius */
:root {
  --radius: 0.875rem;

  /* Primary — Ipê lime green */
  --primary: oklch(0.72 0.19 135);
  --primary-foreground: oklch(0.99 0.005 110);

  /* Secondary — Ipê sky blue */
  --secondary: oklch(0.68 0.12 240);
  --secondary-foreground: oklch(0.99 0.005 240);

  /* Backgrounds */
  --background: oklch(0.975 0.005 240);
  --card:        oklch(1 0 0 / 82%);
  --muted:       oklch(0.94 0.008 240);
}

/* Glass utilities (not Tailwind tokens — raw utility classes) */
.glass        { background: oklch(1 0 0 / 72%);  backdrop-filter: blur(24px) saturate(1.5); ... }
.glass-strong { background: oklch(1 0 0 / 85%);  backdrop-filter: blur(40px) saturate(1.6); ... }
.glass-subtle { background: oklch(1 0 0 / 55%);  backdrop-filter: blur(16px) saturate(1.4); ... }

/* Body gradient */
body {
  background: linear-gradient(160deg,
    oklch(0.97 0.008 220),
    oklch(0.96 0.012 245),
    oklch(0.975 0.005 200)
  );
  background-attachment: fixed;
  font-family: "SF Pro Display", "Inter", ui-sans-serif, ...;
}
```

### Tailwind @theme inline mapping

```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);

  --color-primary:     var(--primary);
  --color-secondary:   var(--secondary);
  --color-background:  var(--background);
  --color-foreground:  var(--foreground);
  /* ... (all semantic tokens mapped 1-to-1) */

  --font-sans: "SF Pro Display", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
}
```

---

## Prior GSP Tokens

No prior GSP token files (e.g., `TOKENS.json`, `.design/tokens.json`, `tokens.ts`) detected in the codebase. Tokens are defined exclusively in `src/styles.css`.
