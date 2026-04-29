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
    check (role in ('admin', 'paid', 'member', 'viewer')),
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

create table if not exists public.social_leads (
  id text primary key,
  platform text not null check (platform in ('meta', 'instagram', 'tiktok')),
  campaign_id text,
  lead_data jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists social_leads_platform_idx
on public.social_leads(platform);

create index if not exists social_leads_campaign_idx
on public.social_leads(campaign_id);

create index if not exists social_leads_received_at_idx
on public.social_leads(received_at desc);

-- =========================================================
-- WORKERS / NCS
-- =========================================================
create table if not exists public.ncs_workers (
  id uuid primary key default gen_random_uuid(),
  worker_key text not null unique,
  name text not null,
  status text not null default 'idle',
  status_message text,
  is_paused boolean not null default false,
  paused_at timestamptz,
  error_message text,
  job_id text,
  job_name text,
  job_type text,
  queue_name text,
  progress_pct numeric(5,2),
  current_job jsonb,
  last_heartbeat_at timestamptz,
  last_started_at timestamptz,
  last_finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ncs_workers_status_idx on public.ncs_workers(status);
create index if not exists ncs_workers_paused_idx on public.ncs_workers(is_paused);

drop trigger if exists ncs_workers_set_updated_at on public.ncs_workers;
create trigger ncs_workers_set_updated_at
before update on public.ncs_workers
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

create table if not exists public.exchange_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange_id text not null
    check (exchange_id in ('binance', 'coinbase', 'kraken', 'kucoin', 'okx')),
  api_key_ciphertext text not null,
  api_key_iv text not null,
  secret_ciphertext text not null,
  secret_iv text not null,
  encryption_algorithm text not null default 'AES-GCM',
  key_version text not null default 'v1',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.exchange_keys is
  'Encrypted per-user trading exchange credentials. Never store plaintext API keys or secrets here.';
comment on column public.exchange_keys.api_key_ciphertext is
  'Base64 encoded ciphertext produced by the trading key storage worker.';
comment on column public.exchange_keys.secret_ciphertext is
  'Base64 encoded ciphertext produced by the trading key storage worker.';

create unique index if not exists exchange_keys_user_exchange_uidx
on public.exchange_keys(user_id, exchange_id);

create index if not exists exchange_keys_user_updated_at_idx
on public.exchange_keys(user_id, updated_at desc);

drop trigger if exists exchange_keys_set_updated_at on public.exchange_keys;
create trigger exchange_keys_set_updated_at
before update on public.exchange_keys
for each row
execute procedure public.set_updated_at();

alter table public.exchange_keys enable row level security;

drop policy if exists "Users can read their own encrypted exchange keys" on public.exchange_keys;
create policy "Users can read their own encrypted exchange keys"
on public.exchange_keys
for select
using (auth.uid() = user_id);

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
-- CHAT
-- Conversation persistence for Nick chat
-- =========================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute procedure public.set_updated_at();

create index if not exists conversations_user_updated_at_idx
on public.conversations(user_id, updated_at desc);

alter table public.conversations enable row level security;

drop policy if exists "Users can read own conversations" on public.conversations;
create policy "Users can read own conversations"
on public.conversations
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own conversations" on public.conversations;
create policy "Users can insert own conversations"
on public.conversations
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own conversations" on public.conversations;
create policy "Users can update own conversations"
on public.conversations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_messages_conversation_created_at_idx
on public.chat_messages(conversation_id, created_at asc);

create index if not exists chat_messages_user_created_at_idx
on public.chat_messages(user_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Users can read own chat messages" on public.chat_messages;
create policy "Users can read own chat messages"
on public.chat_messages
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat messages" on public.chat_messages;
create policy "Users can insert own chat messages"
on public.chat_messages
for insert
with check (auth.uid() = user_id);

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
