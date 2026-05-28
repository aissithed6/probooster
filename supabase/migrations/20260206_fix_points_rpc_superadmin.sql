-- Correctif autorisations des RPC points
-- Objectif: aligner la vérification Super Admin des RPC (DB) avec celle de l'application (API)

create or replace function public.admin_withdraw_points(
  p_target_id uuid,
  p_points integer,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
  v_balance integer;
  v_rate numeric;
  v_is_super_admin boolean;
  v_claim_role text;
  v_claim_primary_role text;
begin
  if p_target_id is null then
    raise exception 'Identifiant utilisateur manquant';
  end if;

  if p_points is null or p_points <= 0 then
    raise exception 'Le nombre de points doit être positif';
  end if;

  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  v_is_super_admin := false;

  select lower(replace(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''), '-', '_')),
         lower(replace(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', ''), '-', '_'))
    into v_claim_role,
         v_claim_primary_role;

  if v_claim_role = 'super_admin' or v_claim_primary_role = 'super_admin' then
    v_is_super_admin := true;
  end if;

  if not v_is_super_admin then
    if exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and lower(replace(coalesce(u.role, ''), '-', '_')) = 'super_admin'
    ) then
      v_is_super_admin := true;
    end if;
  end if;

  if not v_is_super_admin then
    if to_regclass('public.user_role_assignments') is not null and to_regclass('public.roles') is not null then
      if exists (
        select 1
        from public.user_role_assignments ura
        join public.roles r on r.id = ura.role_id
        where ura.user_id = auth.uid()
          and lower(replace(coalesce(r.slug, r.name, ''), '-', '_')) = 'super_admin'
      ) then
        v_is_super_admin := true;
      end if;
    end if;
  end if;

  if not v_is_super_admin then
    raise exception 'Accès réservé au super administrateur';
  end if;

  select coalesce((select up.user_id from public.user_profiles up where up.id = p_target_id), p_target_id)
    into v_target_user_id;

  if not exists (select 1 from public.users u where u.id = v_target_user_id) then
    raise exception 'Utilisateur introuvable';
  end if;

  v_rate := 1;
  if to_regclass('public.point_settings') is not null then
    execute 'select coalesce((select ps.conversion_rate from public.point_settings ps where ps.scope = ''global'' limit 1), 1)'
      into v_rate;
  end if;

  insert into public.loyalty_points (user_id)
  values (v_target_user_id)
  on conflict (user_id) do nothing;

  select lp.points_balance
    into v_balance
  from public.loyalty_points lp
  where lp.user_id = v_target_user_id
  for update;

  if v_balance is null or v_balance < p_points then
    raise exception 'Solde insuffisant pour effectuer un retrait';
  end if;

  update public.loyalty_points
    set points_balance = points_balance - p_points,
        points_spent = coalesce(points_spent, 0) + p_points,
        fcfa_value = coalesce(fcfa_value, 0) - (p_points::numeric * v_rate)
  where user_id = v_target_user_id;

  insert into public.point_transactions (user_id, type, points, fcfa_value, description)
  values (
    v_target_user_id,
    'spend',
    p_points,
    (p_points::numeric * v_rate),
    coalesce(nullif(trim(p_description), ''), 'Retrait de points par le Super Admin')
  );
end;
$$;

revoke all on function public.admin_withdraw_points(uuid, integer, text) from public;
grant execute on function public.admin_withdraw_points(uuid, integer, text) to authenticated;

comment on function public.admin_withdraw_points(uuid, integer, text)
is 'Retire des points du compte loyalty_points d''un utilisateur (Super Admin). Accepte users.id ou user_profiles.id. Met à jour points_balance/points_spent/fcfa_value et ajoute une ligne point_transactions (type=spend).';

create or replace function public.set_points_freeze_status(
  p_target_id uuid,
  p_is_frozen boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
  v_now timestamptz;
  v_is_super_admin boolean;
  v_claim_role text;
  v_claim_primary_role text;
begin
  if p_target_id is null then
    raise exception 'Identifiant utilisateur manquant';
  end if;

  if p_is_frozen is null then
    raise exception 'Statut gel manquant';
  end if;

  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  v_is_super_admin := false;

  select lower(replace(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''), '-', '_')),
         lower(replace(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', ''), '-', '_'))
    into v_claim_role,
         v_claim_primary_role;

  if v_claim_role = 'super_admin' or v_claim_primary_role = 'super_admin' then
    v_is_super_admin := true;
  end if;

  if not v_is_super_admin then
    if exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and lower(replace(coalesce(u.role, ''), '-', '_')) = 'super_admin'
    ) then
      v_is_super_admin := true;
    end if;
  end if;

  if not v_is_super_admin then
    if to_regclass('public.user_role_assignments') is not null and to_regclass('public.roles') is not null then
      if exists (
        select 1
        from public.user_role_assignments ura
        join public.roles r on r.id = ura.role_id
        where ura.user_id = auth.uid()
          and lower(replace(coalesce(r.slug, r.name, ''), '-', '_')) = 'super_admin'
      ) then
        v_is_super_admin := true;
      end if;
    end if;
  end if;

  if not v_is_super_admin then
    raise exception 'Accès réservé au super administrateur';
  end if;

  select coalesce((select up.user_id from public.user_profiles up where up.id = p_target_id), p_target_id)
    into v_target_user_id;

  if not exists (select 1 from public.users u where u.id = v_target_user_id) then
    raise exception 'Utilisateur introuvable';
  end if;

  v_now := now();

  insert into public.loyalty_points (user_id)
  values (v_target_user_id)
  on conflict (user_id) do nothing;

  perform 1
  from public.loyalty_points lp
  where lp.user_id = v_target_user_id
  for update;

  if p_is_frozen then
    update public.loyalty_points
      set is_frozen = true,
          frozen_at = v_now,
          frozen_by = auth.uid(),
          freeze_reason = nullif(trim(p_reason), '')
    where user_id = v_target_user_id;
  else
    update public.loyalty_points
      set is_frozen = false,
          frozen_at = null,
          frozen_by = null,
          freeze_reason = null
    where user_id = v_target_user_id;
  end if;
end;
$$;

revoke all on function public.set_points_freeze_status(uuid, boolean, text) from public;
grant execute on function public.set_points_freeze_status(uuid, boolean, text) to authenticated;

comment on function public.set_points_freeze_status(uuid, boolean, text)
is 'Gèle ou dégèle le compte de points d''un utilisateur (Super Admin). Accepte users.id ou user_profiles.id et met à jour is_frozen/frozen_at/frozen_by/freeze_reason dans loyalty_points.';
