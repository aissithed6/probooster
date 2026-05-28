-- RPC client: dépenser des points (achat / paiement en points)
-- Sécurité: l'utilisateur ne peut dépenser que ses propres points (auth.uid()).

create or replace function public.spend_points(
  p_points integer,
  p_description text default null,
  p_reference_id text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance integer;
  v_rate numeric;
  v_is_frozen boolean;
  v_freeze_reason text;
  v_new_balance integer;
  v_now timestamptz;
begin
  -- Validation inputs
  if p_points is null or p_points <= 0 then
    raise exception 'Le nombre de points doit être un entier positif';
  end if;

  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  v_now := now();

  -- S'assure que le compte existe
  insert into public.loyalty_points (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  -- Lock la ligne pour éviter les conditions de course
  select coalesce(lp.points_balance, 0),
         coalesce(lp.is_frozen, false),
         lp.freeze_reason
    into v_balance,
         v_is_frozen,
         v_freeze_reason
  from public.loyalty_points lp
  where lp.user_id = v_user_id
  for update;

  if v_is_frozen then
    raise exception 'Compte gelé : %', coalesce(nullif(trim(v_freeze_reason), ''), 'opération impossible');
  end if;

  if v_balance < p_points then
    raise exception 'Solde de points insuffisant';
  end if;

  -- Taux de conversion
  v_rate := 1;
  if to_regclass('public.point_settings') is not null then
    execute 'select coalesce((select ps.conversion_rate from public.point_settings ps where ps.scope = ''global'' limit 1), 1)'
      into v_rate;
  end if;

  v_new_balance := v_balance - p_points;

  update public.loyalty_points
    set points_balance = v_new_balance,
        points_spent = coalesce(points_spent, 0) + p_points,
        fcfa_value = coalesce(fcfa_value, 0) - (p_points::numeric * v_rate),
        updated_at = v_now
  where user_id = v_user_id;

  insert into public.point_transactions (user_id, type, points, fcfa_value, description, reference_id)
  values (
    v_user_id,
    'spend',
    p_points,
    (p_points::numeric * v_rate),
    coalesce(nullif(trim(p_description), ''), 'Dépense de points'),
    nullif(trim(p_reference_id), '')
  );

  return v_new_balance;
end;
$$;

revoke all on function public.spend_points(integer, text, text) from public;
grant execute on function public.spend_points(integer, text, text) to authenticated;

comment on function public.spend_points(integer, text, text)
is 'Débite des points du compte loyalty_points de l''utilisateur courant (auth.uid). Met à jour points_balance/points_spent/fcfa_value et ajoute une ligne point_transactions (type=spend).';
