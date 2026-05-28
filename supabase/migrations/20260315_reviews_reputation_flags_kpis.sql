-- Reviews & Reputation: KPIs sur signalements (flags)
-- Objectif: timestamps fiables pour calculer temps de résolution + efficacité (<48h)

-- =====================================================================================
-- product_review_flags: timestamps de traitement
-- =====================================================================================

do $$
begin
  -- Ajout des colonnes si absentes
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'product_review_flags'
  ) then
    -- updated_at
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'product_review_flags'
        and column_name = 'updated_at'
    ) then
      alter table public.product_review_flags
        add column updated_at timestamptz not null default now();
    end if;

    -- investigating_at
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'product_review_flags'
        and column_name = 'investigating_at'
    ) then
      alter table public.product_review_flags
        add column investigating_at timestamptz null;
    end if;

    -- resolved_at
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'product_review_flags'
        and column_name = 'resolved_at'
    ) then
      alter table public.product_review_flags
        add column resolved_at timestamptz null;
    end if;

    -- dismissed_at
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'product_review_flags'
        and column_name = 'dismissed_at'
    ) then
      alter table public.product_review_flags
        add column dismissed_at timestamptz null;
    end if;
  end if;
end
$$;

-- updated_at auto (best-effort)
-- Note: utilise la fonction/extension `moddatetime(updated_at)` si disponible.

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'product_review_flags'
      and c.relkind = 'r'
  ) then
    if not exists (
      select 1
      from pg_trigger
      where tgname = 'set_product_review_flags_updated_at'
    ) then
      create trigger set_product_review_flags_updated_at
      before update on public.product_review_flags
      for each row
      execute procedure moddatetime(updated_at);
    end if;
  end if;
exception
  when undefined_function then
    -- si l'extension/moddatetime n'est pas dispo, on laisse l'updated_at géré côté API
    null;
end
$$;
