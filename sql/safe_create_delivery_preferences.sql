-- ============================================================
-- Table: delivery_preferences
-- Date : 2026-02-10
-- Objectif:
-- - Stocker les préférences de livraison par client.
-- - Supporter la persistance des champs checkout (zone/mode/agrégation + geo) utilisés par le panier.
-- Script SAFE / idempotent.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'delivery_preferences'
  ) THEN
    CREATE TABLE public.delivery_preferences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

      -- Préférences "générales" (déjà consommées par l'API /api/client/deliveries/preferences)
      preferred_time_window text NOT NULL DEFAULT '9h-18h',
      contact_before_delivery boolean NOT NULL DEFAULT true,
      leave_at_door boolean NOT NULL DEFAULT false,
      require_signature boolean NOT NULL DEFAULT true,
      notification_channels jsonb NOT NULL DEFAULT '{"email": true, "sms": false, "push": true, "soundAlerts": true, "vibrationAlerts": false, "gpsTracking": true}'::jsonb,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

      -- Champs checkout (utilisés côté panier/livraison)
      checkout_zone text,
      checkout_method text,
      checkout_aggregation text,

      checkout_geo_local_district text,
      checkout_geo_department text,
      checkout_geo_city text,
      checkout_geo_arrondissement text,
      checkout_geo_district text,
      checkout_geo_country text,
      checkout_geo_region_department text,

      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),

      CONSTRAINT delivery_preferences_customer_unique UNIQUE (customer_id)
    );

    CREATE INDEX IF NOT EXISTS idx_delivery_preferences_customer
      ON public.delivery_preferences(customer_id);
  END IF;

  -- Ajouts SAFE si la table existe déjà, pour compatibilité avec versions précédentes
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'delivery_preferences'
  ) THEN
    ALTER TABLE public.delivery_preferences
      ADD COLUMN IF NOT EXISTS preferred_time_window text,
      ADD COLUMN IF NOT EXISTS contact_before_delivery boolean,
      ADD COLUMN IF NOT EXISTS leave_at_door boolean,
      ADD COLUMN IF NOT EXISTS require_signature boolean,
      ADD COLUMN IF NOT EXISTS notification_channels jsonb,
      ADD COLUMN IF NOT EXISTS metadata jsonb,

      ADD COLUMN IF NOT EXISTS checkout_zone text,
      ADD COLUMN IF NOT EXISTS checkout_method text,
      ADD COLUMN IF NOT EXISTS checkout_aggregation text,

      ADD COLUMN IF NOT EXISTS checkout_geo_local_district text,
      ADD COLUMN IF NOT EXISTS checkout_geo_department text,
      ADD COLUMN IF NOT EXISTS checkout_geo_city text,
      ADD COLUMN IF NOT EXISTS checkout_geo_arrondissement text,
      ADD COLUMN IF NOT EXISTS checkout_geo_district text,
      ADD COLUMN IF NOT EXISTS checkout_geo_country text,
      ADD COLUMN IF NOT EXISTS checkout_geo_region_department text,

      ADD COLUMN IF NOT EXISTS created_at timestamptz,
      ADD COLUMN IF NOT EXISTS updated_at timestamptz;

    CREATE INDEX IF NOT EXISTS idx_delivery_preferences_customer
      ON public.delivery_preferences(customer_id);
  END IF;
END $$;
