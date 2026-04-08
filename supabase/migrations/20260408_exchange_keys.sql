-- Encrypted trading exchange key storage.
-- The worker encrypts API credentials before inserting rows. The table stores only
-- ciphertext and IV metadata, keyed by the Supabase auth user and exchange id.

create extension if not exists pgcrypto;

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

create or replace function public.set_exchange_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists exchange_keys_set_updated_at on public.exchange_keys;
create trigger exchange_keys_set_updated_at
before update on public.exchange_keys
for each row
execute procedure public.set_exchange_keys_updated_at();

alter table public.exchange_keys enable row level security;

drop policy if exists "Users can read their own encrypted exchange keys" on public.exchange_keys;
create policy "Users can read their own encrypted exchange keys"
on public.exchange_keys
for select
using (auth.uid() = user_id);

-- Do not add user-facing insert/update/delete policies. Writes must go through
-- the server-side worker so credentials are encrypted before they reach Supabase.
