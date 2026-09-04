-- =============================================================
-- Candidatures "Devenir Vendeur" (formulaire public /become-seller)
-- Autonome et idempotente : peut être relancée sans risque.
-- =============================================================

create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  application_number text unique,
  business_name text not null,
  owner_name text not null,
  email text not null,
  phone text not null,
  category text,
  experience text,
  monthly_revenue text,
  description text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  user_id uuid references auth.users(id),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index utiles
create index if not exists seller_applications_status_idx on public.seller_applications (status);
create index if not exists seller_applications_submitted_idx on public.seller_applications (submitted_at desc);

-- RLS : le formulaire est public en insertion ; la lecture/édition passe
-- par les routes Super Admin (service role) et n'expose donc pas de policy SELECT.
alter table public.seller_applications enable row level security;

drop policy if exists seller_applications_public_insert on public.seller_applications;
create policy seller_applications_public_insert
on public.seller_applications
for insert
to anon, authenticated
with check (true);

-- Trigger updated_at (fonction locale, aucune dépendance externe)
create or replace function public.seller_applications_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists seller_applications_updated_at on public.seller_applications;
create trigger seller_applications_updated_at
before update on public.seller_applications
for each row execute function public.seller_applications_set_updated_at();
