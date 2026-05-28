-- ============================================================
-- Tables avancees produits (hybride: tables + metadata)
-- Date : 2026-02-09
-- Objectif: persister proprement les champs avances tout en gardant user_products.metadata comme fallback.
-- Script SAFE / idempotent.
-- ============================================================

DO $$
BEGIN
  -- 1) Parametres de paiement (1 ligne par produit)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_payment_settings'
  ) THEN
    CREATE TABLE public.product_payment_settings (
      product_id uuid PRIMARY KEY REFERENCES public.user_products(id) ON DELETE CASCADE,
      installment_payment boolean NOT NULL DEFAULT false,
      installment_options integer[],
      deferred_payment boolean NOT NULL DEFAULT false,
      deferred_payment_fees jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_product_payment_settings_product
      ON public.product_payment_settings(product_id);
  END IF;

  -- 2) Marketing / social (1 ligne par produit)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_marketing_settings'
  ) THEN
    CREATE TABLE public.product_marketing_settings (
      product_id uuid PRIMARY KEY REFERENCES public.user_products(id) ON DELETE CASCADE,
      social_sharing boolean NOT NULL DEFAULT false,
      social_points integer,
      referral_bonus integer,
      favorite_note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_product_marketing_settings_product
      ON public.product_marketing_settings(product_id);
  END IF;

  -- 3) Promotions / mise en avant (1 ligne par produit)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_promotion_settings'
  ) THEN
    CREATE TABLE public.product_promotion_settings (
      product_id uuid PRIMARY KEY REFERENCES public.user_products(id) ON DELETE CASCADE,
      promotion_start_date timestamptz,
      promotion_end_date timestamptz,
      promotion_auto_restore boolean NOT NULL DEFAULT false,
      featured_badge_text text,
      featured_start_date timestamptz,
      featured_end_date timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_product_promotion_settings_product
      ON public.product_promotion_settings(product_id);
  END IF;

  -- 4) Produits lies (1 ligne par produit)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_linked_products'
  ) THEN
    CREATE TABLE public.product_linked_products (
      product_id uuid PRIMARY KEY REFERENCES public.user_products(id) ON DELETE CASCADE,
      upsells uuid[] NOT NULL DEFAULT '{}',
      cross_sells uuid[] NOT NULL DEFAULT '{}',
      grouped_products uuid[] NOT NULL DEFAULT '{}',
      similar_products uuid[] NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_product_linked_products_product
      ON public.product_linked_products(product_id);
  END IF;

  -- 5) Fichiers telechargeables (0..n lignes par produit)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_downloadable_files'
  ) THEN
    CREATE TABLE public.product_downloadable_files (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
      name text NOT NULL,
      url text NOT NULL,
      expiration_date timestamptz,
      max_downloads_per_customer integer,
      max_global_downloads integer,
      source_type text NOT NULL DEFAULT 'url',
      uploaded_file_name text,
      uploaded_file_size bigint,
      uploaded_file_type text,
      uploaded_file_data_url text,
      uploaded_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_product_downloadable_files_product
      ON public.product_downloadable_files(product_id);
  END IF;

  RAISE NOTICE 'OK: tables avancees produits';
END $$;
