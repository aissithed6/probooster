-- Finance: demandes de paiement vendeur (immédiates)

create table if not exists public.finance_payment_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  vendor_name text null,
  user_id uuid null,
  order_ids jsonb not null default '[]'::jsonb,
  orders_count integer not null default 0,
  total_amount numeric not null default 0,
  commission_amount numeric not null default 0,
  net_amount numeric not null default 0,
  status text not null default 'pending',
  payment_method text not null default 'bank_transfer',
  bank_details jsonb null,
  mobile_number text null,
  notes text null,
  execution_type text null,
  schedule_date date null,
  payout_window text null,
  batch_id uuid null,
  created_at timestamptz not null default now(),
  processed_at timestamptz null
);

create index if not exists finance_payment_requests_vendor_id_idx
  on public.finance_payment_requests(vendor_id);

create index if not exists finance_payment_requests_status_idx
  on public.finance_payment_requests(status);

create index if not exists finance_payment_requests_created_at_idx
  on public.finance_payment_requests(created_at desc);

create table if not exists public.finance_payment_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.finance_payment_requests(id) on delete cascade,
  label text not null,
  actor text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists finance_payment_request_events_request_id_idx
  on public.finance_payment_request_events(request_id);

alter table public.finance_payment_requests enable row level security;
alter table public.finance_payment_request_events enable row level security;

-- Politiques RLS (best-effort). Les API utilisent le client admin (service role) mais
-- on garde RLS pour protéger l'accès direct via le client public.

do $$
begin
  -- Vendor: lecture de ses demandes
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_payment_requests' and policyname = 'Vendor can read own payment requests'
  ) then
    create policy "Vendor can read own payment requests"
      on public.finance_payment_requests
      for select
      to authenticated
      using (vendor_id = auth.uid());
  end if;

  -- Vendor: création de ses demandes
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_payment_requests' and policyname = 'Vendor can create own payment requests'
  ) then
    create policy "Vendor can create own payment requests"
      on public.finance_payment_requests
      for insert
      to authenticated
      with check (vendor_id = auth.uid());
  end if;

  -- Vendor: lecture des events liés à ses demandes
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_payment_request_events' and policyname = 'Vendor can read events for own requests'
  ) then
    create policy "Vendor can read events for own requests"
      on public.finance_payment_request_events
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.finance_payment_requests r
          where r.id = finance_payment_request_events.request_id
            and r.vendor_id = auth.uid()
        )
      );
  end if;
end
$$;
