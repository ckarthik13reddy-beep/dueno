create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists pgcrypto;

-- Holds only a SHA-256 hash of the scheduler token. Reachable by server code only.
create table public.cron_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_at timestamptz not null default now()
);
grant all on public.cron_tokens to service_role;
alter table public.cron_tokens enable row level security;
-- No policies: anon/authenticated have no grants and no access.