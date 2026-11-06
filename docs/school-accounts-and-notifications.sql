create table if not exists public.school_accounts (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  name text not null,
  bankpix_user_id uuid references public.bankpix_users(id),
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.school_accounts enable row level security;
revoke all on public.school_accounts from anon, authenticated;
grant select, insert, update, delete on public.school_accounts to service_role;

create table if not exists public.school_notification_devices (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_id uuid references public.bankpix_users(id),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  abandonment_due_at timestamptz,
  abandonment_sent_at timestamptz,
  welcome_due_at timestamptz,
  welcome_sent_at timestamptz,
  followup_due_at timestamptz,
  followup_sent_at timestamptz,
  claim_token uuid,
  claimed_until timestamptz,
  disabled_at timestamptz
);
alter table public.school_notification_devices enable row level security;
revoke all on public.school_notification_devices from anon, authenticated;
grant select, insert, update, delete on public.school_notification_devices to service_role;
create index if not exists school_devices_pending_idx on public.school_notification_devices(last_seen_at) where disabled_at is null;

-- Atomic, server-only throttle for sign-in and account creation.
create table if not exists public.school_auth_limits (
  bucket text primary key,
  attempts integer not null,
  resets_at timestamptz not null
);
alter table public.school_auth_limits enable row level security;
revoke all on public.school_auth_limits from anon, authenticated;
grant select, insert, update, delete on public.school_auth_limits to service_role;
create or replace function public.school_auth_allow(p_bucket text, p_limit integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  insert into public.school_auth_limits(bucket, attempts, resets_at)
  values (p_bucket, 1, now() + interval '15 minutes')
  on conflict (bucket) do update set
    attempts = case when school_auth_limits.resets_at < now() then 1 else school_auth_limits.attempts + 1 end,
    resets_at = case when school_auth_limits.resets_at < now() then now() + interval '15 minutes' else school_auth_limits.resets_at end
  returning attempts into n;
  return n <= p_limit;
end;
$$;
revoke all on function public.school_auth_allow(text, integer) from public, anon, authenticated;
grant execute on function public.school_auth_allow(text, integer) to service_role;
