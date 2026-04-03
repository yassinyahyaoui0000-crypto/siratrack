# SiraTrack

SiraTrack is a private, single-user discipline dashboard built for strict daily accountability. It tracks deep work, coding, project effort, learning, workouts, prayers, focus sessions, streaks, and weekly scoring without social features or soft gamification.

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
      auth/register-owner/route.ts
      check-in/route.ts
      settings/route.ts
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
OWNER_EMAIL=you@example.com
APP_TIMEZONE=Africa/Lagos
```

Notes:

- `OWNER_EMAIL` is the only email allowed to create the account.
- `SUPABASE_SERVICE_ROLE_KEY` is required because owner signup is locked server-side.
- `APP_TIMEZONE` controls what counts as “today”, streak boundaries, and the current week.

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
   - `SUPABASE_SERVICE_ROLE_KEY`
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
- owner signup restrictions
- protected check-in route behavior
- CSV export headers

Manual checks still recommended:

- full signup and login flow against a real Supabase project
- dashboard save/update flow
- focus timer session increment
- project create/update flow
- settings save and score recalculation
