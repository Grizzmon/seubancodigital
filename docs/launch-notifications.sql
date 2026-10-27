-- Run after the Supabase project is restored. Separate from account subscriptions:
-- launch visitors do not need an account, a phone number, or a name.
create table if not exists public.launch_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
alter table public.launch_subscriptions enable row level security;
revoke all on public.launch_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.launch_subscriptions to service_role;
create index if not exists launch_subscriptions_pending_idx
  on public.launch_subscriptions (created_at) where notified_at is null;
