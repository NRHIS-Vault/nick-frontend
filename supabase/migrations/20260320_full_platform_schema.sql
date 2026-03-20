create extension if not exists pgcrypto;

-- =========================================================
-- Shared helper
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- =========================================================
-- AUTH / BILLING
-- Required for nick-frontend auth, roles, and paywall
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('admin', 'member', 'viewer')),
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'trialing', 'past_due', 'canceled')),
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, subscription_status)
  values (new.id, 'member', 'inactive')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute procedure public.handle_new_user_profile();

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =========================================================
-- SITE FORMS
-- Used by nick-site Cloudflare functions
-- =========================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null check (char_length(message) <= 5000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists messages_created_at_idx
on public.messages(created_at desc);

alter table public.messages enable row level security;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists newsletter_subscribers_email_lower_uidx
on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_created_at_idx
on public.newsletter_subscribers(created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- =========================================================
-- BUSINESSES / DASHBOARD
-- Starter schema for mock dashboard data
-- =========================================================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  description text,
  image_url text,
  status text not null check (status in ('Active', 'Growing', 'Paused')),
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row
execute procedure public.set_updated_at();

create table if not exists public.dashboard_stats (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  label text not null,
  value_numeric numeric(14,2) not null default 0,
  unit text not null check (unit in ('usd', 'count')),
  change_pct numeric(8,2) not null default 0,
  stat_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists dashboard_stats_business_date_idx
on public.dashboard_stats(business_id, stat_date desc);

-- =========================================================
-- LEADS
-- Shared for dashboard, lead management, and leadbot
-- =========================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  name text not null,
  email text,
  phone text,
  service text,
  source text,
  location text,
  value numeric(14,2) not null default 0,
  status text not null,
  notes text,
  is_leadbot_generated boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists leads_business_idx on public.leads(business_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

-- =========================================================
-- WORKERS / NCS
-- =========================================================
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('automation', 'monitoring', 'processing')),
  status text not null check (status in ('running', 'stopped', 'error', 'idle')),
  description text not null,
  last_run timestamptz,
  next_run timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists workers_set_updated_at on public.workers;
create trigger workers_set_updated_at
before update on public.workers
for each row
execute procedure public.set_updated_at();

-- =========================================================
-- LEADBOT
-- =========================================================
create table if not exists public.leadbot_campaigns (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  content text not null,
  reach integer not null default 0,
  leads_count integer not null default 0,
  engagement numeric(8,2) not null default 0,
  status text not null check (status in ('ACTIVE', 'SCHEDULED', 'COMPLETED')),
  scheduled_time timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.leadbot_platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null check (status in ('connected', 'pending')),
  posts integer not null default 0,
  leads_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- =========================================================
-- TRADINGBOT
-- =========================================================
create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  platform_name text not null unique,
  status text not null check (status in ('connected', 'disconnected')),
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  pair text not null,
  type text not null check (type in ('BUY', 'SELL')),
  amount numeric(18,8) not null,
  price numeric(18,8) not null,
  profit numeric(18,8) not null default 0,
  status text not null check (status in ('OPEN', 'CLOSED', 'PENDING')),
  executed_at timestamptz not null default timezone('utc', now())
);

create index if not exists trades_status_idx on public.trades(status);
create index if not exists trades_executed_at_idx on public.trades(executed_at desc);

create table if not exists public.trading_signals (
  id uuid primary key default gen_random_uuid(),
  pair text not null,
  direction text not null check (direction in ('UP', 'DOWN')),
  strength integer not null,
  confidence integer not null,
  timeframe text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- =========================================================
-- CUSTOMER PORTAL
-- =========================================================
create table if not exists public.service_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(12,2) not null,
  period text not null check (period in ('monthly', 'yearly')),
  features text[] not null default array[]::text[],
  popular boolean not null default false,
  roi text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists service_plans_set_updated_at on public.service_plans;
create trigger service_plans_set_updated_at
before update on public.service_plans
for each row
execute procedure public.set_updated_at();

create table if not exists public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  service_plan_id uuid references public.service_plans(id) on delete set null,
  subscriber_name text not null,
  subscriber_email text not null,
  revenue numeric(12,2) not null default 0,
  status text not null check (status in ('active', 'paused', 'cancelled')),
  joined_at date not null default current_date,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_subscriptions_status_idx
on public.customer_subscriptions(status);

create index if not exists customer_subscriptions_plan_idx
on public.customer_subscriptions(service_plan_id);

-- =========================================================
-- RHNIS
-- =========================================================
create table if not exists public.rhnis_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  beacon_signature text not null unique,
  legacy_stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists rhnis_profiles_set_updated_at on public.rhnis_profiles;
create trigger rhnis_profiles_set_updated_at
before update on public.rhnis_profiles
for each row
execute procedure public.set_updated_at();

create table if not exists public.rhnis_identity_features (
  id uuid primary key default gen_random_uuid(),
  rhnis_profile_id uuid not null references public.rhnis_profiles(id) on delete cascade,
  icon text not null check (icon in ('fingerprint', 'eye', 'radio', 'shield')),
  title text not null,
  status text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rhnis_beacon_data (
  id uuid primary key default gen_random_uuid(),
  rhnis_profile_id uuid not null references public.rhnis_profiles(id) on delete cascade,
  beacon_type text not null,
  count integer not null default 0,
  status text not null,
  created_at timestamptz not null default timezone('utc', now())
);
