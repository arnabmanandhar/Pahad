# PAHAD — Complete Codex Build Prompt

> Paste this entire prompt into Codex. It is self-contained and specifies every file, every schema, every UI component, and every piece of logic needed to build the full application in a single pass.

---

## MISSION

Build **Pahad** — a full-stack Next.js PWA for community mental health screening in Nepal. It has two user roles: community health workers (CHWs) who log household observations, and supervisors who monitor risk across their area. The flagship feature is a **live choropleth heatmap of Nepal** showing risk intensity by ward, colored green → yellow → red.

This is a hackathon project. Prioritize:
1. **Visual impact** — the map must be stunning and immediately legible
2. **Robustness** — zero crashes, graceful fallbacks everywhere
3. **Explainability** — every risk score shows WHY it was assigned
4. **Deployment-readiness** — works locally AND on Vercel out of the box

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v3 |
| Database / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Map | Leaflet.js + OpenStreetMap tiles + D3 color scale |
| LLM Scoring | Google Gemini API (primary) + MiniMax fallback |
| i18n | React Context + `en.json` / `ne.json` |
| Charts | Recharts (sparklines + trend bars) |
| Icons | lucide-react |
| Hosting | Vercel-ready (no build-time secrets) |

---

## ENVIRONMENT VARIABLES

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
MINIMAX_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Google OAuth configured in Supabase dashboard only.

---

## PROJECT STRUCTURE

```
pahad/
├── app/
│   ├── layout.tsx                    # Root layout, theme provider, i18n provider
│   ├── page.tsx                      # Landing page
│   ├── login/
│   │   └── page.tsx
│   ├── app/                          # CHW section
│   │   ├── layout.tsx                # Bottom tab bar
│   │   ├── page.tsx                  # CHW Home
│   │   ├── visit/
│   │   │   └── new/page.tsx          # New visit form
│   │   ├── visits/
│   │   │   ├── page.tsx              # Visit history list
│   │   │   └── [id]/page.tsx         # Visit detail
│   │   └── settings/page.tsx
│   └── supervisor/                   # Supervisor section
│       ├── layout.tsx                # Sidebar nav
│       ├── page.tsx                  # Dashboard (map + cards + table)
│       ├── household/
│       │   └── [id]/page.tsx
│       ├── workers/page.tsx
│       └── settings/page.tsx
├── api/
│   └── score/route.ts                # LLM scoring endpoint
├── components/
│   ├── ui/                           # Reusable primitives
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx
│   │   └── EmptyState.tsx
│   ├── map/
│   │   ├── NepalMap.tsx              # Main choropleth map
│   │   ├── RiskLegend.tsx
│   │   └── AreaTooltip.tsx
│   ├── visits/
│   │   ├── VisitForm.tsx
│   │   ├── SignalCard.tsx
│   │   └── RiskExplanation.tsx
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── FlaggedTable.tsx
│   │   └── TrendSparkline.tsx
│   └── shared/
│       ├── LanguageToggle.tsx
│       ├── ThemeToggle.tsx
│       └── ConsentBanner.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts                  # Generated + manual types
│   ├── scoring.ts                    # Fallback deterministic scorer
│   ├── gemini.ts                     # Gemini API wrapper
│   ├── minimax.ts                    # MiniMax API wrapper
│   └── constants.ts                  # Signals, risk colors, etc.
├── hooks/
│   ├── useI18n.ts
│   ├── useTheme.ts
│   ├── useToast.ts
│   └── useRiskColor.ts
├── middleware.ts                      # Auth + role-based routing
├── i18n/
│   ├── en.json
│   └── ne.json
├── public/
│   └── nepal-wards.geojson           # Nepal ward-level GeoJSON (simplified)
├── scripts/
│   └── seed.ts                       # Demo data seed script
└── supabase/
    └── migrations/
        └── 001_init.sql              # Full schema + RLS
```

---

## DATABASE SCHEMA

### File: `supabase/migrations/001_init.sql`

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Areas table
create table areas (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  name_ne text not null,
  district text not null default 'Sindhupalchok',
  ward_number int,
  center_lat float not null,
  center_lng float not null,
  geojson_feature_id text,           -- matches id in nepal-wards.geojson
  created_at timestamptz default now()
);

-- Profiles table
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  role text not null check (role in ('chw', 'supervisor')),
  area_id uuid references areas(id),
  created_at timestamptz default now()
);

-- Households table
create table households (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  head_name text not null,
  area_id uuid not null references areas(id),
  assigned_chw_id uuid not null references profiles(id),
  latest_risk_score int default 0,
  latest_risk_level text default 'low' check (latest_risk_level in ('low','moderate','high','critical')),
  risk_trend text default 'stable' check (risk_trend in ('improving','stable','worsening')),
  status text default 'active' check (status in ('active','reviewed','referred')),
  created_at timestamptz default now()
);

-- Visits table
create table visits (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id),
  chw_id uuid not null references profiles(id),
  visit_date date not null default current_date,
  responses jsonb not null,
  total_score int not null,
  risk_level text not null check (risk_level in ('low','moderate','high','critical')),
  confidence int default 85 check (confidence between 0 and 100),  -- LLM confidence %
  explanation_en text,
  explanation_ne text,
  key_signals text[],                 -- top 2-3 signals that drove the score
  notes text,
  scoring_method text default 'llm' check (scoring_method in ('llm','fallback')),
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table areas enable row level security;
alter table households enable row level security;
alter table visits enable row level security;

-- Areas: everyone can read
create policy "areas_read_all" on areas for select using (true);

-- Profiles: users read own profile, supervisors read all
create policy "profiles_read_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Households: CHW sees assigned, supervisor sees all
create policy "households_chw_read" on households for select using (
  assigned_chw_id = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role = 'supervisor')
);
create policy "households_supervisor_update" on households for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'supervisor')
);

-- Visits: CHW reads own, supervisor reads all
create policy "visits_chw_read" on visits for select using (
  chw_id = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role = 'supervisor')
);
create policy "visits_chw_insert" on visits for insert with check (
  chw_id = auth.uid()
);

-- No deletes for anyone
create policy "no_delete_households" on households for delete using (false);
create policy "no_delete_visits" on visits for delete using (false);

-- Function: update household risk after new visit
create or replace function update_household_risk()
returns trigger as $$
declare
  prev_score int;
  new_trend text;
begin
  select latest_risk_score into prev_score from households where id = new.household_id;
  
  if new.total_score > prev_score + 10 then new_trend := 'worsening';
  elsif new.total_score < prev_score - 10 then new_trend := 'improving';
  else new_trend := 'stable';
  end if;

  update households set
    latest_risk_score = new.total_score,
    latest_risk_level = new.risk_level,
    risk_trend = new_trend
  where id = new.household_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_visit_insert
  after insert on visits
  for each row execute function update_household_risk();
```

---

## SUPABASE TYPES

### File: `lib/supabase/types.ts`

```typescript
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type HouseholdStatus = 'active' | 'reviewed' | 'referred';
export type RiskTrend = 'improving' | 'stable' | 'worsening';
export type UserRole = 'chw' | 'supervisor';
export type ScoringMethod = 'llm' | 'fallback';

