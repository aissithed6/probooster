-- Extensions utiles (pour gen_random_uuid)
create extension if not exists pgcrypto;

-- =========================================================
-- Table: finance_email_settings (singleton id='singleton')
-- =========================================================
create table if not exists public.finance_email_settings (
  id text primary key,
  "to" text not null default '',
  cc text not null default '',
  bcc text not null default '',
  subject_prefix text not null default '[Paiements]',
  recipient_mode text not null default 'all',
  selected_user_id uuid null,
  group_emails text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_email_settings_recipient_mode_chk
    check (recipient_mode in ('all','user','group','custom'))
);

-- Colonnes de sécurité (si table existait sans toutes les colonnes)
alter table public.finance_email_settings
  add column if not exists "to" text not null default '';
alter table public.finance_email_settings
  add column if not exists cc text not null default '';
alter table public.finance_email_settings
  add column if not exists bcc text not null default '';
alter table public.finance_email_settings
  add column if not exists subject_prefix text not null default '[Paiements]';
alter table public.finance_email_settings
  add column if not exists recipient_mode text not null default 'all';
alter table public.finance_email_settings
  add column if not exists selected_user_id uuid null;
alter table public.finance_email_settings
  add column if not exists group_emails text not null default '';
alter table public.finance_email_settings
  add column if not exists created_at timestamptz not null default now();
alter table public.finance_email_settings
  add column if not exists updated_at timestamptz not null default now();

-- Contrainte CHECK si absente (ignore l’erreur si déjà là)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'finance_email_settings_recipient_mode_chk'
  ) then
    alter table public.finance_email_settings
      add constraint finance_email_settings_recipient_mode_chk
      check (recipient_mode in ('all','user','group','custom'));
  end if;
end$$;

-- Insérer le singleton si absent
insert into public.finance_email_settings (id)
values ('singleton')
on conflict (id) do nothing;

-- =========================================================
-- Table: user_segments
-- =========================================================
create table if not exists public.user_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emails text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colonnes de sécurité (si table existait sans toutes les colonnes)
alter table public.user_segments
  add column if not exists name text not null default 'Segment';
alter table public.user_segments
  add column if not exists emails text[] not null default '{}';
alter table public.user_segments
  add column if not exists created_at timestamptz not null default now();
alter table public.user_segments
  add column if not exists updated_at timestamptz not null default now();

-- Index utilitaire
create index if not exists idx_user_segments_name on public.user_segments (name);
