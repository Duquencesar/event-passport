# UI Kit — Ipê Village Check-In App

## Overview
High-fidelity interactive prototype of the Ipê Village Check-In system. Recreates the full app: login, event selection, check-in flow, dashboard analytics, and people list.

## Screens
1. **Login** — hero split layout, glass form card, animated decorations
2. **Event Selection** — today's events grid with stats, Luma sync banner
3. **Check-In** — search + access warning + confirm flow
4. **Dashboard** — stat cards, bar chart, pie chart, top attendees table
5. **People** — attendee list with search, tags, pagination

## Components
- `Layout` — sticky glass-strong header, nav, mobile drawer
- `SectionBadge` — pulsing label with lime dot
- `StatCard` — dot-pattern card with gradient icon
- `EventCard` — glass card with progress bar
- `CheckinSearchPanel` — search + result list + access warning
- `DashboardPage` — charts + table via Recharts CDN

## Design Tokens (from codebase)
See `../../colors_and_type.css`

## Source
Codebase: `Sistema Checkin Ipe Village/src/routes/`