export interface Area {
  id: string;
  name: string;
  name_ne: string;
  district: string;
  ward_number: number | null;
  center_lat: number;
  center_lng: number;
  geojson_feature_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  area_id: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  code: string;
  head_name: string;
  area_id: string;
  assigned_chw_id: string;
  latest_risk_score: number;
  latest_risk_level: RiskLevel;
  risk_trend: RiskTrend;
  status: HouseholdStatus;
  created_at: string;
  // Joined fields
  area?: Area;
  chw?: Profile;
}

export interface Visit {
  id: string;
  household_id: string;
  chw_id: string;
  visit_date: string;
  responses: SignalResponses;
  total_score: number;
  risk_level: RiskLevel;
  confidence: number;
  explanation_en: string | null;
  explanation_ne: string | null;
  key_signals: string[] | null;
  notes: string | null;
  scoring_method: ScoringMethod;
  created_at: string;
  // Joined fields
  household?: Household;
  chw?: Profile;
}

export interface SignalResponses {
  sleep: 0 | 1 | 2 | 3;
  appetite: 0 | 1 | 2 | 3;
  withdrawal: 0 | 1 | 2 | 3;
  trauma: 0 | 1 | 2 | 3;
  activities: 0 | 1 | 2 | 3;
  hopelessness: 0 | 1 | 2 | 3;
  substance: 0 | 1 | 2 | 3;
  self_harm: 0 | 1 | 2 | 3;
}

export interface ScoreResponse {
  score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
  key_signals: string[];
  confidence: number;
  scoring_method: ScoringMethod;
}
```

---

## CONSTANTS

### File: `lib/constants.ts`

```typescript
import { RiskLevel } from './supabase/types';

export const SIGNALS = [
  { key: 'sleep',       weight: 2, label_en: 'Sleep changes',                label_ne: 'निद्रामा परिवर्तन' },
  { key: 'appetite',    weight: 2, label_en: 'Appetite changes',              label_ne: 'खानामा परिवर्तन' },
  { key: 'withdrawal',  weight: 3, label_en: 'Social withdrawal',             label_ne: 'सामाजिक अलगाव' },
  { key: 'trauma',      weight: 3, label_en: 'Recent loss or trauma',         label_ne: 'हालैको क्षति वा आघात' },
  { key: 'activities',  weight: 3, label_en: 'Stopped daily activities',      label_ne: 'दैनिक काम बन्द' },
  { key: 'hopelessness',weight: 4, label_en: 'Expressed hopelessness',        label_ne: 'निराशा व्यक्त गरेको' },
  { key: 'substance',   weight: 3, label_en: 'Alcohol/substance use increase',label_ne: 'मदिरा/लागुपदार्थ सेवन बढेको' },
  { key: 'self_harm',   weight: 5, label_en: 'Self-harm indicators',          label_ne: 'आत्मघाती संकेत' },
] as const;

export const RESPONSE_OPTIONS = [
  { value: 0, label_en: 'Not observed', label_ne: 'देखिएन' },
  { value: 1, label_en: 'Mild / sometimes', label_ne: 'हल्का' },
  { value: 2, label_en: 'Significant / often', label_ne: 'ठूलो' },
  { value: 3, label_en: 'Severe / persistent', label_ne: 'गम्भीर' },
] as const;

export const RISK_CONFIG: Record<RiskLevel, {
  color: string;         // Tailwind bg class
  textColor: string;     // Tailwind text class
  borderColor: string;   // Tailwind border class
  hex: string;           // For map rendering
  label_en: string;
  label_ne: string;
  range: string;
}> = {
  low:      { color: 'bg-emerald-100', textColor: 'text-emerald-800', borderColor: 'border-emerald-300', hex: '#10b981', label_en: 'Low',      label_ne: 'कम',      range: '0–30'  },
  moderate: { color: 'bg-amber-100',   textColor: 'text-amber-800',   borderColor: 'border-amber-300',   hex: '#f59e0b', label_en: 'Moderate', label_ne: 'मध्यम',   range: '31–60' },
  high:     { color: 'bg-orange-100',  textColor: 'text-orange-800',  borderColor: 'border-orange-300',  hex: '#f97316', label_en: 'High',     label_ne: 'उच्च',    range: '61–80' },
  critical: { color: 'bg-red-100',     textColor: 'text-red-800',     borderColor: 'border-red-300',     hex: '#ef4444', label_en: 'Critical', label_ne: 'गम्भीर',  range: '81–100'},
};

export const RISK_GRADIENT = {
  0:   '#10b981',   // emerald
  30:  '#84cc16',   // lime
  50:  '#eab308',   // yellow
  65:  '#f97316',   // orange
  80:  '#ef4444',   // red
  100: '#991b1b',   // dark red
};
```

---

## SCORING ENGINE

### File: `lib/scoring.ts`

Deterministic fallback (no LLM):

```typescript
import { SignalResponses, ScoreResponse } from './supabase/types';
import { SIGNALS } from './constants';

const MAX_WEIGHTED_SUM = SIGNALS.reduce((acc, s) => acc + s.weight * 3, 0); // 75

export function deterministicScore(responses: SignalResponses): ScoreResponse {
  const weightedSum = SIGNALS.reduce((acc, signal) => {
    return acc + (responses[signal.key as keyof SignalResponses] ?? 0) * signal.weight;
  }, 0);
  
  const score = Math.round((weightedSum / MAX_WEIGHTED_SUM) * 100);
  
  const risk_level =
    score <= 30 ? 'low' :
    score <= 60 ? 'moderate' :
    score <= 80 ? 'high' : 'critical';

  // Identify key driving signals
  const key_signals = SIGNALS
    .map(s => ({ key: s.key, label: s.label_en, value: responses[s.key as keyof SignalResponses] ?? 0, weight: s.weight }))
    .filter(s => s.value >= 2)
    .sort((a, b) => (b.value * b.weight) - (a.value * a.weight))
    .slice(0, 3)
    .map(s => s.label);

  const explanation_en = `Score calculated using standard WHO mhGAP screening weights. AI explanation unavailable at this time. ${
    key_signals.length > 0 ? `Key observations: ${key_signals.join(', ')}.` : 'No significant signals recorded.'
  }`;
  
  const explanation_ne = `स्कोर मानक WHO mhGAP स्क्रिनिङ तौलहरू प्रयोग गरेर गणना गरिएको छ। AI स्पष्टीकरण उपलब्ध छैन।`;

  return {
    score,
    risk_level,
    explanation_en,
    explanation_ne,
    key_signals,
    confidence: 70,
    scoring_method: 'fallback',
  };
}
```

### File: `lib/gemini.ts`

```typescript
import { SignalResponses, ScoreResponse } from './supabase/types';
import { SIGNALS, RESPONSE_OPTIONS } from './constants';

