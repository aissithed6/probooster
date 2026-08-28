-- =============================================================================
-- MIGRATION : 20260828000000_sync_review_aggregates_trigger.sql
--
-- Objectif : garantir que TOUTES les surfaces (cartes produits, fiche produit,
-- page vendeur, dashboards client / super admin / vendeur) montrent des notes
-- et compteurs d'avis SYNCHRONISÉS et issus de LA MÊME source de vérité :
--   public.product_reviews (statut = 'approved').
--
-- Problème corrigé :
--   * Aucun trigger ne recalculait product_statistics / user_products.rating
--     quand un avis était ajouté/modifié/supprimé (seule la modération API le
--     faisait via syncProductReviewStats). La note produit pouvait diverger
--     de la note vendeur (maintenue par trigger) et du dashboard vendeur
--     (calcul en direct sur product_reviews).
--   * Incohérence de colonnes : le code lit parfois `reviews_count`, mais le
--     schéma déclarait `total_reviews`. On ajoute reviews_count (si absent)
--     et on le maintient à l'identique dans le trigger + backfill.
--
-- Idempotent et ré-exécutable sans risque (DROP ... IF EXISTS / CREATE OR
-- REPLACE / ADD COLUMN IF NOT EXISTS / DO $$ idempotent $$).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Corriger l'incohérence de colonnes sur user_products
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_products
  ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0;

-- Aligner reviews_count sur total_reviews (sécurité avant backfill)
UPDATE public.user_products
   SET reviews_count = COALESCE(total_reviews, 0)
 WHERE reviews_count IS DISTINCT FROM COALESCE(total_reviews, 0);

-- -----------------------------------------------------------------------------
-- 1) Fonction : recalcule les agrégats d'UN produit (statistics + user_products)
--    Uniquement sur les avis au statut 'approved'.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_review_for_product(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg   numeric;
  v_count integer;
BEGIN
  IF p_product_id IS NULL THEN
    RETURN;
  END IF;

  -- Note moyenne et nombre d'avis approuvés
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::numeric,
         COUNT(*)::integer
    INTO v_avg, v_count
    FROM public.product_reviews
   WHERE product_id = p_product_id
     AND status = 'approved';

  -- product_statistics (clé primaire product_id -> upsert)
  INSERT INTO public.product_statistics (product_id, average_rating, review_count, updated_at)
  VALUES (p_product_id, v_avg, v_count, now())
  ON CONFLICT (product_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    review_count   = EXCLUDED.review_count,
    updated_at     = now();

  -- user_products (columns rating / total_reviews)
  UPDATE public.user_products
     SET rating        = v_avg,
         total_reviews = v_count,
         updated_at    = now()
   WHERE id = p_product_id;

  -- user_products.reviews_count si la colonne existe (fiab. contre tout schéma)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'user_products'
       AND column_name  = 'reviews_count'
  ) THEN
    UPDATE public.user_products
       SET reviews_count = v_count
     WHERE id = p_product_id;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2) Trigger sur product_reviews : INSERT / UPDATE / DELETE
--    Recalcule le produit concerné + refresh du snapshot vendeur.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_review_aggregates_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product uuid;
  v_vendor  uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_product := OLD.product_id;
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.product_id, NEW.product_id) IS DISTINCT FROM COALESCE(NEW.product_id, OLD.product_id) THEN
    -- L'avis change de produit : on recalcule l'ancien aussi pour retomber juste
    PERFORM public.sync_review_for_product(OLD.product_id);
    v_product := NEW.product_id;
  ELSE
    v_product := COALESCE(NEW.product_id, OLD.product_id);
  END IF;

  IF v_product IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public.sync_review_for_product(v_product);

  -- Rafraîchit aussi la note vendeur (même source), ce qui couvre notamment
  -- le cas DELETE (non couvert par la migration vendor_rating_realtime).
  SELECT p.vendor_id INTO v_vendor
    FROM public.user_products p
   WHERE p.id = v_product;

  IF v_vendor IS NOT NULL THEN
    PERFORM public.refresh_vendor_rating_snapshot(v_vendor);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_review_aggregates ON public.product_reviews;
CREATE TRIGGER trg_sync_review_aggregates
  AFTER INSERT OR UPDATE OF product_id, rating, status OR DELETE
  ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_review_aggregates_after_change();

-- -----------------------------------------------------------------------------
-- 3) Backfill complet (idempotent) : tout produit ayant ou non des avis
-- -----------------------------------------------------------------------------
-- a) Produits ayant des avis
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT product_id
      FROM public.product_reviews
     WHERE product_id IS NOT NULL
  LOOP
    PERFORM public.sync_review_for_product(r.product_id);
  END LOOP;
END $$;

-- b) Produits sans aucun avis : on remet les agrégats à zéro (note 0 / 0 avis)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT up.id
      FROM public.user_products up
     WHERE NOT EXISTS (
       SELECT 1 FROM public.product_reviews pr
        WHERE pr.product_id = up.id
     )
  LOOP
    INSERT INTO public.product_statistics (product_id, average_rating, review_count, updated_at)
    VALUES (r.id, 0, 0, now())
    ON CONFLICT (product_id) DO UPDATE SET
      average_rating = 0,
      review_count   = 0,
      updated_at     = now();

    UPDATE public.user_products
       SET rating        = 0,
           total_reviews = 0,
           reviews_count = 0,
           updated_at    = now()
     WHERE id = r.id;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4) Rafraîchit aussi tous les snapshots vendeur (idempotent, couvre le DELETE)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v uuid;
BEGIN
  FOR v IN
    SELECT DISTINCT vendor_id FROM public.user_products WHERE vendor_id IS NOT NULL
  LOOP
    PERFORM public.refresh_vendor_rating_snapshot(v);
  END LOOP;
END $$;

-- =============================================================================
-- Vérifications rapides (optionnel) :
-- SELECT product_id, average_rating, review_count FROM public.product_statistics ORDER BY updated_at DESC LIMIT 10;
-- SELECT id, rating, total_reviews, reviews_count FROM public.user_products LIMIT 10;
-- SELECT vendor_id, average_rating, review_count FROM public.vendor_rating_snapshot LIMIT 10;
-- =============================================================================