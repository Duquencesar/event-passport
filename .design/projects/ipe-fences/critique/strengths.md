# Strengths
> Phase: critique | Project: Ipê Fences | Generated: 2026-04-22

These are the specific design strengths to preserve through build and any revisions.

---

## 1. The Electric Blue Accent is Disciplined

The `#0052FF → #4D7CFF` gradient appears on precisely the right elements and nowhere else: primary buttons, icon backgrounds, gradient text on key words, selected state (event card gradient border), section badge borders, progress bar fills, focus rings, avatar initials. It is used approximately 10% of the visible surface area — textbook neutral + accent strategy. This discipline is the design's most important quality. **Do not add Electric Blue to any new element without removing it from another.**

---

## 2. The SectionBadge System Creates Real Rhythm

The SectionBadge — `rounded-full border-[#0052FF]/30 bg-[#0052FF]/5` + mono uppercase label + pulse dot — appears consistently at the opening of every page section across all 7 screens. This is rare in app design: a rhythm element that users subconsciously learn to scan for. The pulse dot on live sections (EVENTOS ATIVOS, ATIVIDADE RECENTE) vs static dot on informational sections (ANÁLISE, ADMINISTRAÇÃO) is a meaningful distinction that rewards attention. **Preserve this system completely in build.**

---

## 3. The Login Hero Graphic is Uncommonly Good

The left column of the Login — float-bob cards, slow-spin dashed ring, 3×3 dot grid, corner accent block, large Calistoga headline with gradient "Ipê Village" — is the strongest creative expression in the design. It communicates "modern operations tool" at a glance without stock photography or illustrations. The choice to show real-looking check-in data in the float cards ("✓ Carlos Mendes · Check-in registrado") rather than abstract shapes is a smart brand choice that anchors the hero in the product's context. **Build this exactly to spec.**

---

## 4. Loading Skeletons Are Consistently Specified

Every page has skeleton loading states specified to screen — matching the layout they replace (4× `h-[88px] rounded-xl` for the stats bar, 5× row skeletons for the feed, `h-[300px]` for charts). This level of spec detail means the app will never flash raw content without transition, which is the single biggest perceived-performance win in any data-heavy app. **Build the skeletons first, before the real data components.**

---

## 5. Reduced Motion is First-Class, Not an Afterthought

Every animation in the design has an explicit `prefers-reduced-motion` specification: float-bob disabled, slow-spin disabled, fade-up collapses to instant opacity, pulse-dot becomes static. This is specified at the CSS level with a class-based override strategy that works consistently. Most designs specify animations and add a single `* { animation: none }` as a footnote. This design treats reduced motion as a first-class variant. **Implement the reduced-motion CSS before launching.**

---

## 6. The Inverted-Section Pattern Adds Dimension Without Complexity

The `inverted-section` CSS class — `bg-[#0F172A]` + dot-grid `radial-gradient` texture — is used purposefully on stat cards (Pessoas, Dashboard) and the check-in feed. It creates a visual elevation system where the page background, card surfaces, and inverted sections each occupy a distinct depth layer. The dot texture prevents the inverted sections from reading as "flat dark boxes" — a subtle but crucial detail that elevates the overall surface quality. **Preserve the radial-gradient texture in the implementation of `.inverted-section`.**

---

## 7. Portuguese Microcopy is Authored, Not Generated

Every piece of copy — error messages, empty states, loading messages, button labels, helper text — is written in specific, task-appropriate Brazilian Portuguese. "Gerencie check-ins com velocidade e elegância" is a confident brand statement. "Nenhuma pessoa encontrada — Tente buscar por outro nome ou remover o filtro" is actionable and human. "Sincronizado há 2h · 14 Abr 16:30" reads like a real system status. This level of copy care at the design phase means the implementation team has production-quality strings, not placeholders to fix later. **Do not replace any specified copy with Lorem Ipsum or English equivalents in build.**

---

## 8. Event Card Gradient Border is the Right Use of Bold Bet 4

The gradient border on the selected event card is applied exactly once on the Check-In screen and once on the Dashboard top-rank row. In both cases it marks the most important state on that screen ("which event is active" and "who is the top attendee"). Used twice across 7 screens, it retains signal value. The implementation (`bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF] p-[2px] rounded-xl` outer + `bg-[--card] rounded-[10px]` inner) creates genuine depth that a simple `border-[#0052FF]` would not. **Preserve this implementation exactly — the 2px gap between the gradient and the inner bg is what makes it work.**

---

## 9. Mobile Layouts Are Genuinely Considered

The responsive behavior is not "squeeze it to fit." Each screen has an explicit mobile layout decision:
- Login hides the hero column entirely (`hidden md:flex`) and shows a focused form.
- Check-In event cards use horizontal scroll with snap (`flex overflow-x-auto snap-x`) rather than collapsing to a single column.
- Pessoas replaces Dialog with full-screen Sheet for mobile.
- Import stays narrow (`max-w-2xl`) on all breakpoints — no need for a different mobile layout.
- Touch targets are specified at 44px minimum throughout.

**These decisions should not be revisited during build unless a real mobile testing session reveals a layout problem.**
