-- Ajout d'une contrainte d'unicité sur loyalty_points.user_id
-- Objectif: permettre l'utilisation de "insert ... on conflict (user_id)" dans les RPC points.

DO $$
declare
  v_duplicates_count integer;
begin
  select count(*)
    into v_duplicates_count
  from (
    select user_id
    from public.loyalty_points
    where user_id is not null
    group by user_id
    having count(*) > 1
  ) d;

  if v_duplicates_count > 0 then
    raise exception 'Impossible d''ajouter une contrainte UNIQUE sur loyalty_points.user_id: % user_id(s) en double détecté(s). Veuillez dédupliquer la table avant de relancer la migration.', v_duplicates_count;
  end if;
end;
$$;

create unique index if not exists loyalty_points_user_id_unique
  on public.loyalty_points (user_id);
