create or replace function public.set_points_freeze_status(
  p_target_id uuid,
  p_is_frozen boolean,
  p_reason text default null,
  p_points integer default null
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
  v_description text;
  v_points_balance integer;
  v_frozen_points integer;
  v_freeze_amount integer;
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

  select coalesce(lp.points_balance, 0),
         coalesce(lp.frozen_points, 0)
    into v_points_balance,
         v_frozen_points
  from public.loyalty_points lp
  where lp.user_id = v_target_user_id;

  if p_is_frozen then
    if p_points is null then
      v_freeze_amount := greatest(0, v_points_balance);
    else
      v_freeze_amount := greatest(0, p_points);
    end if;

    if v_freeze_amount <= 0 then
      raise exception 'Aucun point disponible à geler pour cet utilisateur';
    end if;

    if v_freeze_amount > v_points_balance then
      raise exception 'Solde insuffisant pour geler % points', v_freeze_amount;
    end if;

    update public.loyalty_points
      set is_frozen = true,
          frozen_at = v_now,
          frozen_by = auth.uid(),
          freeze_reason = nullif(trim(p_reason), ''),
          points_balance = points_balance - v_freeze_amount,
          frozen_points = coalesce(frozen_points, 0) + v_freeze_amount
    where user_id = v_target_user_id;

    v_description := coalesce(nullif(trim(p_reason), ''), 'Gel du compte de points');

    insert into public.point_transactions (user_id, type, points, fcfa_value, description)
    values (v_target_user_id, 'freeze', v_freeze_amount, 0, v_description);
  else
    if v_frozen_points <= 0 then
      raise exception 'Aucun point n''était gelé pour cet utilisateur. Vous ne pouvez pas dégeler.';
    end if;

    if p_points is null then
      v_freeze_amount := greatest(0, v_frozen_points);
    else
      v_freeze_amount := greatest(0, p_points);
    end if;

    if v_freeze_amount <= 0 then
      raise exception 'Aucun point à dégeler pour cet utilisateur';
    end if;

    if v_freeze_amount > v_frozen_points then
      raise exception 'Montant à dégeler (% points) supérieur aux points gelés (% points)', v_freeze_amount, v_frozen_points;
    end if;

    update public.loyalty_points
      set frozen_points = greatest(0, coalesce(frozen_points, 0) - v_freeze_amount),
          points_balance = points_balance + v_freeze_amount,
          is_frozen = (greatest(0, coalesce(frozen_points, 0) - v_freeze_amount) > 0),
          frozen_at = case when (greatest(0, coalesce(frozen_points, 0) - v_freeze_amount) > 0) then frozen_at else null end,
          frozen_by = case when (greatest(0, coalesce(frozen_points, 0) - v_freeze_amount) > 0) then frozen_by else null end,
          freeze_reason = case when (greatest(0, coalesce(frozen_points, 0) - v_freeze_amount) > 0) then freeze_reason else null end
    where user_id = v_target_user_id;

    v_description := 'Dégel du compte de points';

    insert into public.point_transactions (user_id, type, points, fcfa_value, description)
    values (v_target_user_id, 'unfreeze', v_freeze_amount, 0, v_description);
  end if;
end;
$$;

revoke all on function public.set_points_freeze_status(uuid, boolean, text, integer) from public;
grant execute on function public.set_points_freeze_status(uuid, boolean, text, integer) to authenticated;
