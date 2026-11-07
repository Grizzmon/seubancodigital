alter table public.school_notification_devices
  add column if not exists day1_due_at timestamptz,
  add column if not exists day1_sent_at timestamptz,
  add column if not exists day1followup_due_at timestamptz,
  add column if not exists day1followup_sent_at timestamptz;

-- Existing opted-in account devices start tomorrow; never send a historical backlog.
update public.school_notification_devices d
set day1_due_at = greatest(a.created_at, now()) + interval '24 hours',
    day1followup_due_at = greatest(a.created_at, now()) + interval '28 hours'
from public.school_accounts a
where d.user_id = a.bankpix_user_id and d.disabled_at is null
  and d.day1_due_at is null and d.day1_sent_at is null
  and d.day1followup_due_at is null and d.day1followup_sent_at is null;
