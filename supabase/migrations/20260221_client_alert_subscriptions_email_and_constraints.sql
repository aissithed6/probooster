-- Adapt client_alert_subscriptions: allow email-only subscriptions + uniqueness on email + integrity constraints

alter table public.client_alert_subscriptions
  alter column phone drop not null;

create unique index if not exists client_alert_subscriptions_email_unique
  on public.client_alert_subscriptions (email)
  where email is not null;

alter table public.client_alert_subscriptions
  drop constraint if exists client_alert_subscriptions_contact_required;

alter table public.client_alert_subscriptions
  add constraint client_alert_subscriptions_contact_required
  check (
    (phone is not null and length(trim(phone)) > 0)
    or (email is not null and length(trim(email)) > 0)
  );
