-- Drivers onboarding: driver profile + applications workflow

-- 1) Driver profile (one per auth user)
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,

  first_name text null,
  last_name text null,
  phone text null,
  whatsapp text null,
  address text null,
  neighborhood text null,

  emergency_contact_name text null,
  emergency_contact_phone text null,

  identity_doc_type text null,
  identity_doc_number text null,
  identity_doc_front_url text null,
  identity_doc_back_url text null,
  selfie_with_doc_url text null,

  transport_mode text null check (transport_mode in ('motorbike', 'car', 'tricycle', 'bicycle', 'walking', 'other')),
  vehicle_brand text null,
  vehicle_model text null,
  vehicle_plate text null,
  vehicle_color text null,
  vehicle_photos jsonb null,

  zones jsonb null,
  availability jsonb null,
  is_available boolean not null default false,
  max_distance_km integer null,

  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'rejected', 'suspended')),
  approved_at timestamptz null,
  approved_by uuid null,
  rejected_reason text null,

  rating numeric null,
  completed_deliveries integer not null default 0,
  cancelled_deliveries integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drivers_user_id_idx on public.drivers (user_id);
create index if not exists drivers_status_idx on public.drivers (status);
create index if not exists drivers_is_available_idx on public.drivers (is_available);

-- 2) Driver applications (audit + workflow)
create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,

  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payload jsonb null,

  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null,
  review_notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists driver_applications_user_id_idx on public.driver_applications (user_id);
create index if not exists driver_applications_status_idx on public.driver_applications (status);
create index if not exists driver_applications_submitted_at_idx on public.driver_applications (submitted_at);

-- 3) updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_drivers_updated_at on public.drivers;
create trigger trg_drivers_updated_at
before update on public.drivers
for each row
execute function public.set_updated_at();

drop trigger if exists trg_driver_applications_updated_at on public.driver_applications;
create trigger trg_driver_applications_updated_at
before update on public.driver_applications
for each row
execute function public.set_updated_at();

-- 4) RLS helpers
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
      and lower(replace(coalesce(u.role, ''), '-', '_')) = 'super_admin'
  );
$$;

-- 5) Enable RLS
alter table public.drivers enable row level security;
alter table public.driver_applications enable row level security;

-- Drivers table policies

drop policy if exists drivers_select_own_or_admin on public.drivers;
create policy drivers_select_own_or_admin
on public.drivers
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin_uid(auth.uid())
);

drop policy if exists drivers_insert_own on public.drivers;
create policy drivers_insert_own
on public.drivers
for insert
to authenticated
with check (
  user_id = auth.uid()
);

drop policy if exists drivers_update_own_or_admin on public.drivers;
create policy drivers_update_own_or_admin
on public.drivers
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin_uid(auth.uid())
)
with check (
  user_id = auth.uid()
  or public.is_super_admin_uid(auth.uid())
);

-- Driver applications policies

drop policy if exists driver_applications_select_own_or_admin on public.driver_applications;
create policy driver_applications_select_own_or_admin
on public.driver_applications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin_uid(auth.uid())
);

drop policy if exists driver_applications_insert_own on public.driver_applications;
create policy driver_applications_insert_own
on public.driver_applications
for insert
to authenticated
with check (
  user_id = auth.uid()
);

drop policy if exists driver_applications_update_admin_only on public.driver_applications;
create policy driver_applications_update_admin_only
on public.driver_applications
for update
to authenticated
using (
  public.is_super_admin_uid(auth.uid())
)
with check (
  public.is_super_admin_uid(auth.uid())
);