export async function scoreWithGemini(responses: SignalResponses): Promise<ScoreResponse> {
  const signalLines = SIGNALS.map(s => {
    const val = responses[s.key as keyof SignalResponses] ?? 0;
    const label = RESPONSE_OPTIONS.find(o => o.value === val)?.label_en ?? 'Not observed';
    return `- ${s.label_en}: ${label} (${val}/3)`;
  }).join('\n');

  const prompt = `You are a community mental health screening assistant trained on WHO mhGAP guidelines. You help community health workers in Nepal identify households that may need professional mental health support.

A community health worker visited a household and observed the following:

${signalLines}

Higher values indicate greater severity: 0=Not observed, 1=Mild, 2=Significant, 3=Severe.

Based on these observations, provide a structured assessment. Consider:
- Signal severity AND clinical weight (self-harm and hopelessness are highest risk)
- Combined effect of multiple moderate signals
- Cultural context: in rural Nepal, withdrawal and trauma signals are particularly significant

Respond ONLY with this exact JSON (no markdown, no extra text):
{
  "score": <integer 0-100>,
  "risk_level": "<low|moderate|high|critical>",
  "explanation_en": "<2-3 sentence plain-language explanation for a community health worker. Name the specific signals observed. Do NOT use clinical jargon.>",
  "explanation_ne": "<same explanation in Nepali, natural language for a Nepali health worker>",
  "key_signals": ["<signal name>", "<signal name>"],
  "confidence": <integer 0-100, your confidence in this assessment>
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 500, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  
  const parsed = JSON.parse(text);
  return { ...parsed, scoring_method: 'llm' as const };
}
```

### File: `lib/minimax.ts`

```typescript
import { SignalResponses, ScoreResponse } from './supabase/types';
import { SIGNALS, RESPONSE_OPTIONS } from './constants';

export async function scoreWithMiniMax(responses: SignalResponses): Promise<ScoreResponse> {
  const signalLines = SIGNALS.map(s => {
    const val = responses[s.key as keyof SignalResponses] ?? 0;
    const label = RESPONSE_OPTIONS.find(o => o.value === val)?.label_en ?? 'Not observed';
    return `- ${s.label_en}: ${label} (${val}/3)`;
  }).join('\n');

  const res = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      temperature: 0,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'You are a WHO mhGAP community mental health screening assistant. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `Score these household mental health observations and return JSON with fields: score (0-100), risk_level (low/moderate/high/critical), explanation_en (2-3 sentences), explanation_ne (Nepali translation), key_signals (array of signal names), confidence (0-100).\n\nObservations:\n${signalLines}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`MiniMax HTTP ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty MiniMax response');
  
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return { ...parsed, scoring_method: 'llm' as const };
}
```

### File: `app/api/score/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { scoreWithGemini } from '@/lib/gemini';
import { scoreWithMiniMax } from '@/lib/minimax';
import { deterministicScore } from '@/lib/scoring';
import { SignalResponses } from '@/lib/supabase/types';

export async function POST(req: NextRequest) {
  try {
    const { responses }: { responses: SignalResponses } = await req.json();
    
    if (!responses) {
      return NextResponse.json({ error: 'Missing responses' }, { status: 400 });
    }

    // Try Gemini first
    try {
      const result = await scoreWithGemini(responses);
      return NextResponse.json(result);
    } catch (geminiErr) {
      console.warn('Gemini failed, trying MiniMax:', geminiErr);
    }

    // Fallback to MiniMax
    try {
      const result = await scoreWithMiniMax(responses);
      return NextResponse.json(result);
    } catch (minimaxErr) {
      console.warn('MiniMax failed, using deterministic fallback:', minimaxErr);
    }

    // Final fallback: deterministic
    const result = deterministicScore(responses);
    return NextResponse.json(result);
    
  } catch (err) {
    console.error('Score API error:', err);
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }
}
```

---

## MIDDLEWARE

### File: `middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;
  const isCHWRoute = path.startsWith('/app');
  const isSupervisorRoute = path.startsWith('/supervisor');
  const isProtected = isCHWRoute || isSupervisorRoute;

  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session && isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      if (isCHWRoute && profile.role !== 'chw') {
        return NextResponse.redirect(new URL('/supervisor', req.url));
      }
      if (isSupervisorRoute && profile.role !== 'supervisor') {
        return NextResponse.redirect(new URL('/app', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/app/:path*', '/supervisor/:path*'],
};
```

---

## I18N

### File: `i18n/en.json`

```json
{
  "app_name": "Pahad",
  "tagline": "Community Mental Health Screening",
  "disclaimer": "Pahad is a decision-support tool. It does not diagnose mental health conditions. All data is used to support community health screening only.",
  "login": {
    "title": "Welcome to Pahad",
    "subtitle": "Sign in to continue",
    "email": "Email address",
    "password": "Password",
    "submit": "Sign in",
    "google": "Sign in with Google",
    "error": "Invalid credentials"
  },
  "nav": {
    "home": "Home",
    "new_visit": "New Visit",
    "history": "History",
    "settings": "Settings",
    "dashboard": "Dashboard",
    "workers": "CHW Activity",
    "logout": "Sign out"
  },
  "home": {
    "greeting": "Good morning",
    "visits_this_month": "Visits this month",
    "assigned_households": "Assigned households",
    "start_visit": "Start New Visit",
    "recent_visits": "Recent visits"
  },
  "visit_form": {
    "title": "New Household Visit",
    "select_household": "Select household",
    "visit_date": "Visit date",
    "signals_header": "Observed Signals",
    "notes_label": "Additional notes (optional)",
    "notes_placeholder": "Describe any other observations...",
    "submit": "Submit & Score",
    "submitting": "Scoring...",
    "syncing": "Syncing visit..."
  },
  "risk": {
    "score": "Risk Score",
    "level": "Risk Level",
    "explanation": "What this means",
    "key_signals": "Key observations",
    "confidence": "AI confidence",
    "scored_by_llm": "Scored by AI",
    "scored_by_fallback": "Scored by standard weights",
    "low": "Low",
    "moderate": "Moderate",
    "high": "High",
    "critical": "Critical"
  },
  "signals": {
    "sleep": "Sleep changes",
    "appetite": "Appetite changes",
    "withdrawal": "Social withdrawal",
    "trauma": "Recent loss or trauma",
    "activities": "Stopped daily activities",
    "hopelessness": "Expressed hopelessness",
    "substance": "Alcohol/substance use increase",
    "self_harm": "Self-harm indicators"
  },
  "responses": {
    "0": "Not observed",
    "1": "Mild / sometimes",
    "2": "Significant / often",
    "3": "Severe / persistent"
  },
  "supervisor": {
    "total_screenings": "Total Screenings",
    "flagged_households": "Flagged Households",
    "active_chws": "Active CHWs",
    "avg_risk": "Avg Area Risk",
    "this_month": "this month",
    "high_or_critical": "high or critical",
    "at_least_one_visit": "≥1 visit this month"
  },
  "table": {
    "household": "Household",
    "area": "Area",
    "risk_score": "Risk",
    "last_visit": "Last Visit",
    "chw": "CHW",
    "status": "Status",
    "action": "Action",
    "mark_reviewed": "Mark Reviewed",
    "mark_referred": "Mark Referred",
    "view_details": "View Details"
  },
  "status": {
    "active": "Active",
    "reviewed": "Reviewed",
    "referred": "Referred"
  },
  "trend": {
    "improving": "↓ Improving",
    "stable": "→ Stable",
    "worsening": "↑ Worsening"
  },
  "empty": {
    "chw_home": "Welcome! Start your first household visit.",
    "visit_history": "No visits yet. Your completed visits will appear here.",
    "supervisor_dashboard": "Waiting for CHW visit data. No screenings submitted yet.",
    "flagged_table": "No high-risk households flagged. All clear.",
    "workers": "No CHW activity recorded yet."
  },
  "errors": {
    "network": "Network error. Please try again.",
    "save_failed": "Failed to save visit. Your data is preserved.",
    "score_fallback": "AI unavailable — score calculated using standard weights.",
    "not_found": "Not found",
    "back_home": "Back to Home"
  },
  "map": {
    "title": "Risk Heatmap",
    "subtitle": "Hover over an area to see details",
    "households": "households",
    "avg_score": "Avg score",
    "legend_low": "Low",
    "legend_critical": "Critical"
  }
}
```

### File: `i18n/ne.json`

```json
{
  "app_name": "पहाड",
  "tagline": "सामुदायिक मानसिक स्वास्थ्य स्क्रिनिङ",
  "disclaimer": "पहाड एक निर्णय-समर्थन उपकरण हो। यसले मानसिक स्वास्थ्य अवस्थाहरूको निदान गर्दैन। सबै डेटा सामुदायिक स्वास्थ्य स्क्रिनिङ समर्थन गर्न मात्र प्रयोग गरिन्छ।",
  "login": { "title": "पहाडमा स्वागत छ", "subtitle": "जारी राख्न साइन इन गर्नुहोस्", "email": "इमेल ठेगाना", "password": "पासवर्ड", "submit": "साइन इन", "google": "Google सँग साइन इन", "error": "अमान्य प्रमाणपत्र" },
  "nav": { "home": "गृह", "new_visit": "नयाँ भ्रमण", "history": "इतिहास", "settings": "सेटिङ", "dashboard": "ड्यासबोर्ड", "workers": "CHW गतिविधि", "logout": "साइन आउट" },
  "home": { "greeting": "शुभ प्रभात", "visits_this_month": "यस महिना भ्रमणहरू", "assigned_households": "नियुक्त घरपरिवारहरू", "start_visit": "नयाँ भ्रमण सुरु गर्नुहोस्", "recent_visits": "हालका भ्रमणहरू" },
  "visit_form": { "title": "नयाँ घरपरिवार भ्रमण", "select_household": "घरपरिवार छान्नुहोस्", "visit_date": "भ्रमण मिति", "signals_header": "अवलोकन गरिएका संकेतहरू", "notes_label": "थप टिप्पणी (ऐच्छिक)", "notes_placeholder": "अन्य अवलोकनहरू वर्णन गर्नुहोस्...", "submit": "पेश गर्नुहोस् र स्कोर गर्नुहोस्", "submitting": "स्कोरिङ...", "syncing": "भ्रमण सिङ्क गर्दै..." },
  "risk": { "score": "जोखिम स्कोर", "level": "जोखिम स्तर", "explanation": "यसको अर्थ के हो", "key_signals": "मुख्य अवलोकनहरू", "confidence": "AI विश्वास", "scored_by_llm": "AI द्वारा स्कोर गरिएको", "scored_by_fallback": "मानक तौलहरूद्वारा स्कोर गरिएको", "low": "कम", "moderate": "मध्यम", "high": "उच्च", "critical": "गम्भीर" },
  "signals": { "sleep": "निद्रामा परिवर्तन", "appetite": "खानामा परिवर्तन", "withdrawal": "सामाजिक अलगाव", "trauma": "हालैको क्षति वा आघात", "activities": "दैनिक काम बन्द", "hopelessness": "निराशा व्यक्त गरेको", "substance": "मदिरा/लागुपदार्थ सेवन बढेको", "self_harm": "आत्मघाती संकेत" },
  "responses": { "0": "देखिएन", "1": "हल्का", "2": "ठूलो", "3": "गम्भीर" },
  "supervisor": { "total_screenings": "कुल स्क्रिनिङ", "flagged_households": "फ्ल्याग गरिएका घरपरिवार", "active_chws": "सक्रिय CHW", "avg_risk": "औसत क्षेत्र जोखिम", "this_month": "यस महिना", "high_or_critical": "उच्च वा गम्भीर", "at_least_one_visit": "≥१ भ्रमण यस महिना" },
  "table": { "household": "घरपरिवार", "area": "क्षेत्र", "risk_score": "जोखिम", "last_visit": "अन्तिम भ्रमण", "chw": "CHW", "status": "स्थिति", "action": "कार्य", "mark_reviewed": "समीक्षित चिन्ह लगाउनुहोस्", "mark_referred": "रेफर चिन्ह लगाउनुहोस्", "view_details": "विवरण हेर्नुहोस्" },
  "status": { "active": "सक्रिय", "reviewed": "समीक्षित", "referred": "रेफर गरिएको" },
  "trend": { "improving": "↓ सुधार भइरहेको", "stable": "→ स्थिर", "worsening": "↑ बिग्रँदो" },
  "empty": { "chw_home": "स्वागत छ! आफ्नो पहिलो घरपरिवार भ्रमण सुरु गर्नुहोस्।", "visit_history": "अहिलेसम्म कुनै भ्रमण छैन।", "supervisor_dashboard": "CHW भ्रमण डेटाको प्रतीक्षा गर्दै।", "flagged_table": "कुनै उच्च-जोखिम घरपरिवार फ्ल्याग गरिएको छैन।", "workers": "अहिलेसम्म कुनै CHW गतिविधि रेकर्ड गरिएको छैन।" },
  "errors": { "network": "नेटवर्क त्रुटि। कृपया पुनः प्रयास गर्नुहोस्।", "save_failed": "भ्रमण सेभ गर्न असफल।", "score_fallback": "AI अनुपलब्ध — मानक तौलहरू प्रयोग गरेर स्कोर गणना गरिएको।", "not_found": "फेला परेन", "back_home": "गृहमा फर्कनुहोस्" },
  "map": { "title": "जोखिम हीटम्याप", "subtitle": "विवरण हेर्न क्षेत्रमा होभर गर्नुहोस्", "households": "घरपरिवारहरू", "avg_score": "औसत स्कोर", "legend_low": "कम", "legend_critical": "गम्भीर" }
}
```

---

## MAP COMPONENT — NEPAL CHOROPLETH HEATMAP

This is the centrepiece feature. Build it with maximum care.

### File: `components/map/NepalMap.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { Area, Household } from '@/lib/supabase/types';

interface AreaRiskData {
  area: Area;
  households: Household[];
  avgScore: number;
  householdCount: number;
  highRiskCount: number;
}

interface Props {
  areaRiskData: AreaRiskData[];
  onAreaClick?: (area: Area) => void;
}

export default function NepalMap({ areaRiskData, onAreaClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [tooltip, setTooltip] = useState<{ area: AreaRiskData; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Fix Leaflet icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [28.3949, 84.124],  // Nepal center
        zoom: 7,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
      });

      // OpenStreetMap tile layer (free, no API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        opacity: 0.6,
      }).addTo(map);

      mapInstanceRef.current = { map, L };

      // Add area markers
      renderMarkers(map, L, areaRiskData, onAreaClick);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, L } = mapInstanceRef.current;
    // Clear existing layers (except tile layer)
    map.eachLayer((layer: any) => {
      if (layer._url === undefined) map.removeLayer(layer); // remove non-tile layers
    });
    renderMarkers(map, L, areaRiskData, onAreaClick);
  }, [areaRiskData]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: '480px' }}>
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Risk Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700 z-[1000]">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Risk Level</p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Low</span>
          {/* Gradient bar */}
          <div className="w-24 h-3 rounded-full" style={{
            background: 'linear-gradient(to right, #10b981, #84cc16, #eab308, #f97316, #ef4444)'
          }} />
          <span className="text-xs text-gray-500">Critical</span>
        </div>
      </div>

      {/* Nepal attribution */}
      <div className="absolute top-3 left-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-gray-600 dark:text-gray-400 z-[1000] flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Live screening data
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score <= 30) return '#10b981';
  if (score <= 45) return '#84cc16';
  if (score <= 60) return '#eab308';
  if (score <= 75) return '#f97316';
  return '#ef4444';
}

