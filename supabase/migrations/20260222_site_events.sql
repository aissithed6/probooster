-- Site events: calendrier marketing (Black Friday, lancements, collections, etc.)

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  event_date date not null,
  event_time text null,
  category_key text not null,
  category_label text null,
  category_icon text null,
  discount text null,
  status text not null default 'upcoming' check (status in ('upcoming', 'announced', 'completed', 'cancelled')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_events_event_date_idx on public.site_events (event_date);
create index if not exists site_events_is_active_idx on public.site_events (is_active);
create index if not exists site_events_status_idx on public.site_events (status);

alter table public.site_events enable row level security;

-- Lecture publique autorisée (site + dashboard)
drop policy if exists "site_events_select_public" on public.site_events;
create policy "site_events_select_public"
on public.site_events
for select
using (true);

-- Écriture réservée (routes serveur service_role) ou super_admin
-- Helper: super admin (déjà présent dans d'autres migrations)
create or replace function public.is_super_admin_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.users u
    where u.id = p_uid
      and lower(coalesce(u.role, '')) = 'super_admin'
  );
$$;

drop policy if exists "site_events_write_service_or_super_admin" on public.site_events;
create policy "site_events_write_service_or_super_admin"
on public.site_events
for all
using (
  auth.role() = 'service_role'
  or public.is_super_admin_uid(auth.uid())
)
with check (
  auth.role() = 'service_role'
  or public.is_super_admin_uid(auth.uid())
);

-- updated_at auto
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_site_events_updated_at'
  ) then
    create trigger set_site_events_updated_at
    before update on public.site_events
    for each row
    execute procedure moddatetime(updated_at);
  end if;
exception
  when undefined_function then
    -- si l'extension/moddatetime n'est pas dispo, on laisse l'updated_at géré côté API
    null;
end
$$;
