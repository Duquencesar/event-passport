# Alternative Directions
> Phase: critique | Project: Ipê Fences | Generated: 2026-04-22

These are two genuinely different redesign approaches — not variations on the current design. Each proposes a different conceptual framing while remaining compatible with the saas token system.

---

## Direction A — "Mission Control"

**Concept:** Reframe the Check-In screen as an operations dashboard, not a form page. The current design treats the check-in flow as: select event → search → click button. Mission Control treats it as a live operations view where the event and feed are always visible, and check-in is a persistent action in a fixed control strip — like a DJ booth or air traffic control station.

**Layout change:**
The Check-In page splits into a fixed left panel (240px) and a main content area. The left panel contains:
- Active event indicator (auto-selected, no cards to click — event switches via compact list in the panel)
- The search input as a persistent, always-focused command bar
- The "Fazer Check-In" button directly below search, always visible

The main content area shows the live check-in feed full-height with a streaming-log aesthetic: monospace timestamps, dense rows, inverted section covering the full main area. New check-ins push from the top with a 2px Electric Blue flash on the new row.

**Bold bet:** The left panel uses an additional bold bet not in the current design — a live "pulse counter" that increments in large Calistoga numerals when a check-in occurs. Large number + fast animation = visceral feedback for Ana standing at a busy desk.

**Trade-offs:**
- Pro: Eliminates the "select event" interaction — the most common task becomes zero-clicks.
- Pro: The live feed is no longer secondary — it becomes the dominant view. Ana can monitor the queue at a glance.
- Con: More complex responsive layout. The fixed left panel needs a different mobile treatment (full-screen bottom sheet on mobile).
- Con: The "event cards" pattern from the current design is fully replaced — if multiple simultaneous events are common, this panel approach could feel cramped.

**When to choose this:** If the primary user is Ana (coordinator), event selection happens once per session, and the live feed is her primary monitoring tool. This direction prioritizes operational efficiency over visual novelty.

---

## Direction B — "Civic Authority"

**Concept:** Reframe the visual language from "modern SaaS startup" to "institutional authority." Same Electric Blue, same dark mode, but replace the decorative flair (float-bob hero, section badge pulse dots, gradient text on every heading) with a more spare, typographic, formal aesthetic — closer to Bloomberg Terminal or Linear's recent design direction. The app should feel like it runs the venue, not like it's selling a subscription.

**Typography shift:** Calistoga stays on the Login h1 only (it's perfect there). All interior screen headings move to Inter Bold at high weight (`font-bold text-3xl`), no gradient text. Hierarchy comes from weight + spacing, not from gradient decoration.

**Pattern shift:**
- SectionBadge is replaced by a simple ruled line + uppercase label: `<hr>` with `text-xs font-mono tracking-[0.2em] text-muted-foreground uppercase` label. Less decorative, more editorial.
- Cards lose the hover gradient overlay (the `from-[#0052FF]/[0.03]` overlay). Cards still lift on hover (`-translate-y-0.5`, deeper shadow) but without the blue tint — cleaner, more neutral.
- The stats bar on Pessoas and Dashboard keeps the inverted-section pattern but removes the dot grid texture. The texture stays only on the Login hero where the bold bet earns its place.
- Primary buttons keep the gradient — this is the correct accent concentration point. All other Electric Blue usage is reduced (fewer elements, stronger signal per use).

**Bold bet retained:** Only Bold Bets 3 (Login animated hero) and 5 (section label, simplified to ruled line) are kept. Bold Bets 1, 2, 4 are dialed back or removed. The gradient border on the selected event card is kept as it's the clearest "which event is active" signal.

**Trade-offs:**
- Pro: Interior screens feel more authoritative and less "startup template." The data reads more clearly without competing decoration.
- Pro: Easier to extend with new pages — fewer patterns to replicate, harder to accidentally violate the system.
- Con: Loses distinctive SaaS character — the design could be confused with "just a dark theme" without the bold bets. Beatriz (digital native) may find it less engaging.
- Con: Requires partially overriding STYLE.md constraints (removes most bold bets, reduces gradient text usage). Would need a brand refinement pass to update the preset.

**When to choose this:** If the product is used internally by staff (it is), and the primary goal is operational clarity over brand expression. When the audience is professional, not consumer. The current design skews slightly toward consumer SaaS aesthetics — Direction B corrects toward internal tooling.