function renderMarkers(map: any, L: any, areaRiskData: AreaRiskData[], onAreaClick?: (area: any) => void) {
  areaRiskData.forEach(data => {
    const { area, avgScore, householdCount, highRiskCount } = data;
    const color = getScoreColor(avgScore);
    const radius = Math.max(20, Math.min(60, 20 + householdCount * 3));
    
    // Pulsing circle for high/critical areas
    const isPulsing = avgScore > 60;
    
    // Outer pulse ring for high-risk areas
    if (isPulsing) {
      L.circle([area.center_lat, area.center_lng], {
        radius: radius * 120,
        color: color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.3,
        className: 'risk-pulse-ring',
      }).addTo(map);
    }

    // Main circle marker
    const circle = L.circle([area.center_lat, area.center_lng], {
      radius: radius * 80,
      color: color,
      fillColor: color,
      fillOpacity: 0.55,
      weight: 2,
      opacity: 0.9,
    }).addTo(map);

    // Score label marker (custom HTML)
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background: white;
        border: 2px solid ${color};
        border-radius: 8px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: 600;
        color: ${color};
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        line-height: 1.4;
      ">${avgScore > 0 ? avgScore : '—'}</div>`,
      iconAnchor: [16, 8],
    });

    L.marker([area.center_lat + 0.01, area.center_lng], { icon }).addTo(map);

    // Tooltip on hover
    circle.bindTooltip(`
      <div style="font-family: system-ui; padding: 4px 0; min-width: 160px;">
        <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${area.name}</div>
        <div style="font-size: 11px; color: #666; margin-bottom: 2px;">District: ${area.district}</div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
          <span>Avg risk score</span>
          <span style="font-weight: 600; color: ${color};">${avgScore}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px;">
          <span>Households</span>
          <span style="font-weight: 500;">${householdCount}</span>
        </div>
        ${highRiskCount > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px;">
          <span>High/critical</span>
          <span style="font-weight: 500; color: #ef4444;">${highRiskCount}</span>
        </div>` : ''}
      </div>
    `, { permanent: false, sticky: true, opacity: 0.97 });

    // Click handler
    if (onAreaClick) {
      circle.on('click', () => onAreaClick(area));
    }
  });
}
```

---

## SEED SCRIPT

### File: `scripts/seed.ts`

Run with: `npx tsx scripts/seed.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log('🌱 Seeding Pahad demo data...');

  // 1. Create auth users
  const users = [
    { email: 'chw1@demo.com', password: 'demo1234', full_name: 'Sunita Rai', role: 'chw' },
    { email: 'chw2@demo.com', password: 'demo1234', full_name: 'Bikram Tamang', role: 'chw' },
    { email: 'chw3@demo.com', password: 'demo1234', full_name: 'Maya Gurung', role: 'chw' },
    { email: 'supervisor@demo.com', password: 'demo1234', full_name: 'Dr. Rajesh Shrestha', role: 'supervisor' },
  ];

  const userIds: Record<string, string> = {};

  for (const user of users) {
    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const existingUser = existing?.users?.find(u => u.email === user.email);
    
    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`  ↪ User ${user.email} already exists`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });
      if (error) { console.error(`Failed to create ${user.email}:`, error); continue; }
      userId = data.user!.id;
      console.log(`  ✓ Created user ${user.email}`);
    }
    userIds[user.email] = userId;
  }

  // 2. Create areas (real Nepal ward locations)
  const { data: areas, error: areasErr } = await supabase.from('areas').upsert([
    { name: 'Ward 3, Sindhupalchok', name_ne: 'वडा ३, सिन्धुपाल्चोक', district: 'Sindhupalchok', ward_number: 3, center_lat: 27.9547, center_lng: 85.6895 },
    { name: 'Ward 5, Sindhupalchok', name_ne: 'वडा ५, सिन्धुपाल्चोक', district: 'Sindhupalchok', ward_number: 5, center_lat: 27.8883, center_lng: 85.7117 },
    { name: 'Ward 7, Kavrepalanchok', name_ne: 'वडा ७, काभ्रेपलाञ्चोक', district: 'Kavrepalanchok', ward_number: 7, center_lat: 27.6588, center_lng: 85.5384 },
  ], { onConflict: 'name' }).select();
  if (areasErr) { console.error('Areas error:', areasErr); return; }
  console.log(`  ✓ Created ${areas!.length} areas`);

  // 3. Create profiles
  const profileData = [
    { email: 'chw1@demo.com', full_name: 'Sunita Rai', role: 'chw', area_id: areas![0].id },
    { email: 'chw2@demo.com', full_name: 'Bikram Tamang', role: 'chw', area_id: areas![1].id },
    { email: 'chw3@demo.com', full_name: 'Maya Gurung', role: 'chw', area_id: areas![2].id },
    { email: 'supervisor@demo.com', full_name: 'Dr. Rajesh Shrestha', role: 'supervisor', area_id: null },
  ];

  for (const profile of profileData) {
    const id = userIds[profile.email];
    if (!id) continue;
    await supabase.from('profiles').upsert({ id, ...profile }, { onConflict: 'id' });
  }
  console.log('  ✓ Created profiles');

  // 4. Create households (15 total across 3 areas)
  const households = [
    // Ward 3 — Sunita Rai (chw1)
    { code: 'HH-001', head_name: 'Hari Bahadur Tamang', area_id: areas![0].id, assigned_chw_id: userIds['chw1@demo.com'], latest_risk_score: 12, latest_risk_level: 'low', status: 'active' },
    { code: 'HH-002', head_name: 'Sita Devi Shrestha', area_id: areas![0].id, assigned_chw_id: userIds['chw1@demo.com'], latest_risk_score: 23, latest_risk_level: 'low', status: 'active' },
    { code: 'HH-003', head_name: 'Dhan Kumar Rai', area_id: areas![0].id, assigned_chw_id: userIds['chw1@demo.com'], latest_risk_score: 45, latest_risk_level: 'moderate', status: 'active' },
    { code: 'HH-004', head_name: 'Kamala Basnet', area_id: areas![0].id, assigned_chw_id: userIds['chw1@demo.com'], latest_risk_score: 18, latest_risk_level: 'low', status: 'active' },
    { code: 'HH-005', head_name: 'Bishnu Prasad Poudel', area_id: areas![0].id, assigned_chw_id: userIds['chw1@demo.com'], latest_risk_score: 78, latest_risk_level: 'high', status: 'active', risk_trend: 'worsening' },
    // Ward 5 — Bikram Tamang (chw2)
    { code: 'HH-006', head_name: 'Laxmi Kumari Magar', area_id: areas![1].id, assigned_chw_id: userIds['chw2@demo.com'], latest_risk_score: 8, latest_risk_level: 'low', status: 'active' },
    { code: 'HH-007', head_name: 'Karna Bahadur Thapa', area_id: areas![1].id, assigned_chw_id: userIds['chw2@demo.com'], latest_risk_score: 55, latest_risk_level: 'moderate', status: 'reviewed' },
    { code: 'HH-008', head_name: 'Gita Kumari Karki', area_id: areas![1].id, assigned_chw_id: userIds['chw2@demo.com'], latest_risk_score: 88, latest_risk_level: 'critical', status: 'active', risk_trend: 'worsening' },
    { code: 'HH-009', head_name: 'Mohan Lal Chaudhary', area_id: areas![1].id, assigned_chw_id: userIds['chw2@demo.com'], latest_risk_score: 31, latest_risk_level: 'moderate', status: 'active' },
    { code: 'HH-010', head_name: 'Prabha Kumari Adhikari', area_id: areas![1].id, assigned_chw_id: userIds['chw2@demo.com'], latest_risk_score: 15, latest_risk_level: 'low', status: 'active' },
    // Ward 7 — Maya Gurung (chw3)
    { code: 'HH-011', head_name: 'Raju Tamang', area_id: areas![2].id, assigned_chw_id: userIds['chw3@demo.com'], latest_risk_score: 64, latest_risk_level: 'high', status: 'referred' },
    { code: 'HH-012', head_name: 'Sarita Rai', area_id: areas![2].id, assigned_chw_id: userIds['chw3@demo.com'], latest_risk_score: 27, latest_risk_level: 'low', status: 'active' },
    { code: 'HH-013', head_name: 'Binod Kumar Karki', area_id: areas![2].id, assigned_chw_id: userIds['chw3@demo.com'], latest_risk_score: 42, latest_risk_level: 'moderate', status: 'active' },
    { code: 'HH-014', head_name: 'Nirmala Gurung', area_id: areas![2].id, assigned_chw_id: userIds['chw3@demo.com'], latest_risk_score: 19, latest_risk_level: 'low', status: 'active' },
    { code: 'HH-015', head_name: 'Tika Ram Shrestha', area_id: areas![2].id, assigned_chw_id: userIds['chw3@demo.com'], latest_risk_score: 73, latest_risk_level: 'high', status: 'active', risk_trend: 'improving' },
  ];

  const { data: createdHouseholds, error: hhErr } = await supabase.from('households').upsert(households, { onConflict: 'code' }).select();
  if (hhErr) { console.error('Households error:', hhErr); return; }
  console.log(`  ✓ Created ${createdHouseholds!.length} households`);

  // 5. Create sample visits for each household
  const visitTemplates = [
    // Low risk
    { sleep: 0, appetite: 0, withdrawal: 0, trauma: 0, activities: 0, hopelessness: 0, substance: 0, self_harm: 0 },
    { sleep: 1, appetite: 0, withdrawal: 0, trauma: 0, activities: 0, hopelessness: 0, substance: 0, self_harm: 0 },
    // Moderate
    { sleep: 2, appetite: 1, withdrawal: 1, trauma: 1, activities: 1, hopelessness: 0, substance: 0, self_harm: 0 },
    { sleep: 1, appetite: 2, withdrawal: 2, trauma: 0, activities: 1, hopelessness: 1, substance: 0, self_harm: 0 },
    // High
    { sleep: 2, appetite: 2, withdrawal: 2, trauma: 2, activities: 2, hopelessness: 2, substance: 1, self_harm: 0 },
    { sleep: 3, appetite: 2, withdrawal: 2, trauma: 1, activities: 3, hopelessness: 2, substance: 0, self_harm: 0 },
    // Critical
    { sleep: 3, appetite: 3, withdrawal: 3, trauma: 2, activities: 3, hopelessness: 3, substance: 2, self_harm: 1 },
    { sleep: 2, appetite: 2, withdrawal: 3, trauma: 3, activities: 2, hopelessness: 3, substance: 1, self_harm: 2 },
  ];

  // Risk level mapping
  function scoreToLevel(s: number) {
    if (s <= 30) return 'low';
    if (s <= 60) return 'moderate';
    if (s <= 80) return 'high';
    return 'critical';
  }

  // Use deterministic scoring for seed data
  const MAX = 75; // sum of all max-weighted signals
  function calcScore(r: Record<string, number>): number {
    const weights: Record<string, number> = { sleep: 2, appetite: 2, withdrawal: 3, trauma: 3, activities: 3, hopelessness: 4, substance: 3, self_harm: 5 };
    const sum = Object.entries(r).reduce((acc, [k, v]) => acc + v * (weights[k] || 0), 0);
    return Math.round((sum / MAX) * 100);
  }

  const today = new Date();
  const visitInserts = [];

  for (const hh of createdHouseholds!) {
    const riskScore = hh.latest_risk_score;
    let templateIdx = riskScore <= 25 ? 0 : riskScore <= 40 ? 2 : riskScore <= 65 ? 4 : 6;
    const responses = visitTemplates[templateIdx];
    const score = calcScore(responses);

    // Create 2 visits per household for history
    for (let i = 0; i < 2; i++) {
      const visitDate = new Date(today);
      visitDate.setDate(today.getDate() - (i * 14 + Math.floor(Math.random() * 5)));

      visitInserts.push({
        household_id: hh.id,
        chw_id: hh.assigned_chw_id,
        visit_date: visitDate.toISOString().split('T')[0],
        responses,
        total_score: score,
        risk_level: scoreToLevel(score),
        confidence: 85,
        explanation_en: `During this visit, the household member showed ${riskScore > 60 ? 'significant' : 'mild'} signs of distress. ${riskScore > 70 ? 'Immediate follow-up is recommended.' : 'Regular monitoring should continue.'}`,
        explanation_ne: `यस भ्रमणमा, घरपरिवारका सदस्यले ${riskScore > 60 ? 'महत्वपूर्ण' : 'हल्का'} संकटका संकेतहरू देखाए।`,
        key_signals: riskScore > 60 ? ['Hopelessness', 'Social withdrawal'] : ['Sleep changes'],
        scoring_method: 'fallback',
        notes: i === 0 ? 'Routine monthly visit' : null,
      });
    }
  }

  const { error: visitsErr } = await supabase.from('visits').insert(visitInserts);
  if (visitsErr) { console.error('Visits error:', visitsErr); return; }
  console.log(`  ✓ Created ${visitInserts.length} visits`);

  console.log('\n✅ Seed complete!');
  console.log('\nDemo accounts:');
  console.log('  CHW:        chw1@demo.com / demo1234');
  console.log('  CHW:        chw2@demo.com / demo1234');
  console.log('  CHW:        chw3@demo.com / demo1234');
  console.log('  Supervisor: supervisor@demo.com / demo1234');
}

seed().catch(console.error);
```

---

## KEY UI COMPONENTS

### Risk Badge

```typescript
// components/ui/Badge.tsx
import { RiskLevel } from '@/lib/supabase/types';
import { RISK_CONFIG } from '@/lib/constants';

interface Props {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, score, size = 'md' }: Props) {
  const config = RISK_CONFIG[level];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.color} ${config.textColor} ${config.borderColor} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: config.hex }} />
      {score !== undefined && <span>{score}</span>}
      <span>{config.label_en}</span>
    </span>
  );
}
```

### Trend Sparkline

```typescript
// components/dashboard/TrendSparkline.tsx
'use client';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Visit } from '@/lib/supabase/types';

interface Props {
  visits: Visit[];
}

export function TrendSparkline({ visits }: Props) {
  const data = visits
    .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
    .slice(-6)
    .map(v => ({ score: v.total_score, date: v.visit_date }));

  if (data.length < 2) return <span className="text-xs text-gray-400">—</span>;

  const latest = data[data.length - 1].score;
  const prev = data[data.length - 2].score;
  const isWorsening = latest > prev + 5;
  const isImproving = latest < prev - 5;

  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 64, height: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="score"
              dot={false}
              strokeWidth={1.5}
              stroke={isWorsening ? '#ef4444' : isImproving ? '#10b981' : '#94a3b8'}
            />
            <Tooltip
              contentStyle={{ fontSize: 11, padding: '2px 6px' }}
              formatter={(val) => [`${val}`, 'Score']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className={`text-xs font-medium ${isWorsening ? 'text-red-600' : isImproving ? 'text-emerald-600' : 'text-gray-400'}`}>
        {isWorsening ? '↑' : isImproving ? '↓' : '→'}
      </span>
    </div>
  );
}
```

### Risk Explanation Card

```typescript
// components/visits/RiskExplanation.tsx
import { Visit } from '@/lib/supabase/types';
import { RISK_CONFIG } from '@/lib/constants';

interface Props {
  visit: Visit;
  lang: 'en' | 'ne';
}

export function RiskExplanation({ visit, lang }: Props) {
  const config = RISK_CONFIG[visit.risk_level];
  const explanation = lang === 'ne' ? visit.explanation_ne : visit.explanation_en;

  return (
    <div className={`rounded-xl border-2 p-5 ${config.borderColor} ${config.color}`}>
      {/* Score header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-4xl font-bold" style={{ color: config.hex }}>
              {visit.total_score}
            </span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
          <span className={`text-sm font-semibold uppercase tracking-wide ${config.textColor}`}>
            {config.label_en} Risk
          </span>
        </div>
        {/* Confidence indicator */}
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">
            {visit.scoring_method === 'llm' ? '✦ AI scored' : '⚖ Standard weights'}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${visit.confidence}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{visit.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Key signals */}
      {visit.key_signals && visit.key_signals.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1.5">Key observations:</p>
          <div className="flex flex-wrap gap-1.5">
            {visit.key_signals.map((signal, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color} ${config.textColor} border ${config.borderColor}`}>
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation text */}
      {explanation && (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {explanation}
        </p>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-current border-opacity-20">
        Decision-support only. Does not diagnose mental health conditions.
      </p>
    </div>
  );
}
```

---

## PAGE IMPLEMENTATIONS

### Landing Page (`app/page.tsx`)

Create a compelling landing page with:
- Full-screen hero with the Pahad name (in both English and Nepali: पहाड) and tagline
- A preview screenshot/mockup of the map dashboard
- Three feature cards: "Early Detection", "AI-Powered Scoring", "Bilingual Support"
- WHO mhGAP badge
- Consent disclaimer in a highlighted box
- CTA button → `/login`
- Background: subtle topographic pattern using CSS (SVG data URL pattern of Nepal mountain silhouette)
- Color scheme: deep teal (#0f766e) header, white content, emerald accents

### Login Page (`app/login/page.tsx`)

- Clean centered card, max-width 400px
- Email + password fields with proper autocomplete attributes
- "Sign in with Google" button (using Supabase OAuth)
- Error states with inline messages
- After login: fetch profile, redirect based on role
- Show the consent disclaimer below the form in small gray text

### CHW Home (`app/page.tsx`)

Three stat cards at top:
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  12 Visits   │  │  5 Households│  │  0 Pending   │
│  This Month  │  │  Assigned    │  │  Syncs       │
└──────────────┘  └──────────────┘  └──────────────┘
```
Then a large prominent "Start New Visit" button (full-width on mobile, emerald color).
Then a "Recent Visits" section showing last 5 visits with risk badges and dates.

