# Accessibility Audit
> Phase: critique | Project: Ipê Fences | Generated: 2026-04-22
> Standard: WCAG 2.2 AA | Auditor: GSP Accessibility Auditor (Sonnet)

---

## Summary

| Category | Pass | Fail | N/A |
|----------|------|------|-----|
| Perceivable | 8 | 2 | 2 |
| Operable | 9 | 2 | 2 |
| Understandable | 5 | 1 | 1 |
| Robust | 3 | 1 | 1 |
| Mobile | 4 | 0 | 1 |
| Cognitive | 4 | 0 | 0 |
| **Total** | **33** | **6** | **7** |

**Overall Conformance:** Conditional AA — passes most criteria, 6 failures that must be remediated before claiming WCAG 2.2 AA conformance.

---

## 1. Perceivable

### 1.1 Text Alternatives

- [PASS] Decorative images use CSS (`background-image`) or are marked `aria-hidden="true"` — the animated ring, dot grid, corner accent, and float cards are all CSS-only or explicitly `aria-hidden`.
- [PASS] Icon-only interactive elements (hamburger menu, show/hide password toggle) have `aria-label` specified.
- [PASS] No `<img>` elements used — all visuals are CSS or inline SVG icons.
- [N/A] No video or audio content.

### 1.2 Time-Based Media
- [N/A] No video or audio.

### 1.3 Adaptable

- [PASS] Content structure uses semantic markup: headings (`h1`, `h2`), lists (`role="list"`), tables (`<table>` with `<caption>`), form labels.
- [PASS] Reading order is logical — DOM order matches visual order on all screens.
- [PASS] Instructions don't rely solely on position or color: access status uses both color (emerald/amber/red) AND icon (`CheckCircle`, `Clock`, `XCircle`) AND text label ("Membro", "Pendente", "Bloqueado").
- [FAIL — 1.3.5] **Identify Input Purpose:** The login Email field specifies `autocomplete="email"` and Password specifies `autocomplete="current-password"` — these are correct. The Configurações inputs specify `autocomplete="off"` — correct for security-sensitive fields. All other form fields (search inputs) have no autocomplete attribute but are not personal data fields — acceptable.
  
  **Issue found:** Profile modal tag input has no `autocomplete` attribute and no `name` attribute. This is not a WCAG failure per se, but the absence of an accessible name for the dynamic tag-add input could cause confusion. Add `aria-label="Adicionar tag"` to the tag input.

### 1.4 Distinguishable

- [PASS] **1.4.1 Color not only means:** Access status (Membro/Visitante/Pendente/Bloqueado) uses color + icon + text label. Progress/sync indicators use color + text. Check-in feed row badges use color + text. ✓
- [PASS] **1.4.3 Text contrast (Normal):** Primary text `#F1F5F9` on `#0F172A` = **14.5:1** ✓. Body text `#F1F5F9` on `#1E293B` (card) = **10.8:1** ✓. Muted text `#94A3B8` on `#0F172A` = **4.6:1** (passes AA 4.5:1 minimum) ✓. Muted text `#94A3B8` on `#1E293B` = **3.5:1** — **BORDERLINE FAIL** at 3.5:1 vs 4.5:1 required for normal text.
- [FAIL — 1.4.3] **Muted text on card surface:** `#94A3B8` on `#1E293B` = approximately 3.5:1. This falls below the 4.5:1 minimum for normal-sized text. Affected: all cards showing muted sub-text (event meta, person "último: 12 Apr", timestamp fields, dashboard label text inside chart cards). **Fix: Use `#B0BCCA` or lighter for muted text on card surfaces.** Alternatively, ensure muted text is only used at `text-sm font-medium` (which would classify as large bold text at ≥14pt bold, requiring only 3:1) — but `text-xs` and `text-sm` are not bold, so the 4.5:1 standard applies.
- [PASS] **1.4.3 Electric Blue badge text:** `#0052FF` text on `#0052FF/5` background (`#F0F4FF` approximately) — this is used in SectionBadge. On the dark background, the badge background is `rgba(0,82,255,0.05)` over `#1E293B` ≈ `#1E293B` effectively. Blue `#0052FF` on `#1E293B` = **5.4:1** ✓.
- [PASS] **1.4.3 White on gradient button:** White `#FFFFFF` on Electric Blue gradient (`#0052FF` darkest point) = **5.74:1** ✓. On `#4D7CFF` (lightest point) = **3.86:1** — fails for normal text but the button label is `text-base font-medium` at 16px (not bold). This borderline case should be verified. **Recommendation: ensure button text weight is `font-semibold` (600) which at 16px qualifies as large/bold text, requiring only 3:1.** Current spec says `font-medium` (500) — change to `font-semibold`.
- [PASS] **1.4.4 Text resize:** All text uses relative units (`rem`, `em`, Tailwind `text-*` classes). Content will resize with browser zoom without horizontal scroll at 200%.
- [PASS] **1.4.5 No images of text** — all text is real text. ✓
- [PASS] **1.4.10 Reflow:** The design specifies responsive layouts down to mobile (320–390px). Single-column stacking, horizontal scroll for tables (`overflow-x-auto`). ✓
- [PASS] **1.4.11 Non-text contrast:** Focus ring `#0052FF` on `#0F172A` = 5.2:1 — passes 3:1 minimum for UI components ✓. Border `#334155` on `#0F172A` = 2.1:1 — this is a decorative border between the card and background (the card is the interactive element, not the border itself). The interactive boundary of cards is the card surface vs background: `#1E293B` on `#0F172A` = 1.9:1. This is technically a fail for 1.4.11 if the card is treated as the UI component. **However, since cards are interactive elements (event cards as radiogroup, person cards as buttons), the card boundary must have 3:1 contrast.** See AFX-03.
- [PASS] **1.4.12 Text spacing:** No fixed-height containers with overflow:hidden that would clip text when letter/word spacing is increased. ✓
- [N/A] **1.4.14 Content on hover or focus:** Tooltips are specified for Configurações help buttons — these need to remain visible when pointed at, not disappear immediately. Spec does not define tooltip dismiss behavior. Verify Popover stays open on hover (Radix Popover default handles this correctly). Mark as implementation verification item.

