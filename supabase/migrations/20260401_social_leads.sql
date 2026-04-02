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
