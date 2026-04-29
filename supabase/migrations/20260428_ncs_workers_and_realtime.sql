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

do $$
begin
  if to_regclass('public.workers') is not null then
    insert into public.ncs_workers (
      id,
      worker_key,
      name,
      status,
      status_message,
      is_paused,
      paused_at,
      current_job,
      last_started_at,
      last_finished_at,
      created_at,
      updated_at
    )
    select
      workers.id,
      regexp_replace(lower(coalesce(workers.name, 'worker')), '[^a-z0-9]+', '-', 'g') as worker_key,
      coalesce(workers.name, 'Unnamed worker') as name,
      case
        when lower(coalesce(workers.status, '')) in ('running', 'processing', 'working') then 'busy'
        when lower(coalesce(workers.status, '')) in ('error', 'failed', 'offline') then 'error'
        when lower(coalesce(workers.status, '')) = 'paused' then 'paused'
        else 'idle'
      end as status,
      workers.description as status_message,
      false as is_paused,
      null::timestamptz as paused_at,
      case
        when workers.metrics is null or workers.metrics = '{}'::jsonb then null
        else jsonb_build_object('details', workers.metrics)
      end as current_job,
      workers.last_run as last_started_at,
      workers.last_run as last_finished_at,
      coalesce(workers.created_at, timezone('utc', now())) as created_at,
      coalesce(workers.updated_at, timezone('utc', now())) as updated_at
    from public.workers as workers
    on conflict (id) do update
    set
      worker_key = excluded.worker_key,
      name = excluded.name,
      status = excluded.status,
      status_message = excluded.status_message,
      current_job = excluded.current_job,
      last_started_at = excluded.last_started_at,
      last_finished_at = excluded.last_finished_at,
      updated_at = excluded.updated_at;
  end if;

  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'social_leads'
  ) then
    execute 'alter publication supabase_realtime add table public.social_leads';
  end if;
end
$$;
