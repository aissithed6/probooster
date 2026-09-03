-- MIGRATION : 20260903000000_create_support_videos.sql
--
-- Rôle : table de persistance des vidéos YouTube tutoriels du Centre de
-- Ressources de la page /support. Gérée par le Super Admin (CRUD) et lue par
-- l'API publique /api/support/videos pour le modal "Vidéos Tutoriels".
--
-- Colonnes / RLS / Realtime / trigger updated_at.
-- Idempotent : peut être ré-exécuté sans risque.

create table if not exists public.support_videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text default '',
  youtube_url   text not null,
  youtube_id    text not null,
  category      text default 'general',
  duration      text default '',
  is_active     boolean not null default true,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists support_videos_category_idx on public.support_videos (category);
create index if not exists support_videos_active_idx   on public.support_videos (is_active);

-- Trigger de mise à jour de updated_at
create or replace function public.set_support_videos_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_support_videos_updated_at on public.support_videos;
create trigger trg_support_videos_updated_at
  before update on public.support_videos
  for each row execute function public.set_support_videos_updated_at();

-- RLS
alter table public.support_videos enable row level security;

-- Lecture publique des vidéos actives (modal /support et API publique)
drop policy if exists "support_videos_public_read" on public.support_videos;
create policy "support_videos_public_read"
  on public.support_videos for select
  using (is_active = true);

-- Administration (service role contourne la RLS ; pour les rôle applicatifs admin)
drop policy if exists "support_videos_admin_all" on public.support_videos;
create policy "support_videos_admin_all"
  on public.support_videos for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  );

-- Realtime pour que les vidéos mises à jour côté admin apparaissent dans le
-- modal /support sans rechargement (si le modal s'y abonne).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_videos'
  ) then
    alter publication supabase_realtime add table public.support_videos;
  end if;
end $$;