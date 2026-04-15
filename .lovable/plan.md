

# Ipê Village - Check-In System

## App Name
**Ipê Village - Check-In**

## Design System (based on ipe.city branding)

Colors extracted from the site:
- **Background**: Deep navy `#0F1729`
- **Card/Surface**: Slightly lighter navy `#162032`
- **Primary accent (CTA)**: Lime green `#BFFF00`
- **Primary accent foreground**: Dark navy (text on green buttons)
- **Secondary accent**: Sky blue `#4FC3F7`
- **Text primary**: White `#F8FAFC`
- **Text muted**: `#94A3B8` (slate gray)
- **Border**: `rgba(255,255,255,0.1)`
- **Destructive**: Red for errors
- **Success**: The lime green doubles as success indicator

Typography: Clean sans-serif (Inter). Bold uppercase for headings, regular weight for body.

Overall feel: Dark theme, clean, minimal, professional. No clutter.

## Database (Supabase - 3 tables)

**`people`** — unified person registry
- `id` (uuid PK), `name` (text), `email` (text unique), `tag` (text, e.g. "Arquiteto"), `created_at`

**`registrations`** — Luma imports
- `id` (uuid PK), `person_id` (FK people), `event_name` (text), `ticket_type` (text: IP Village / Day Pass / Workshop/Café), `source` (text default 'luma'), `imported_at`

**`checkins`** — attendance log
- `id` (uuid PK), `person_id` (FK people), `date` (date), `period` (text: Manhã / Tarde), `access_type` (text: IP Village / Day Pass / Workshop/Café), `event_name` (text), `checked_in_at` (timestamptz)

RLS: Disabled initially (internal tool, no public access needed). Can add auth later.

## Pages

### 1. `/` — Check-in (host interface)
- Top bar: "Ipê Village - Check-In" logo + current date + navigation links
- Large search field (autocomplete by name or email from `people` table)
- Quick-select: Period (Manhã / Tarde), Access Type, Event Name
- One-click confirm button (lime green)
- Below: today's check-in feed (last 20, most recent first) with name, time, access type
- Counter badge showing today's total check-ins

### 2. `/import` — CSV Import
- Upload area (drag & drop or click)
- Column mapping preview (name, email, ticket_type, event_name)
- Import summary (new people vs. existing, registrations created)
- Import history list

### 3. `/dashboard` — Analytics
- Date range picker
- KPI cards: Total check-ins, Unique people, Architects active
- Charts (Recharts): Daily attendance bar chart, Access type breakdown pie, Inscritos vs Presentes comparison
- People frequency table (ranking by attendance count)

## Implementation Steps

1. **Setup database** — Create 3 Supabase tables with migrations
2. **Update design tokens** — Apply Ipê branding colors to `styles.css`
3. **Install dependencies** — `papaparse` (CSV), `recharts` (charts), `date-fns` (dates)
4. **Create server functions** — CRUD for people, checkins, registrations + CSV processing
5. **Build check-in page** (`/`) — Search + quick check-in interface
6. **Build import page** (`/import`) — CSV upload + preview + import
7. **Build dashboard** (`/dashboard`) — Analytics with charts
8. **Shared layout** — Nav bar across all pages with Ipê branding

## Technical Details

- All DB access via `createServerFn` (never in loaders directly)
- CSV parsing with PapaParse on client, then server function to bulk insert
- Search: server function with `ilike` query on name/email
- Dashboard queries: aggregation server functions with date filters
- No auth for now (internal tool) — can layer in Supabase Auth later