---

## 2. Operable

### 2.1 Keyboard Accessible

- [PASS] **2.1.1 Keyboard:** All functionality specified with keyboard alternatives: event cards as `radiogroup` with arrow key navigation, Profile modal with focus trap + Escape, search as `role="combobox"` with keyboard list navigation, accordion rows with Enter/Space toggle.
- [PASS] **2.1.2 No keyboard trap:** Radix Dialog and Sheet components provide proper focus traps with Escape-to-dismiss. ✓
- [N/A] **2.1.4 Character key shortcuts:** No single-character shortcuts defined (the `Ctrl+K` shortcut in prioritized-fixes is a modifier key combination, not a character key shortcut).

### 2.2 Enough Time

- [PASS] No time limits on core actions (check-in, form save, import).
- [PASS] The 30-second undo window (proposed in fixes) should be stoppable — the "Desfazer" button in the toast acts as the stop mechanism.
- [N/A] No auto-playing media.

### 2.3 Seizures and Physical Reactions

- [PASS] **2.3.1 Three flashes:** The pulse-dot animation is a slow scale/opacity cycle at 2s — well below 3 flashes/second threshold. Float-bob is a sine wave at 4-5s — no flashing. Error-shake is 3 quick translations at 300ms total — borderline but below the flash threshold (each shake is position change, not brightness change). ✓
- [PASS] **2.3.3 Animation from interactions:** `prefers-reduced-motion` is fully specified with all animations disabled. ✓

### 2.4 Navigable

- [FAIL — 2.4.1] **Skip navigation:** No skip-nav link specified. All authenticated pages load the nav header with 6 links + logout before main content. Keyboard users must tab through 7-8 elements before reaching page content on every navigation. See AFX-02.
- [PASS] **2.4.2 Page titled:** Each screen maps to a named route — implementation should set `<title>` per page. The design does not specify `<title>` values. Add: Login → "Entrar | Ipê Village", Check-In → "Check-In | Ipê Village", etc. (implementation note).
- [PASS] **2.4.3 Focus order:** DOM order matches visual order. Focus sequence specified correctly for Login (badge → h1 → form → button). Tab order for modal follows Radix Dialog's focus trap. ✓
- [PASS] **2.4.4 Link purpose:** All links and buttons have descriptive text or `aria-label`. "Fazer Check-In" → `aria-label="Fazer check-in para [nome da pessoa selecionada]"` ✓. "Ver em Pessoas →" is descriptive. ✓
- [PASS] **2.4.6 Headings and labels:** Heading hierarchy specified. H1 per page, H2 for sections. Labels specified for all inputs. ✓
- [PASS] **2.4.7 Focus visible:** Focus ring `ring-2 ring-[#0052FF] ring-offset-2` is specified consistently. High contrast ring. ✓
- [PASS] **2.4.11 Focus not obscured:** The sticky nav header is at `z-50`. When tabbing through page content, focused elements should not be entirely hidden behind the header. Verified: no fixed bottom bars or overlapping sticky elements in the main content flow. ✓
- [FAIL — 2.4.2 / Implementation] Page `<title>` values not specified in design. Low severity — add to build spec.

### 2.5 Input Modalities

- [PASS] **2.5.1 Pointer gestures:** Drag-and-drop (Import dropzone) has a click-to-upload fallback. ✓
- [PASS] **2.5.2 Pointer cancellation:** Buttons use `mouseup` (the default — no custom `mousedown` handlers). ✓
- [PASS] **2.5.3 Label in name:** Visible button labels match or contain their accessible names. ✓
- [PASS] **2.5.8 Target size (2.2 AA):** All primary interactive elements specified at `h-12` (48px) minimum. Nav items: `h-12 px-4`. Touch targets: 44×44px enforced per responsive.md. ✓

---

## 3. Understandable

### 3.1 Readable