### New Visit Form (`app/visit/new/page.tsx`)

The form is the CHW's primary workflow. Build it with care:

1. **Household selector** — searchable dropdown showing `code: head_name` for assigned households, with risk badge showing current status
2. **Consent reminder** — small yellow banner at the top
3. **8 signal cards** — each signal gets its own card with:
   - Signal name (bilingual based on current language)
   - 4 radio buttons styled as large tappable pills (0, 1, 2, 3)
   - Color coding: 0=gray, 1=yellow, 2=orange, 3=red
   - When selecting 2 or 3, show a subtle warning glow
4. **Notes textarea** — collapsible, optional
5. **Submit button** — shows "Syncing..." with spinner animation during API call
6. **After submission** — show the RiskExplanation card with score, confidence, key signals, explanation in current language
7. **Action buttons** — "Back to Home" and "View Full Details"

### Supervisor Dashboard (`app/supervisor/page.tsx`)

Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar]                                                   │
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ← Summary cards     │
│  │  47  │ │   5  │ │   3  │ │  38  │                       │
│  │Screen│ │Flaggd│ │ CHWs │ │ Avg  │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                             │
│  ┌─────────────────────────────────┐ ┌────────────────────┐│
│  │         NEPAL RISK MAP          │ │  FLAGGED TABLE     ││
│  │   (Leaflet choropleth heatmap)  │ │  ─────────────     ││
│  │                                 │ │  HH-008 Critical   ││
│  │    🔴 Ward 5 (avg: 61)          │ │  HH-005 High       ││
│  │    🟠 Ward 3 (avg: 43)          │ │  HH-011 High       ││
│  │    🟡 Ward 7 (avg: 52)          │ │  HH-015 High       ││
│  └─────────────────────────────────┘ └────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

