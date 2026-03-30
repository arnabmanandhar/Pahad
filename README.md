# Saveika - Setup

## Prerequisites
- Node.js 18+
- Supabase project
- Gemini API key

## Steps
1. Install dependencies:
   npm install
2. Copy envs:
   copy .env.example .env.local
3. Run the SQL in `supabase/migrations/001_init.sql` inside the Supabase SQL editor.
4. Seed demo data:
   npm run seed
5. Start the app:
   npm run dev
6. Open `http://localhost:3000`

## Demo Login
- CHW: `chw1@demo.com / demo1234`
- Supervisor: `supervisor@demo.com / demo1234`

## Deploy to Vercel
- Import the repo into Vercel
- Add the environment variables from `.env.example`
- Deploy

## Extra Docs\n- Operations guide: `README-OPERATIONS.md`\n\n## Current Stack Notes\n- Next.js: `14.2.35`\n- Supabase auth/session: `@supabase/ssr`
