-- ============================================================================
-- SOURCE UNIQUE DE VÉRITÉ : SNAPSHOT DES REVENUS VENDEUR (CA ultra-rapide)
-- ============================================================================
-- Rôle : dénormaliser le chiffre d'affaire par vendeur dans UNE SEULE table
-- `vendor_revenue_snapshot` (1 ligne / vendeur), maintenue AUTOMATIQUEMENT par
-- des déclencheurs Postgres sur `orders` et `order_returns`. Le dashboard et le
-- super-admin lisent ainsi le CA en O(1), au lieu d'agréger N lignes order_items.
--
-- Définition (source unique, cohérente avec lib/vendor-revenue.ts) :
--   CA (gross)   = SUM(order_items.total_price) des commandes PAYÉES
--   Retours      = SUM des order_returns validés + gross des commandes 'refunded'
--   Net          = CA − Retours   ( « CA = ventes payées − retours » )
--
-- Idempotent : exécutable plusieurs fois sans risque.
-- ============================================================================

-- ── Prédicats canoniques (miroir SQL des fonctions TS) ───────────────────────
CREATE OR REPLACE FUNCTION public.is_paid_revenue_status(p_status text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(coalesce(p_status,'')) IN
    ('paid','completed','succeeded','successful','authorized','captured','processed','delivered')
    AND lower(coalesce(p_status,'')) NOT IN ('unpaid','pending','failed','cancelled','refunded')
$$;

CREATE OR REPLACE FUNCTION public.is_approved_return_status(p_status text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(coalesce(p_status,'')) IN
    ('approved','completed','resolved','accepted','processed','refunded','validated')
$$;

-- ── Table snapshot ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_revenue_snapshot (
  vendor_id     uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_revenue numeric(14,2) NOT NULL DEFAULT 0,   -- CA brut (ventes payées)
  returns_amount numeric(14,2) NOT NULL DEFAULT 0,  -- retours validés
  net_revenue   numeric(14,2) NOT NULL DEFAULT 0,   -- CA − retours
  total_sales   bigint       NOT NULL DEFAULT 0,    -- quantités vendues
  orders_count  bigint       NOT NULL DEFAULT 0,    -- commandes payées distinctes
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- Index utile pour les classements / « CA par vendeur » du super-admin et du leaderboard.
CREATE INDEX IF NOT EXISTS idx_vendor_revenue_snapshot_net
  ON public.vendor_revenue_snapshot (net_revenue DESC);

-- ── Recalcul du snapshot d'un vendeur ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_vendor_revenue_snapshot(p_vendor_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_gross    numeric := 0;
  v_sales    bigint  := 0;
  v_orders   bigint  := 0;
  v_returns  numeric := 0;
  v_ret_sub  numeric := 0;
  v_net      numeric := 0;
BEGIN
  -- CA brut = somme des lignes des commandes payées du vendeur.
  SELECT COALESCE(SUM(oi.total_price), 0),
         COALESCE(SUM(oi.quantity), 0),
         COUNT(DISTINCT o.id)
    INTO v_gross, v_sales, v_orders
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
   WHERE o.vendor_id = p_vendor_id
     AND public.is_paid_revenue_status(o.payment_status);

  -- Retours (i) : commandes marquées entièrement remboursées.
  SELECT COALESCE(SUM(COALESCE(o.final_total, o.total_amount, 0)), 0)
    INTO v_returns
    FROM public.orders o
   WHERE o.vendor_id = p_vendor_id
     AND lower(coalesce(o.payment_status,'')) = 'refunded';

  -- Retours (ii) : lignes order_returns validées (tolérant aux variantes de colonnes).
  BEGIN
    SELECT COALESCE(SUM(COALESCE(r.amount, r.refund_amount, r.total_price, 0)), 0)
      INTO v_ret_sub
      FROM public.order_returns r
     WHERE r.vendor_id = p_vendor_id
       AND public.is_approved_return_status(r.status);
    v_returns := v_returns + coalesce(v_ret_sub, 0);
  EXCEPTION WHEN undefined_column OR undefined_table THEN
    NULL; -- schéma retours différent : on garde uniquement les commandes refunded
  END;

  v_net := GREATEST(0, v_gross - v_returns);

  INSERT INTO public.vendor_revenue_snapshot
    (vendor_id, total_revenue, returns_amount, net_revenue, total_sales, orders_count, updated_at)
  VALUES
    (p_vendor_id, v_gross, v_returns, v_net, v_sales, v_orders, now())
  ON CONFLICT (vendor_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    returns_amount = EXCLUDED.returns_amount,
    net_revenue   = EXCLUDED.net_revenue,
    total_sales   = EXCLUDED.total_sales,
    orders_count  = EXCLUDED.orders_count,
    updated_at    = now();
END $$;


-- ── Déclencheurs ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_vendor_revenue_from_order() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  v := CASE WHEN TG_OP = 'DELETE' THEN OLD.vendor_id ELSE NEW.vendor_id END;
  IF v IS NOT NULL THEN PERFORM public.refresh_vendor_revenue_snapshot(v); END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_vendor_revenue_order ON public.orders;
CREATE TRIGGER trg_vendor_revenue_order
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_vendor_revenue_from_order();

CREATE OR REPLACE FUNCTION public.touch_vendor_revenue_from_return() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  v := CASE WHEN TG_OP = 'DELETE' THEN OLD.vendor_id ELSE NEW.vendor_id END;
  IF v IS NOT NULL THEN PERFORM public.refresh_vendor_revenue_snapshot(v); END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_vendor_revenue_return ON public.order_returns;
CREATE TRIGGER trg_vendor_revenue_return
  AFTER INSERT OR UPDATE OR DELETE ON public.order_returns
  FOR EACH ROW EXECUTE FUNCTION public.touch_vendor_revenue_from_return();

-- ── Backfill : recalcul de tous les vendeurs existants ───────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT DISTINCT vendor_id FROM public.orders WHERE vendor_id IS NOT NULL
    UNION
    SELECT DISTINCT vendor_id FROM public.order_returns WHERE vendor_id IS NOT NULL
  LOOP
    BEGIN
      PERFORM public.refresh_vendor_revenue_snapshot(r.vendor_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'refresh échoué pour vendeur %', r.vendor_id;
    END;
  END LOOP;
END $$;

-- Vérif rapide : SELECT vendor_id, total_revenue, returns_amount, net_revenue FROM vendor_revenue_snapshot ORDER BY net_revenue DESC LIMIT 20;