The map takes the left 60%, the flagged table takes the right 40%.
On mobile: stacked vertically, map first.

### Supervisor Household Detail (`app/supervisor/household/[id]/page.tsx`)

Show:
1. Household header (code, head name, area, assigned CHW)
2. Current risk badge (large, prominent)
3. Trend sparkline across all visits
4. Status actions: "Mark Reviewed" / "Mark Referred" buttons (with optimistic UI)
5. Full visit history table with expandable rows showing signal breakdown
6. Each signal shown as a horizontal mini bar chart (0-3 scale, colored)

---

## ADDITIONAL FEATURES TO IMPLEMENT

These go beyond the PRD and add hackathon impact:

### 1. Real-Time "Pulse" Indicator
In the supervisor dashboard header, show a live dot:
```
● 2 new flags in the last 24 hours
```
Query `visits` where `created_at > now() - interval '24 hours'` and `risk_level in ('high', 'critical')`.

### 2. Signal Radar Chart on Visit Detail
For supervisor view, render an octagonal radar chart showing all 8 signals for a visit. Use recharts `RadarChart`. This makes it instantly obvious which domains are elevated.

### 3. Area Risk Over Time (Supervisor Only)
A small bar chart (recharts `BarChart`) showing average risk per area for the last 4 weeks. Gives supervisors a trend view beyond current snapshots.