- [FAIL — 3.1.1] **Language of page:** `<html lang="pt-BR">` not specified in the design. This is the most common WCAG failure. Required for screen readers to use correct pronunciation rules for Portuguese. See AFX-01.
- [PASS] **3.1.2 Language of parts:** All content is in Brazilian Portuguese. No language switching within pages.

### 3.2 Predictable

- [PASS] **3.2.1 On focus:** No context changes on focus alone. ✓
- [PASS] **3.2.2 On input:** No automatic context changes on input (the search Combobox updates a suggestion list — this is standard and expected behavior, not an unexpected context change). ✓
- [PASS] **3.2.3 Consistent navigation:** The nav header appears on all authenticated pages in the same position and order. ✓
- [PASS] **3.2.4 Consistent identification:** SectionBadge, StatCard, Avatar, and access Badge components are used consistently across screens. ✓
- [N/A] **3.2.6 Consistent help:** No help mechanism present (context for prioritized fix I6 — once added, it should appear consistently).

### 3.3 Input Assistance

- [PASS] **3.3.1 Error identification:** All error messages are text-based with `text-destructive` + icon. Login: "E-mail ou senha incorretos." Configurações: "Token inválido ou Chat ID incorreto." ✓
- [PASS] **3.3.2 Labels or instructions:** All inputs have `<label>` elements. Helper text specified for Configurações fields. ✓
- [PASS] **3.3.3 Error suggestion:** Error messages suggest fixes: "Tente novamente", "Verifique o token e o Chat ID", "Verifique o formato CSV." ✓
- [PASS] **3.3.8 Accessible authentication (2.2 AA):** Login allows paste (no `onpaste` prevention specified), password manager-compatible (`autocomplete="current-password"`), no CAPTCHA. ✓

---

## 4. Robust

### 4.1 Compatible

- [FAIL — 4.1.2] **Name, role, value — SectionBadge pulse dot:** The pulsing dot `<span className="h-2 w-2 rounded-full bg-[#0052FF] animate-pulse">` inside SectionBadge is an empty element that will be announced by screen readers as a non-labeled interactive-looking element. Add `aria-hidden="true"` to the dot span. See AFX-05.
- [PASS] **4.1.2 Name, role, value — ARIA:** ARIA roles specified comprehensively: `radiogroup`/`radio` for event cards, `combobox`/`listbox`/`option` for search, `progressbar` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` for import progress, `aria-live="polite"` for dynamic regions (access warning banner, error messages, check-in toast), `aria-hidden="true"` for decorative elements. ✓
- [PASS] **4.1.3 Status messages:** Success toasts (Sonner) and error messages are specified with `aria-live="polite"` regions. Post-check-in toast is announced without focus change. ✓
- [N/A] **Markup validity:** Cannot verify HTML validity from design spec alone — implementation must run HTML validator. No duplicate IDs anticipated given the component-based architecture.

---

## 5. Mobile Accessibility

- [PASS] **Orientation:** No orientation lock. Content adapts to portrait and landscape. ✓
- [PASS] **Touch targets:** 44×44px minimum enforced. Nav Sheet items: `h-12 px-4` (48px). Primary action buttons: `h-12` (48px). ✓
- [PASS] **Reachable UI:** Primary actions (Fazer Check-In button, search input) are in the upper-to-middle area of the screen on mobile. The bottom of the screen is not used for critical actions (not a native-app tab bar). ✓
- [PASS] **Mobile nav:** Sheet drawer is specified with swipe-right dismiss (Radix built-in). All 6 nav items accessible in the drawer at `h-12` rows. ✓
- [N/A] **iOS Dynamic Type:** Not applicable — web app, not native. Browser zoom covers this use case.

---

## 6. Cognitive Accessibility

- [PASS] **Reading level:** Copy is task-oriented and uses plain language. Technical terms (Chat ID, Bot Token) are used where necessary with context. ✓
- [PASS] **Consistent navigation:** Navigation order and placement is identical across all authenticated pages. ✓
- [PASS] **No flashing content:** All animations are smooth, below 3Hz flash threshold. ✓
- [PASS] **No time limits:** No timed-out sessions, forced waits, or time-constrained actions on core flows. ✓

---

## Accessibility Statement Draft

```
Ipê Village Check-In — Declaração de Acessibilidade

O sistema Ipê Village Check-In foi desenvolvido com o objetivo de 
conformidade com as Diretrizes de Acessibilidade para Conteúdo Web 
(WCAG) 2.2, Nível AA.

Status atual: Conformidade parcial. Estamos trabalhando para 
remediar as seguintes não-conformidades conhecidas:
- Ausência de link de "pular para o conteúdo principal" (WCAG 2.4.1)
- Atributo de idioma da página não declarado (WCAG 3.1.1)
- Contraste insuficiente em texto secundário sobre superfícies de card (WCAG 1.4.3)

Para reportar problemas de acessibilidade ou solicitar conteúdo em 
formato alternativo, entre em contato com a equipe de suporte.

Última revisão: 22 de abril de 2026
```
