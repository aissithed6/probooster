-- Statistiques globales pour le calendrier des événements (valeurs agrégées / KPI)

create table if not exists public.site_event_stats (
  id smallint primary key default 1,
  people_registered bigint not null default 0,
  satisfaction_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_event_stats_singleton check (id = 1)
);

-- Singleton row
insert into public.site_event_stats (id)
values (1)
on conflict (id) do nothing;

create index if not exists site_event_stats_updated_at_idx on public.site_event_stats (updated_at);

alter table public.site_event_stats enable row level security;

-- Lecture publique autorisée (site + dashboard)
drop policy if exists "site_event_stats_select_public" on public.site_event_stats;
create policy "site_event_stats_select_public"
on public.site_event_stats
for select
using (true);

-- Écriture réservée (routes serveur service_role) ou super_admin
-- Helper: is_super_admin_uid déjà défini dans d'autres migrations

drop policy if exists "site_event_stats_write_service_or_super_admin" on public.site_event_stats;
create policy "site_event_stats_write_service_or_super_admin"
on public.site_event_stats
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
    where tgname = 'set_site_event_stats_updated_at'
  ) then
    create trigger set_site_event_stats_updated_at
    before update on public.site_event_stats
    for each row
    execute procedure moddatetime(updated_at);
  end if;
exception
  when undefined_function then
    null;
end
$$;