### 4. Animated Score Reveal
When a new visit is scored, animate the score from 0 to the final number over ~1.2 seconds using `requestAnimationFrame`. This makes the result feel meaningful.

### 5. Offline-Mode Toast
Detect `navigator.onLine`. When offline, show a persistent yellow banner: "You're offline — visits will sync when reconnected." Show a `syncing...` spinner badge while the API call is in-flight.

### 6. Share/Export Button (Supervisor)
A "Copy summary" button that copies a plain-text summary of a flagged household to clipboard — useful for sharing on WhatsApp or in a report.

```
Pahad Alert — HH-008
Area: Ward 5, Sindhupalchok
Risk: Critical (88/100)
CHW: Bikram Tamang
Last visit: 2025-03-15
Key signals: Hopelessness, Self-harm indicators
Status: Active — immediate follow-up needed
```

### 7. PWA Manifest
Add `public/manifest.json` for installability:
```json
{
  "name": "Pahad",
  "short_name": "Pahad",
  "description": "Community Mental Health Screening",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f766e",
  "theme_color": "#0f766e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## VISUAL DESIGN SYSTEM

### Color Palette
```
Primary:     #0f766e  (teal-700)    — brand, CTAs, active states
Surface:     #ffffff               — card backgrounds
Background:  #f8fafc               — page background
Text:        #0f172a               — headings
Muted:       #64748b               — secondary text
Border:      #e2e8f0               — card borders

