/**
 * Journal d'audit des exports/rapports marketing par email.
 * Persiste l'envoi (ou la demande d'export) afin d'assurer la traçabilité.
 */
create table if not exists public.marketing_email_logs (
  id uuid primary key default gen_random_uuid(),
  report_period text not null,
  recipients text[] not null,
  report_payload jsonb not null default '{}',
  send_status text not null default 'logged' check (send_status in ('logged','logged_no_provider','logged_failed_email','sent','sent_failed','logged_failed')),
  error_message text,
  triggered_by_admin boolean not null default true,
  triggered_at timestamp with time zone not null default (now()),
  created_at timestamp with time zone not null default (now())
);

alter table public.marketing_email_logs enable row level security;
create policy "Super admins peuvent lire l'historique des exports marketing"
  on public.marketing_email_logs for all to authenticated
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
      and (u.raw_user_meta_data->>'role')::text = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
      and (u.raw_user_meta_data->>'role')::text = 'super_admin'
    )
  );

create index if not exists idx_marketing_email_logs_period on public.marketing_email_logs (report_period);
create index if not exists idx_marketing_email_logs_triggered_at on public.marketing_email_logs (triggered_at desc);
