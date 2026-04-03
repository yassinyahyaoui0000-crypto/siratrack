# SiraTrack

SiraTrack is a private, single-user discipline dashboard built for strict daily accountability. It tracks deep work, coding, project effort, learning, workouts, prayers, focus sessions, streaks, weekly commitments, recovery plans, and a 30-day accountability board without social features or soft gamification.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Supabase Auth + Postgres
- Recharts
- Vitest

## Project Structure

```text
src/
  app/
    (app)/
      page.tsx
      projects/page.tsx
      settings/page.tsx
    (auth)/
      auth/login/page.tsx
      auth/signup/page.tsx
    api/
      accountability-history/route.ts
      auth/register-owner/route.ts
      check-in/route.ts
      recovery-plan/route.ts
      recovery-plan/[id]/route.ts
      settings/route.ts
      weekly-commitment/route.ts
      weekly-scoreboard/route.ts
      projects/route.ts
      projects/[id]/route.ts
      focus-sessions/route.ts
      export/daily-logs/route.ts
      export/projects/route.ts
  components/
    auth/
    dashboard/
    projects/
    settings/
  lib/
    constants.ts
    csv.ts
    data/
    date.ts
    env.ts
    feedback.ts
    http.ts
    scoring.ts
    supabase/
    types.ts
    validation.ts
supabase/
  schema.sql
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. If you already deployed an older version, re-run the schema so the new
   `weekly_commitments` and `recovery_plans` tables exist.

### 3. Enable email/password auth

1. In Supabase, open `Authentication -> Providers -> Email`.
2. Enable email/password sign-in.
3. Magic links are not required for this app.

### 4. Create local environment variables

1. Copy `.env.example` to `.env.local`.
2. Fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# or
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# or
SUPABASE_SECRET_KEY=sb_secret_xxx
# or
SUPABASE_SECRET_API_KEY=sb_secret_xxx
OWNER_EMAIL=you@example.com
APP_TIMEZONE=Africa/Lagos
```

Notes:

- `OWNER_EMAIL` is the only email allowed to create the account.
- A server-only elevated Supabase key is required because owner signup is locked server-side.
- The app accepts either the legacy `SUPABASE_SERVICE_ROLE_KEY` or a modern `SUPABASE_SECRET_KEY` / `SUPABASE_SECRET_API_KEY`.
- `APP_TIMEZONE` controls what counts as "today", streak boundaries, and the current week.

### 5. Run the app locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### 6. Create the owner account

1. Visit `http://localhost:3000/auth/signup`
2. Use the exact same email you set in `OWNER_EMAIL`
3. Create the account once
4. After that, use `http://localhost:3000/auth/login`

The signup route will reject:

- any email that does not match `OWNER_EMAIL`
- any attempt after the first owner account already exists

## How the app behaves

- Only today can be edited.
- Missed days cannot be backfilled.
- Full streak requires meeting all configured standards.
- Partial streak requires a score of at least 60.
- Weekly stats are calculated from the current week.
- Weekly commitments pace the current Monday-Sunday week and mark it on or off track.
- Saved misses can require a recovery response before the app lets them fade into the past.
- The 30-day accountability board keeps missed days and weak patterns visible in read-only history.
- Settings updates recalculate saved daily scores so analytics stay consistent.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run test
```

## Deployment Guide

### Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables from `.env.local` to the Vercel project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` or `SUPABASE_SECRET_API_KEY`
   - `OWNER_EMAIL`
   - `APP_TIMEZONE`
4. Deploy.

### Supabase production checks

Before using the deployed app:

1. Confirm the SQL schema is applied in production.
2. Keep email/password auth enabled.
3. Set your production site URL in `Authentication -> URL Configuration`.
4. Add your Vercel production domain to the allowed redirect URLs list.

## Testing Notes

The automated tests cover:

- score calculation
- feedback tone selection
- streak behavior
- weekly commitment pacing
- recovery trigger and resolution rules
- 30-day accountability summaries
- owner signup restrictions
- protected check-in route behavior
- CSV export headers

Manual checks still recommended:

- full signup and login flow against a real Supabase project
- dashboard save/update flow
- focus timer session increment
- project create/update flow
- weekly commitment save/update flow
- recovery plan create/update flow
- 30-day accountability board review
- settings save and score recalculation
