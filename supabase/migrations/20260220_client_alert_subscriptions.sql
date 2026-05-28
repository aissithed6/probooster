-- Client alert subscriptions (WhatsApp/email/sms/push) + categories of interest

create table if not exists public.client_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  email text null,
  category_ids uuid[] not null default '{}',
  preferences jsonb not null default jsonb_build_object(
    'whatsapp', true,
    'email', false,
    'sms', false,
    'push', false
  ),
  is_active boolean not null default true,
  source_page text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists client_alert_subscriptions_phone_unique
  on public.client_alert_subscriptions (phone);

create index if not exists client_alert_subscriptions_created_at_idx
  on public.client_alert_subscriptions (created_at desc);

create index if not exists client_alert_subscriptions_is_active_idx
  on public.client_alert_subscriptions (is_active);

create or replace function public.set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_client_alert_subscriptions_set_updated_at on public.client_alert_subscriptions;
create trigger trg_client_alert_subscriptions_set_updated_at
before update on public.client_alert_subscriptions
for each row
execute function public.set_updated_at_timestamp();
