-- ============================================================================
-- RPC atomique d'échange de points contre une devise
-- Objectif: rendre l'appel supabase.rpc('exchange_points_for_currency', {...})
-- fonctionnel et sécurisé (miroir de transfer_points_between_users).
-- Toutes les écritures (historique, soldes, transactions, sync legacy) sont
-- réalisées dans une seule transaction PostgreSQL avec verrouillage du compte.
-- ============================================================================

create or replace function public.exchange_points_for_currency(
  p_user_id uuid,
  p_from_currency text default 'POINTS',
  p_to_currency text default 'XOF',
  p_points integer default 0
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance numeric;
  v_spent numeric;
  v_fcfa numeric;
  v_frozen boolean;
  v_new_balance numeric;
  v_rate numeric;
  v_conversion_rate numeric;
  v_fee_row record;
  v_limit_row record;
  v_fee numeric;
  v_total_debit numeric;
  v_converted numeric;
  v_exchange_id uuid;
begin
  if p_points is null or p_points <= 0 then
    raise exception 'Le montant de l''échange doit être positif';
  end if;

  if p_to_currency is null or length(trim(p_to_currency)) = 0 then
    raise exception 'Devise cible manquante';
  end if;

  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  -- Résolution robuste: l'app peut passer un ID user (auth/users) ou un ID de profil.
  select coalesce((select up.user_id from public.user_profiles up where up.id = p_user_id), p_user_id)
    into v_user_id;

  -- Autorisation: l'utilisateur lui-même ou un admin/super_admin.
  if auth.uid() <> v_user_id and not exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'super_admin')
  ) then
    raise exception 'Accès refusé';
  end if;

  -- Taux de conversion points -> devise cible.
  select rate into v_rate
  from public.point_exchange_rates
  where currency = upper(trim(p_to_currency))
  limit 1;

  if v_rate is null then
    raise exception 'Aucun taux de change disponible pour la devise sélectionnée';
  end if;

  -- Taux de conversion global points -> XOF (pour maintenir fcfa_value synchronisé).
  v_conversion_rate := 1;
  if to_regclass('public.point_settings') is not null then
    execute 'select coalesce((select ps.conversion_rate from public.point_settings ps where ps.scope = ''global'' limit 1), 1)'
      into v_conversion_rate;
  end if;

  -- Frais d'échange: scope global en priorité, puis fallback sur la première ligne.
  v_fee := 0;
  if to_regclass('public.point_operation_fees') is not null then
    select * into v_fee_row
    from public.point_operation_fees
    where operation_type = 'exchange'
    order by (case when scope = 'global' then 1 else 0 end) desc
    limit 1;

    if v_fee_row is not null then
      v_fee := coalesce(v_fee_row.flat_fee, 0) + (p_points::numeric * coalesce(v_fee_row.percentage_fee, 0) / 100.0);
      if v_fee_row.minimum_fee is not null and v_fee < v_fee_row.minimum_fee then
        v_fee := v_fee_row.minimum_fee;
      end if;
      if v_fee_row.maximum_fee is not null and v_fee > v_fee_row.maximum_fee then
        v_fee := v_fee_row.maximum_fee;
      end if;
      if v_fee < 0 then
        v_fee := 0;
      end if;
    end if;
  end if;

  v_total_debit := p_points::numeric + v_fee;

  -- Limites min/max de l'opération d'échange.
  if to_regclass('public.point_operation_limits') is not null then
    select * into v_limit_row
    from public.point_operation_limits
    where operation_type = 'exchange'
    limit 1;

    if v_limit_row is not null then
      if v_limit_row.min_amount is not null and v_total_debit < v_limit_row.min_amount then
        raise exception 'Le montant d''échange doit être supérieur ou égal à %', v_limit_row.min_amount;
      end if;
      if v_limit_row.max_amount is not null and v_total_debit > v_limit_row.max_amount then
        raise exception 'Le montant d''échange ne peut pas dépasser %', v_limit_row.max_amount;
      end if;
    end if;
  end if;

  -- S'assure que le compte de points existe.
  insert into public.loyalty_points (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  -- Verrouillage + vérification du compte.
  select lp.points_balance,
         coalesce(lp.points_spent, 0),
         coalesce(lp.fcfa_value, 0),
         coalesce(lp.is_frozen, false)
    into v_balance, v_spent, v_fcfa, v_frozen
  from public.loyalty_points lp
  where lp.user_id = v_user_id
  for update;

  if v_frozen then
    raise exception 'Compte gelé : échange impossible';
  end if;

  if v_balance is null or v_balance < v_total_debit then
    raise exception 'Solde insuffisant pour effectuer l''échange';
  end if;

  v_converted := round(p_points::numeric * v_rate, 2);
  v_new_balance := v_balance - v_total_debit;

  -- Historique de l'échange.
  insert into public.point_exchange_history
    (user_id, from_currency, to_currency, points_amount, converted_amount, fee_amount, rate, metadata)
  values
    (v_user_id, coalesce(nullif(trim(p_from_currency), ''), 'POINTS'), upper(trim(p_to_currency)),
     p_points, v_converted, v_fee, v_rate,
     jsonb_build_object('conversion_rate', v_conversion_rate))
  returning id into v_exchange_id;

  -- Débit du solde.
  update public.loyalty_points
    set points_balance = v_new_balance,
        points_spent = v_spent + v_total_debit,
        fcfa_value = v_fcfa - (p_points::numeric * v_conversion_rate)
  where user_id = v_user_id;

  -- Transactions (échange + frais), référencées par l'id de l'échange.
  insert into public.point_transactions (user_id, type, points, fcfa_value, description, reference_id)
  values
    (v_user_id, 'exchange', p_points, round(p_points::numeric * v_conversion_rate, 2),
     format('Échange %s ➝ %s', coalesce(nullif(trim(p_from_currency), ''), 'POINTS'), upper(trim(p_to_currency))),
     v_exchange_id::text);

  if v_fee > 0 then
    insert into public.point_transactions (user_id, type, points, fcfa_value, description, reference_id)
    values
      (v_user_id, 'exchange_fee', v_fee, round(v_fee * v_conversion_rate, 2),
       format('Frais d''échange %s', upper(trim(p_to_currency))),
       v_exchange_id::text);
  end if;

  -- Synchronisation du solde legacy (colonne users.points_balance si présente).
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'points_balance'
  ) then
    update public.users set points_balance = v_new_balance where id = v_user_id;
  end if;

  return json_build_object(
    'exchangeId', v_exchange_id,
    'points', p_points,
    'fee', v_fee,
    'totalDebited', v_total_debit,
    'convertedAmount', v_converted,
    'currency', upper(trim(p_to_currency)),
    'newBalance', v_new_balance
  );
end;
$$;

revoke all on function public.exchange_points_for_currency(uuid, text, text, integer) from public;
grant execute on function public.exchange_points_for_currency(uuid, text, text, integer) to authenticated;
grant execute on function public.exchange_points_for_currency(uuid, text, text, integer) to service_role;

comment on function public.exchange_points_for_currency(uuid, text, text, integer)
is 'Échange atomique de points contre une devise: valide taux/frais/limites, verrouille loyalty_points, écrit point_exchange_history + point_transactions (exchange, exchange_fee), met à jour le solde et synchronise users.points_balance. Accepte users.id ou user_profiles.id.';