Risk Low:     #10b981  (emerald-500)
Risk Moderate:#f59e0b  (amber-500)
Risk High:    #f97316  (orange-500)
Risk Critical:#ef4444  (red-500)
```

### Typography
- Font: Inter (system fallback: system-ui)
- Headings: 600 weight
- Body: 400 weight, 16px, line-height 1.6
- Labels: 500 weight, 14px

### Spacing
- Page padding: 16px mobile, 24px tablet, 32px desktop
- Card padding: 20px
- Stack gap: 16px
- Tight gap: 8px

### Dark Mode
Full dark mode support via `class="dark"` on `<html>`. Use Tailwind's `dark:` prefix throughout. Default to system preference, toggleable via settings.

### Animation Guidelines
- Transitions: 150ms ease for hover states
- Score reveal: 1200ms ease-out counter animation
- Spinner: standard Tailwind `animate-spin`
- Map markers: 200ms CSS transition on color changes
- Syncing indicator: gentle `animate-pulse`

---

## DEPLOYMENT

### `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install"
}
```

### `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { appDir: true },
  images: {
    domains: ['lh3.googleusercontent.com'],  // Google OAuth avatars
  },
};

module.exports = nextConfig;
```

### `.gitignore` additions
```
.env.local
.env*.local
```

---

## PACKAGE.JSON

```json
{
  "name": "pahad",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "npx tsx scripts/seed.ts"
  },
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "@supabase/supabase-js": "^2.39.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.383.0",
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/node": "^20",
    "@types/react": "^18",
    "autoprefixer": "^10.0.1",
    "dotenv": "^16.4.5",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.7.2",
    "typescript": "^5"
  }
}
```

---

## SETUP INSTRUCTIONS (to include in README)

```markdown
# Pahad — Setup

## Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- Gemini API key (free tier: 60 req/min)

## Steps

1. Clone and install:
   npm install

2. Copy environment file:
   cp .env.example .env.local
   # Fill in your Supabase URL, anon key, service role key, Gemini key

3. Run database migration:
   # In Supabase SQL editor, run: supabase/migrations/001_init.sql

4. Seed demo data:
   npm run seed

5. Start dev server:
   npm run dev

6. Open http://localhost:3000

## Demo Login
- CHW:        chw1@demo.com / demo1234
- Supervisor: supervisor@demo.com / demo1234

## Deploy to Vercel
vercel deploy
# Add env vars in Vercel dashboard
```

---

## CRITICAL IMPLEMENTATION NOTES

1. **Leaflet + Next.js SSR**: Always use `dynamic(() => import('./NepalMap'), { ssr: false })` for the map component. Leaflet accesses `window` and will crash during SSR.

2. **RLS Testing**: After running migrations, test that `chw1@demo.com` cannot query households assigned to `chw2@demo.com`. If they can, RLS is not enabled on the table.

3. **Supabase Auth Callback**: Add `app/auth/callback/route.ts` with the Supabase OAuth callback handler for Google OAuth to work.

4. **Profile Auto-Create**: Add a Supabase database webhook or edge function that creates a `profiles` row on new user signup (or handle it in the OAuth callback route).

5. **Map Performance**: For the demo, hardcode area coordinates. Do NOT attempt to load a full Nepal GeoJSON polygon file — it's too large for a hackathon demo. Use circle markers at `center_lat`/`center_lng` as specified.

6. **Error Boundaries**: Wrap map and score components in React error boundaries so a Leaflet crash or API error doesn't take down the whole page.

7. **Type Safety**: Use the types in `lib/supabase/types.ts` throughout — no `any` on API responses. The LLM returns JSON; always validate the structure before saving.

8. **Consent on Every Form**: The disclaimer must appear at the top of every visit form page, not just the landing page.

9. **Score Animation**: The animated score counter (0 → final) is high-impact and takes 15 minutes to implement. Do it.

10. **Language Persistence**: Store language preference in `localStorage`. Default to `'en'`. Apply it immediately on load to prevent flash.

---

## HACKATHON JUDGING CRITERIA ALIGNMENT

| Criterion | How Pahad addresses it |
|-----------|------------------------|
| **Impact** | Proactive mental health screening in underserved Nepal communities; WHO mhGAP aligned |
| **Technical execution** | Full-stack Next.js + Supabase + LLM + PWA; two API fallbacks; offline detection |
| **Visual design** | Live choropleth map; risk color system; animated score reveals; bilingual UI |
| **Explainability** | AI explains every score in plain language; confidence indicator; key signals displayed |
| **Deployability** | Vercel-ready; environment variables only; seed script for instant demo data |
| **Local relevance** | Nepali language support; real Nepal geographic data; named after a Nepali word (पहाड = mountain) |

---

*End of Codex prompt. Build the complete application as specified.*
```
