# Information Architecture
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## App Hierarchy

```
Ipê Village Check-In
│
├── /login              (unauthenticated entry — auth gate)
│
└── [Authenticated]
    ├── /               Check-In          (P0 — core action)
    │   ├── Event selector cards
    │   ├── Guest search + manual override
    │   ├── Access warning banner
    │   └── Check-in activity feed
    │
    ├── /pessoas         People            (P1 — management)
    │   ├── Stats bar (count by access type)
    │   ├── Person card grid
    │   ├── Tag editor (inline)
    │   └── Profile modal (Dialog)
    │
    ├── /dashboard       Dashboard         (P1 — metrics)
    │   ├── Period selector
    │   ├── Stat cards row
    │   ├── Top attendees table
    │   └── Recharts charts section
    │
    ├── /eventos         Events            (P2 — event mgmt)
    │   ├── Event list (Tabs: All / Active)
    │   └── Luma sync status
    │
    ├── /configuracoes   Settings          (P2 — admin)
    │   ├── Telegram config form
    │   └── Access type reference table
    │
    └── /import          Import            (P3 — utility)
        ├── Tabs: CSV / Luma
        ├── Upload zone
        └── Progress feedback
```

---

## Content Grouping Rationale

### Navigation hierarchy
- **Primary (always visible):** Check-In, Pessoas, Dashboard
- **Secondary (in nav):** Eventos, Configurações, Import
- Check-In is the homepage — most-used, must be zero-clicks from login

### Data relationships
- `Pessoa` ↔ `Evento` via check-in records — the check-in feed on the home page is the live junction
- `Tag` belongs to `Pessoa` — edited inline in the Pessoas page and surfaced in check-in records
- `EventoLuma` sourced from Luma API — Eventos page shows sync status and allows manual refresh

### Page groupings
| Group | Pages | Rationale |
|-------|-------|-----------|
| Operations | Check-In, Pessoas | Day-to-day use; needs fastest access |
| Analytics | Dashboard | Reporting; weekly/monthly use |
| Management | Eventos, Configurações, Import | Setup and maintenance; less frequent |

---

## Navigation Structure

See `navigation.md` for full spec.

**Top-level nav items (desktop sidebar + mobile drawer):**
1. Check-In (`/`) — icon: `LogIn`
2. Pessoas (`/pessoas`) — icon: `Users`
3. Dashboard (`/dashboard`) — icon: `BarChart2`
4. Eventos (`/eventos`) — icon: `Calendar`
5. Configurações (`/configuracoes`) — icon: `Settings`
6. Import (`/import`) — icon: `Upload`

**Active state:** Electric Blue text + gradient background pill indicator
**Logout:** Bottom of nav, always visible, Ghost button

---

## Content Density

| Page | Density |
|------|---------|
| Check-In | Medium — cards + feed require readable spacing |
| Pessoas | Medium-high — grid of person cards, dense stats bar |
| Dashboard | Low-medium — scannable stat cards, chart breathing room |
| Eventos | Medium — list rows, sync status badge |
| Configurações | Low — single form, reference table |
| Import | Low — single action, progress |
