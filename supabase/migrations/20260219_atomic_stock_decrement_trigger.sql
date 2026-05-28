-- Stock atomique: décrémentation synchronisée en base lors de l'insertion des lignes de commande.
-- Objectif: garantir que stock_quantity est toujours cohérent et mis à jour simultanément (pas de décalage UI/API).

-- Fonction trigger: décrémente le stock si manage_stock=true.
-- - Si allow_backorders=false, refuse l'insertion si stock insuffisant.
-- - Si stock_quantity est NULL (stock non géré numériquement), ne modifie pas la valeur.
create or replace function public.trg_order_items_decrement_stock()
returns trigger
language plpgsql
as $$
declare
  v_manage_stock boolean;
  v_allow_backorders boolean;
  v_stock_quantity numeric;
begin
  -- Sécurité: si pas de product_id, ne rien faire.
  if new.product_id is null then
    return new;
  end if;

  -- Charger les flags stock du produit.
  select
    coalesce(manage_stock, false),
    coalesce(allow_backorders, false),
    stock_quantity
  into
    v_manage_stock,
    v_allow_backorders,
    v_stock_quantity
  from public.user_products
  where id = new.product_id
  for update;

  -- Si produit introuvable, on laisse la FK / logique applicative gérer.
  if not found then
    return new;
  end if;

  -- Pas de gestion stock => ne rien faire.
  if v_manage_stock is not true then
    return new;
  end if;

  -- Si stock_quantity est NULL, on ne décrémente pas (stock non défini).
  if v_stock_quantity is null then
    return new;
  end if;

  -- Quantité invalide => ne rien faire.
  if new.quantity is null or new.quantity <= 0 then
    return new;
  end if;

  -- Backorders interdits: stock strict.
  if v_allow_backorders is not true then
    if v_stock_quantity < new.quantity then
      raise exception 'Stock insuffisant pour le produit % (disponible=%, demandé=%)', new.product_id, v_stock_quantity, new.quantity
        using errcode = '23514';
    end if;

    update public.user_products
      set stock_quantity = greatest(0, stock_quantity - new.quantity)
      where id = new.product_id;

    return new;
  end if;

  -- Backorders autorisés: on décrémente en best-effort mais on évite les négatifs.
  update public.user_products
    set stock_quantity = greatest(0, stock_quantity - new.quantity)
    where id = new.product_id;

  return new;
end;
$$;

-- Trigger AFTER INSERT pour s'assurer que la ligne existe (mais la transaction reste atomique).
-- Note: si tu veux refuser *avant* insert, on peut passer en BEFORE INSERT (fonction identique).
drop trigger if exists order_items_decrement_stock on public.order_items;
create trigger order_items_decrement_stock
after insert on public.order_items
for each row
execute function public.trg_order_items_decrement_stock();
  