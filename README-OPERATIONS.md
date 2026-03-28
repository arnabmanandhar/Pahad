# Pahad Operations Guide

## What Pahad Does
Pahad is a Next.js web app for community mental health screening.

It supports two working modes:
- `CHW` mode for community health workers recording a household visit
- `Supervisor` mode for reviewing area risk, flagged households, and visit trends

## Before You Run It
You need:
- Node.js 18+
- A Supabase project
- A Gemini API key if you want live AI scoring
- Optionally a MiniMax API key for fallback scoring

## Setup
1. Install dependencies
```powershell
npm install
```

2. Create your local env file
```powershell
Copy-Item .env.example .env.local
```

3. Fill in `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
MINIMAX_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. In Supabase SQL Editor, run:
- `supabase/migrations/001_init.sql`

5. Seed demo data
```powershell
npm run seed
```

6. Start the app
```powershell
npm run dev
```

7. Open:
- `http://localhost:3000`

## Demo Accounts
After seeding, use:
- `chw1@demo.com / demo1234`
- `chw2@demo.com / demo1234`
- `chw3@demo.com / demo1234`
- `supervisor@demo.com / demo1234`

## How To Operate The App

### Landing Page
Open `/`.

Use this page to:
- explain the product during a demo
- enter the app through `Launch Pahad`
- preview the visual style and positioning

### Login
Open `/login`.

You can:
- sign in with email/password
- sign in with Google if Supabase OAuth is configured

If Supabase env vars are missing, the UI still renders using demo data for preview mode.

## CHW Workflow

### 1. Open CHW Home
Route:
- `/app`

This screen shows:
- visits this month
- assigned households
- recent visits
- a quick button to start a new visit

### 2. Start a New Visit
Route:
- `/app/visit/new`

Steps:
1. Search and select a household
2. Confirm the visit date
3. Fill the 8 observed signal cards
4. Add optional notes
5. Press `Submit & Score`

What happens next:
- the frontend calls `/api/score`
- Gemini is tried first
- MiniMax is tried second if Gemini fails
- deterministic scoring is used last if both AI providers fail
- the risk explanation card animates in with score, confidence, and key signals

### 3. Review Visit History
Route:
- `/app/visits`

Use this to:
- open prior visits
- confirm dates and risk levels
- revisit explanations and notes

### 4. CHW Settings
Route:
- `/app/settings`

Use this to change:
- language
- light/dark theme

## Supervisor Workflow

### 1. Open Supervisor Dashboard
Route:
- `/supervisor`

This page is the main demo screen.

It shows:
- summary cards
- real-time flag pulse for the last 24 hours
- Nepal risk heatmap
- flagged households panel
- area risk comparison blocks

### 2. Use the Heatmap
On the dashboard map, each area marker reflects average area risk.

Interpretation:
- green = low
- yellow = moderate
- orange = high
- red = critical

The larger and warmer the marker:
- the more households are present
- the higher the average risk

### 3. Review Flagged Households
In the flagged panel you can:
- inspect the highest-risk households
- open household detail pages
- use `Copy summary` to copy a plain-text alert for WhatsApp or reports

### 4. Open Household Detail
Route pattern:
- `/supervisor/household/[id]`

This screen shows:
- household header
- current risk badge
- trend sparkline
- signal radar chart
- latest signal bar chart
- full visit history with expandable rows

### 5. Review CHW Activity
Route:
- `/supervisor/workers`

This gives a simple overview of worker participation and visit counts.

### 6. Supervisor Settings
Route:
- `/supervisor/settings`

Use this to adjust language and theme for presentations or field review.

## Offline And Demo Behavior
Pahad currently supports these fallback behaviors:
- if the network drops in the browser, an offline banner appears
- if AI scoring fails, deterministic scoring is used
- if Supabase env vars are not configured, the app still renders using bundled demo data

## Operating Tips For Demos
For the smoothest demo:
1. Seed the database first
2. Log in as `supervisor@demo.com`
3. Start on `/supervisor`
4. Show the map and flagged households first
5. Then switch to a CHW account and create a visit
6. Return to supervisor view and show the household detail flow

## Production Notes
Current build status:\n- `npm run build` passes\n\nOperational cautions:\n- the app now uses `@supabase/ssr` for auth/session handling\n- the project is upgraded to `next@14.2.35`\n- `npm audit` still reports 1 high-severity vulnerability in the dependency tree

## Useful Commands
```powershell
npm run dev
npm run build
npm run seed
```