-- =============================================================================
-- Migration : statut de modération sur product_reviews
-- À exécuter dans Supabase → SQL Editor (une seule fois).
-- Compatible avec product_review_moderation_events + product_review_flags.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Type enum (idempotent)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.product_review_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'flagged'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Colonnes sur product_reviews
-- -----------------------------------------------------------------------------
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS status public.product_review_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid,
  ADD COLUMN IF NOT EXISTS status_reason text;

COMMENT ON COLUMN public.product_reviews.status IS
  'Statut de visibilité : approved = public, rejected = masqué, flagged = signalé, pending = en attente.';

COMMENT ON COLUMN public.product_reviews.moderated_at IS
  'Date de la dernière action de modération appliquée à cet avis.';

COMMENT ON COLUMN public.product_reviews.moderated_by IS
  'UUID de l''acteur (vendeur ou admin) ayant modéré l''avis.';

COMMENT ON COLUMN public.product_reviews.status_reason IS
  'Motif optionnel (rejet, signalement, etc.).';

-- -----------------------------------------------------------------------------
-- 3) Index utiles pour le catalogue public et le dashboard
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status
  ON public.product_reviews (product_id, status);

CREATE INDEX IF NOT EXISTS idx_product_reviews_status_created_at
  ON public.product_reviews (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_reviews_approved_product
  ON public.product_reviews (product_id, created_at DESC)
  WHERE status = 'approved';

-- -----------------------------------------------------------------------------
-- 4) Fonction : recalcul du statut d''un avis (source de vérité alignée app)
-- Priorité : signalement ouvert > dernière modération > approved par défaut
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_product_review_status(p_review_id uuid)
RETURNS public.product_review_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_open_flag boolean;
  v_action text;
  v_status public.product_review_status;
  v_moderated_at timestamptz;
  v_moderated_by uuid;
  v_reason text;
BEGIN
  IF p_review_id IS NULL THEN
    RETURN 'approved';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.product_review_flags f
    WHERE f.review_id = p_review_id
      AND lower(COALESCE(f.status::text, 'open')) IN ('open', 'investigating', 'pending')
  )
  INTO v_has_open_flag;

  IF v_has_open_flag THEN
    v_status := 'flagged';
    v_moderated_at := NULL;
    v_moderated_by := NULL;
    v_reason := NULL;
  ELSE
    SELECT
      e.action,
      e.created_at,
      e.actor_id,
      NULLIF(trim(COALESCE(e.payload->>'reason', '')), '')
    INTO v_action, v_moderated_at, v_moderated_by, v_reason
    FROM public.product_review_moderation_events e
    WHERE e.review_id = p_review_id
    ORDER BY e.created_at DESC
    LIMIT 1;

    v_status := CASE lower(COALESCE(v_action, ''))
      WHEN 'review_approve' THEN 'approved'::public.product_review_status
      WHEN 'approve' THEN 'approved'::public.product_review_status
      WHEN 'review_reject' THEN 'rejected'::public.product_review_status
      WHEN 'reject' THEN 'rejected'::public.product_review_status
      WHEN 'review_flag' THEN 'flagged'::public.product_review_status
      WHEN 'flag' THEN 'flagged'::public.product_review_status
      WHEN 'review_edit' THEN 'pending'::public.product_review_status
      WHEN 'edit' THEN 'pending'::public.product_review_status
      ELSE 'approved'::public.product_review_status
    END;
  END IF;

  UPDATE public.product_reviews r
  SET
    status = v_status,
    moderated_at = CASE WHEN v_has_open_flag THEN r.moderated_at ELSE COALESCE(v_moderated_at, r.moderated_at) END,
    moderated_by = CASE WHEN v_has_open_flag THEN r.moderated_by ELSE COALESCE(v_moderated_by, r.moderated_by) END,
    status_reason = CASE
      WHEN v_has_open_flag THEN r.status_reason
      WHEN v_reason IS NOT NULL THEN v_reason
      ELSE r.status_reason
    END,
    updated_at = NOW()
  WHERE r.id = p_review_id;

  RETURN v_status;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5) Triggers : garder product_reviews.status synchronisé automatiquement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_product_review_moderation_event_sync_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_product_review_status(NEW.review_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_review_moderation_event_sync_status
  ON public.product_review_moderation_events;

CREATE TRIGGER trg_product_review_moderation_event_sync_status
  AFTER INSERT ON public.product_review_moderation_events
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_product_review_moderation_event_sync_status();

CREATE OR REPLACE FUNCTION public.trg_product_review_flag_sync_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_product_review_status(COALESCE(NEW.review_id, OLD.review_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_product_review_flag_sync_status
  ON public.product_review_flags;

CREATE TRIGGER trg_product_review_flag_sync_status
  AFTER INSERT OR UPDATE OR DELETE ON public.product_review_flags
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_product_review_flag_sync_status();

-- -----------------------------------------------------------------------------
-- 6) Backfill : tous les avis existants
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.product_reviews LOOP
    PERFORM public.recompute_product_review_status(r.id);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 7) Recalcul des agrégats produit (product_statistics + user_products)
--     Uniquement sur les avis approuvés
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_all_product_review_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  v_avg numeric;
  v_count integer;
BEGIN
  FOR p IN
    SELECT DISTINCT product_id
    FROM public.product_reviews
    WHERE product_id IS NOT NULL
  LOOP
    SELECT
      COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
      COUNT(*)::integer
    INTO v_avg, v_count
    FROM public.product_reviews
    WHERE product_id = p.product_id
      AND status = 'approved';

    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'product_statistics_product_id_key'
        AND conrelid = 'public.product_statistics'::regclass
    ) OR EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'product_statistics'
        AND indexdef ILIKE '%UNIQUE%product_id%'
    ) THEN
      INSERT INTO public.product_statistics (product_id, average_rating, review_count, updated_at)
      VALUES (p.product_id, v_avg, v_count, NOW())
      ON CONFLICT (product_id)
      DO UPDATE SET
        average_rating = EXCLUDED.average_rating,
        review_count = EXCLUDED.review_count,
        updated_at = EXCLUDED.updated_at;
    ELSE
      UPDATE public.product_statistics
      SET
        average_rating = v_avg,
        review_count = v_count,
        updated_at = NOW()
      WHERE product_id = p.product_id;

      IF NOT FOUND THEN
        INSERT INTO public.product_statistics (product_id, average_rating, review_count, updated_at)
        VALUES (p.product_id, v_avg, v_count, NOW());
      END IF;
    END IF;

    UPDATE public.user_products
    SET
      rating = v_avg,
      total_reviews = v_count,
      updated_at = NOW()
    WHERE id = p.product_id;
  END LOOP;
END;
$$;

SELECT public.sync_all_product_review_statistics();

COMMIT;

-- =============================================================================
-- Vérifications rapides (optionnel, après COMMIT) :
--
-- SELECT status, COUNT(*) FROM public.product_reviews GROUP BY status ORDER BY status;
-- SELECT id, status, moderated_at FROM public.product_reviews ORDER BY created_at DESC LIMIT 20;
-- =============================================================================
