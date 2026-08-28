-- ============================================================
-- Migration : tables de sécurité vendeur manquantes
-- user_sessions, user_security_settings, activity_logs
-- Idempotente : ré-exécutable sans risque.
-- ============================================================

-- 1. Sessions utilisateurs
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_token text,
  device_info text,
  ip_address text,
  user_agent text,
  is_active boolean not null default true,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_user_id on public.user_sessions (user_id);
create index if not exists idx_user_sessions_active on public.user_sessions (user_id, is_active);

-- 2. Paramètres de sécurité (source partagée vendeur / super admin)
create table if not exists public.user_security_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  two_factor_enabled boolean not null default false,
  login_notifications boolean not null default true,
  session_timeout integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_security_settings_user_id on public.user_security_settings (user_id);

-- 3. Journal d'activité
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_user_id on public.activity_logs (user_id);
create index if not exists idx_activity_logs_action on public.activity_logs (action);

-- 4. RLS : chaque utilisateur ne voit que ses propres lignes ;
--    le service_role (APIs Next.js) contourne RLS par conception.
alter table public.user_sessions enable row level security;
alter table public.user_security_settings enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "user_sessions_own" on public.user_sessions;
create policy "user_sessions_own" on public.user_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_security_settings_own" on public.user_security_settings;
create policy "user_security_settings_own" on public.user_security_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "activity_logs_own" on public.activity_logs;
create policy "activity_logs_own" on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Synchronisation : à l'insertion d'un profil, préparer ses réglages de sécurité
create or replace function public.ensure_user_security_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_security_settings (user_id)
  values (new.user_id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_user_security_settings on public.user_profiles;
create trigger trg_ensure_user_security_settings
  after insert on public.user_profiles
  for each row execute function public.ensure_user_security_settings();
