-- WhatsApp Pulse: Abonnés newsletter WhatsApp (support international)
-- Objectif: Stocker les abonnés avec leurs intérêts, pays détecté, et métadonnées

-- =====================================================
-- 1) Table whatsapp_subscribers
-- =====================================================
create table if not exists public.whatsapp_subscribers (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  country_code text not null default '+229',
  country_name text null,
  country_flag text null default '🇧🇯',
  interests text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive', 'unsubscribed')),
  engagement_score integer not null default 0,
  source text not null default 'footer' check (source in ('footer', 'landing', 'popup', 'campaign', 'referral')),
  metadata jsonb null,
  subscribed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_subscribers_phone_idx on public.whatsapp_subscribers (phone);
create index if not_exists whatsapp_subscribers_status_idx on public.whatsapp_subscribers (status);
create index if not_exists whatsapp_subscribers_interests_idx on public.whatsapp_subscribers using gin (interests);
create index if not_exists whatsapp_subscribers_subscribed_at_idx on public.whatsapp_subscribers (subscribed_at desc);

-- RLS: lecture/écriture uniquement via service_role (routes API serveur)
alter table public.whatsapp_subscribers enable row level security;

drop policy if exists "whatsapp_subscribers_service" on public.whatsapp_subscribers;
create policy "whatsapp_subscribers_service"
on public.whatsapp_subscribers
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- =====================================================
-- 2) Fonction de détection de doublons et upsert
-- =====================================================
create or replace function public.upsert_whatsapp_subscriber(
  p_phone text,
  p_country_code text,
  p_country_name text,
  p_country_flag text,
  p_interests text[],
  p_source text,
  p_metadata jsonb
)
returns public.whatsapp_subscribers
language plpgsql
security definer
as $$
declare
  result public.whatsapp_subscribers;
begin
  insert into public.whatsapp_subscribers (
    phone, country_code, country_name, country_flag,
    interests, source, metadata, status, updated_at
  ) values (
    p_phone, p_country_code, p_country_name, p_country_flag,
    p_interests, coalesce(p_source, 'footer'),
    coalesce(p_metadata, '{}'::jsonb),
    'active', now()
  )
  on conflict (phone) do update set
    interests = public.whatsapp_subscribers.interests || excluded.interests,
    status = 'active',
    updated_at = now()
  into result;

  return result;
end;
$$;

-- =====================================================
-- 3) Fonction de statistiques pour le dashboard
-- =====================================================
create or replace function public.get_whatsapp_subscribers_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    'total', (select count(*) from public.whatsapp_subscribers),
    'active', (select count(*) from public.whatsapp_subscribers where status = 'active'),
    'inactive', (select count(*) from public.whatsapp_subscribers where status = 'inactive'),
    'unsubscribed', (select count(*) from public.whatsapp_subscribers where status = 'unsubscribed'),
    'today', (select count(*) from public.whatsapp_subscribers where subscribed_at >= current_date),
    'thisWeek', (select count(*) from public.whatsapp_subscribers where subscribed_at >= date_trunc('week', now())),
    'thisMonth', (select count(*) from public.whatsapp_subscribers where subscribed_at >= date_trunc('month', now())),
    'byCountry', (
      select json_agg(json_build_object('country', country_name, 'flag', country_flag, 'count', cnt))
      from (
        select country_name, country_flag, count(*) as cnt
        from public.whatsapp_subscribers
        group by country_name, country_flag
        order by cnt desc
        limit 10
      ) t
    ),
    'byInterest', (
      select json_agg(json_build_object('interest', interest, 'count', cnt))
      from (
        select unnest(interests) as interest, count(*) as cnt
        from public.whatsapp_subscribers
        group by interest
        order by cnt desc
      ) t
    ),
    'bySource', (
      select json_agg(json_build_object('source', source, 'count', cnt))
      from (
        select source, count(*) as cnt
        from public.whatsapp_subscribers
        group by source
        order by cnt desc
      ) t
    ),
    'recentSubscribers', (
      select json_agg(sub)
      from (
        select json_build_object(
          'id', id,
          'phone', phone,
          'countryFlag', country_flag,
          'interests', interests,
          'subscribedAt', subscribed_at
        ) as sub
        from public.whatsapp_subscribers
        order by subscribed_at desc
        limit 5
      ) t
    )
  );
$$;