# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Code Style

- Components are defined as `const` arrow functions with named exports: `export const Foo = () => { ... };`
- Always use named imports: `import { Foo } from "./Foo"` — never default imports

## Project Overview

A Next.js website that lets users query historical train delay data between any two Norwegian stations. Data comes from the Entur public BigQuery dataset (`ent-data-sharing-ext-prd.realtime_siri_et.realtime_siri_et_last_recorded`). Auth uses a GCP service account — either a server-side default (via env var) or a user-supplied one stored in `localStorage`.

## Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build (checks TypeScript + compiles)
npm run build

# Re-fetch rail stations from Entur NSR API (only needed if stations.json is stale)
npx tsx scripts/fetch-stations.ts
```

## Architecture

### File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — Norwegian lang, Inter font, dark mode init script
│   ├── page.tsx                # Server component: reads stations.json, renders MainContent
│   └── api/
│       ├── search/route.ts     # POST endpoint: validates input → BigQuery → JSON; rate-limited
│       └── validate/route.ts   # POST endpoint: tests user-supplied service account credentials
├── components/
│   ├── MainContent.tsx         # "use client" — state, fetch, reads credentials from localStorage
│   ├── SearchForm.tsx          # Station dropdowns, date presets (30/90/180d), delay slider
│   ├── ResultsTable.tsx        # Results table with colour-coded delay badges
│   ├── ThemeToggle.tsx         # Light/dark mode toggle, persists preference to localStorage
│   ├── SettingsButton.tsx      # Gear icon in header; shows amber dot when custom credentials active
│   └── SettingsDialog.tsx      # Modal: paste own service account JSON, validate, save to localStorage
└── data/
    └── stations.json           # 551 Norwegian rail stations, pre-fetched, committed to repo
scripts/
└── fetch-stations.ts           # One-time: calls Entur NSR GraphQL → writes stations.json
```

### Data Flow

1. `page.tsx` reads `stations.json` at build time via `readFileSync` (no runtime fetch)
2. User fills `SearchForm` and submits → `MainContent.handleSearch()` calls `POST /api/search`
3. If the user has saved custom credentials via `SettingsDialog`, they are read from `localStorage` and sent in the request body as `customCredentials`
4. API route builds a `BigQuery` client (custom credentials if provided, otherwise server default), runs parameterized SQL, returns JSON
5. `ResultsTable` renders rows with delay badges (yellow <30 min, orange 30–59, red ≥60)

### Key API Details

- **BigQuery dataset**: `ent-data-sharing-ext-prd.realtime_siri_et.realtime_siri_et_last_recorded`
- **BigQuery location**: must be `"EU"` — Entur's dataset is EU-region; omitting this causes a location mismatch error
- **Query parameters**: `@station_a`, `@station_b`, `@start_date`, `@end_date`, `@min_delay` (prevents SQL injection)
- **Station matching**: `stopPointName` is a human-readable string (e.g. `"Drammen stasjon"`), not an NSR ID
- **Result cap**: 1500 rows — if hit, the UI shows a warning to narrow the date range
- **Rate limiting**: `POST /api/search` allows 10 requests per IP per hour in production; bypassed in development

### Custom Credentials Flow

Users can supply their own GCP service account via the settings dialog:

1. User opens `SettingsDialog`, pastes their service account JSON
2. `POST /api/validate` tests it by running a `SELECT 1 ... LIMIT 1` against the Entur dataset
3. On success, the JSON is saved to `localStorage` under `customServiceAccount`
4. Subsequent searches send `customCredentials` in the request body; the server uses those instead of the default env-var credentials
5. `SettingsButton` shows an amber dot indicator when custom credentials are active

### Dark Mode

- `layout.tsx` inlines a script that runs before hydration to apply the `dark` class based on `localStorage` or system preference
- `ThemeToggle` component toggles the class and persists the choice to `localStorage`

### Vercel Constraints

- `export const maxDuration = 10` on both API routes (free tier limit)
- BigQuery cold queries on 30 days typically complete in 5–15s

## Environment Variables

Required in `.env.local` (local) and Vercel dashboard/CLI (production):

| Variable                      | Description                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | File path to the service account key JSON (e.g. `./service-account-key.json`), or an inline JSON string. `project_id` is read from the credentials automatically. |

The key file itself (`service-account-key.json`) must be present at the path specified. It is git-ignored — never commit it.

### GCP Service Account Permissions Needed

- `BigQuery Job User` on the billing project
- `BigQuery Data Viewer` on Entur's project (`ent-data-sharing-ext-prd`)

## Deploy to Vercel

```bash
# Set env var (use CLI to avoid multiline issues with JSON)
vercel env add GOOGLE_SERVICE_ACCOUNT_JSON production < /path/to/key.json

vercel --prod
```
