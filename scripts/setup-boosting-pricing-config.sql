create table if not exists public.boosting_pricing_config (
  id uuid not null,
  config_json jsonb not null default '{}'::jsonb,
  updated_by uuid null,
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint boosting_pricing_config_pkey primary key (id)
) TABLESPACE pg_default;

insert into public.boosting_pricing_config (id, config_json, updated_by, updated_at, created_at)
values ('00000000-0000-0000-0000-000000000000', '{}'::jsonb, null, now(), now())
on conflict (id) do nothing;

select pg_notify('pgrst', 'reload schema');
