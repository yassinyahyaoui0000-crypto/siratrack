create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  deep_work_target_hours numeric(4,1) not null default 4 check (deep_work_target_hours >= 0.5),
  coding_target_problems integer not null default 3 check (coding_target_problems >= 0),
  learning_target_minutes integer not null default 60 check (learning_target_minutes >= 0),
  require_project_work boolean not null default true,
  require_workout boolean not null default true,
  require_all_prayers boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  deep_work_hours numeric(4,1) not null default 0 check (deep_work_hours >= 0),
  coding_problems_solved integer not null default 0 check (coding_problems_solved >= 0),
  project_work_done boolean not null default false,
  project_notes text,
  learning_minutes integer not null default 0 check (learning_minutes >= 0),
  workout_done boolean not null default false,
  fajr_done boolean not null default false,
  dhuhr_done boolean not null default false,
  asr_done boolean not null default false,
  maghrib_done boolean not null default false,
  isha_done boolean not null default false,
  focus_sessions_completed integer not null default 0 check (focus_sessions_completed >= 0),
  reflection varchar(200),
  miss_reason varchar(20) check (miss_reason in ('planning', 'distraction', 'fatigue', 'avoidance', 'overcommitment', 'other')),
  miss_note varchar(200),
  daily_score integer not null default 0 check (daily_score between 0 and 100),
  day_rating varchar(8) not null default 'BAD' check (day_rating in ('GOOD', 'AVERAGE', 'BAD')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, log_date)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(80) not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weekly_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  deep_work_hours_goal numeric(5,1) not null default 0 check (deep_work_hours_goal >= 0),
  coding_problems_goal integer not null default 0 check (coding_problems_goal >= 0),
  learning_minutes_goal integer not null default 0 check (learning_minutes_goal >= 0),
  workout_days_goal integer not null default 0 check (workout_days_goal between 0 and 7),
  full_prayer_days_goal integer not null default 0 check (full_prayer_days_goal between 0 and 7),
  primary_project_id uuid references public.projects(id) on delete set null,
  commitment_note varchar(200),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, week_start)
);

create table if not exists public.recovery_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_date date not null,
  target_date date not null,
  miss_reason varchar(20) not null check (miss_reason in ('planning', 'distraction', 'fatigue', 'avoidance', 'overcommitment', 'other')),
  corrective_action varchar(200) not null,
  status varchar(12) not null default 'open' check (status in ('open', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, trigger_date)
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_daily_logs_updated_at on public.daily_logs;
create trigger set_daily_logs_updated_at
before update on public.daily_logs
for each row
execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_weekly_commitments_updated_at on public.weekly_commitments;
create trigger set_weekly_commitments_updated_at
before update on public.weekly_commitments
for each row
execute function public.set_updated_at();

drop trigger if exists set_recovery_plans_updated_at on public.recovery_plans;
create trigger set_recovery_plans_updated_at
before update on public.recovery_plans
for each row
execute function public.set_updated_at();

alter table public.app_settings enable row level security;
alter table public.daily_logs enable row level security;
alter table public.projects enable row level security;
alter table public.weekly_commitments enable row level security;
alter table public.recovery_plans enable row level security;

drop policy if exists "Users can read own settings" on public.app_settings;
create policy "Users can read own settings"
on public.app_settings
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.app_settings;
create policy "Users can insert own settings"
on public.app_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.app_settings;
create policy "Users can update own settings"
on public.app_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own daily logs" on public.daily_logs;
create policy "Users can read own daily logs"
on public.daily_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily logs" on public.daily_logs;
create policy "Users can insert own daily logs"
on public.daily_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily logs" on public.daily_logs;
create policy "Users can update own daily logs"
on public.daily_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own daily logs" on public.daily_logs;
create policy "Users can delete own daily logs"
on public.daily_logs
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own projects" on public.projects;
create policy "Users can read own projects"
on public.projects
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
on public.projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
on public.projects
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own weekly commitments" on public.weekly_commitments;
create policy "Users can read own weekly commitments"
on public.weekly_commitments
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own weekly commitments" on public.weekly_commitments;
create policy "Users can insert own weekly commitments"
on public.weekly_commitments
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own weekly commitments" on public.weekly_commitments;
create policy "Users can update own weekly commitments"
on public.weekly_commitments
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own weekly commitments" on public.weekly_commitments;
create policy "Users can delete own weekly commitments"
on public.weekly_commitments
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own recovery plans" on public.recovery_plans;
create policy "Users can read own recovery plans"
on public.recovery_plans
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own recovery plans" on public.recovery_plans;
create policy "Users can insert own recovery plans"
on public.recovery_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own recovery plans" on public.recovery_plans;
create policy "Users can update own recovery plans"
on public.recovery_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own recovery plans" on public.recovery_plans;
create policy "Users can delete own recovery plans"
on public.recovery_plans
for delete
using (auth.uid() = user_id);
