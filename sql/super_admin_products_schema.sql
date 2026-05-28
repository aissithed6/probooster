-- ============================================================
-- Schéma produits unifié (super admin / admin / vendeurs)
-- Date : 2025-10-29
-- ============================================================

-- 1. Types utilitaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
    WHERE typ.typname = 'product_status'
      AND nsp.nspname = 'public'
  ) THEN
    CREATE TYPE public.product_status AS ENUM (
      'draft',
      'pending_review',
      'active',
      'inactive',
      'archived',
      'rejected'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
    WHERE typ.typname = 'product_source'
      AND nsp.nspname = 'public'
  ) THEN
    CREATE TYPE public.product_source AS ENUM (
      'vendor',
      'admin',
      'super_admin'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Table principale user_products
CREATE TABLE IF NOT EXISTS public.user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  source public.product_source NOT NULL DEFAULT 'vendor',

  name text NOT NULL,
  slug text UNIQUE,
  description text,
  short_description text,
  sku text,
  barcode text,

  price numeric(12,2) NOT NULL,
  sale_price numeric(12,2),
  cost_price numeric(12,2),
  currency char(3) NOT NULL DEFAULT 'XOF',

  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  manage_stock boolean NOT NULL DEFAULT true,
  allow_backorders boolean NOT NULL DEFAULT false,

  product_status public.product_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  is_bundle boolean NOT NULL DEFAULT false,
  is_virtual boolean NOT NULL DEFAULT false,
  is_downloadable boolean NOT NULL DEFAULT false,

  weight numeric(10,2),
  length numeric(10,2),
  width numeric(10,2),
  height numeric(10,2),

  shipping_class text,
  shipping_cost numeric(10,2),
  free_shipping boolean NOT NULL DEFAULT false,

  seo_title text,
  seo_description text,
  seo_keywords text,
  seo_slug text,

  tags text[],
  attributes jsonb,
  metadata jsonb,

  published_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_products
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source public.product_source NOT NULL DEFAULT 'vendor',
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS price numeric(12,2),
  ADD COLUMN IF NOT EXISTS sale_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS cost_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency char(3) DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS manage_stock boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_backorders boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS product_status public.product_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bundle boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_virtual boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_downloadable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS weight numeric(10,2),
  ADD COLUMN IF NOT EXISTS length numeric(10,2),
  ADD COLUMN IF NOT EXISTS width numeric(10,2),
  ADD COLUMN IF NOT EXISTS height numeric(10,2),
  ADD COLUMN IF NOT EXISTS shipping_class text,
  ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS seo_slug text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS attributes jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.user_products
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN stock_quantity SET NOT NULL,
  ALTER COLUMN low_stock_threshold SET NOT NULL,
  ALTER COLUMN manage_stock SET NOT NULL,
  ALTER COLUMN allow_backorders SET NOT NULL,
  ALTER COLUMN product_status SET NOT NULL,
  ALTER COLUMN is_featured SET NOT NULL,
  ALTER COLUMN is_bundle SET NOT NULL,
  ALTER COLUMN is_virtual SET NOT NULL,
  ALTER COLUMN is_downloadable SET NOT NULL,
  ALTER COLUMN free_shipping SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_products_vendor_sku
  ON public.user_products(vendor_id, sku)
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_products_status
  ON public.user_products(product_status);

CREATE INDEX IF NOT EXISTS idx_user_products_featured
  ON public.user_products(is_featured) WHERE is_featured;

CREATE INDEX IF NOT EXISTS idx_user_products_vendor
  ON public.user_products(vendor_id);

DROP TRIGGER IF EXISTS trg_user_products_updated_at ON public.user_products;
CREATE TRIGGER trg_user_products_updated_at
  BEFORE UPDATE ON public.user_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Médias produits
CREATE TABLE IF NOT EXISTS public.product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  bucket text NOT NULL DEFAULT 'product-assets',
  path text NOT NULL,
  type text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_media_product
  ON public.product_media(product_id);

DROP TRIGGER IF EXISTS trg_product_media_updated_at ON public.product_media;
CREATE TRIGGER trg_product_media_updated_at
  BEFORE UPDATE ON public.product_media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Catégories & association
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER trg_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.product_category_assignments (
  product_id uuid REFERENCES public.user_products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_category_assignments_category
  ON public.product_category_assignments(category_id);

-- 5. Tags
CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_product_tags_updated_at ON public.product_tags;
CREATE TRIGGER trg_product_tags_updated_at
  BEFORE UPDATE ON public.product_tags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.product_tag_assignments (
  product_id uuid REFERENCES public.user_products(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_tag
  ON public.product_tag_assignments(tag_id);

-- 6. Variations (SKU enfants)
CREATE TABLE IF NOT EXISTS public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  name text,
  sku text,
  price numeric(12,2),
  sale_price numeric(12,2),
  stock_quantity integer,
  attributes jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variations_sku
  ON public.product_variations(sku) WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variations_product
  ON public.product_variations(product_id);

DROP TRIGGER IF EXISTS trg_product_variations_updated_at ON public.product_variations;
CREATE TRIGGER trg_product_variations_updated_at
  BEFORE UPDATE ON public.product_variations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Statistiques
CREATE TABLE IF NOT EXISTS public.product_statistics (
  product_id uuid PRIMARY KEY REFERENCES public.user_products(id) ON DELETE CASCADE,
  total_views bigint NOT NULL DEFAULT 0,
  total_sales bigint NOT NULL DEFAULT 0,
  total_revenue numeric(14,2) NOT NULL DEFAULT 0,
  average_rating numeric(4,2),
  review_count integer NOT NULL DEFAULT 0,
  share_count integer NOT NULL DEFAULT 0,
  wishlist_count integer NOT NULL DEFAULT 0,
  last_order_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_product_statistics_updated_at ON public.product_statistics;
CREATE TRIGGER trg_product_statistics_updated_at
  BEFORE UPDATE ON public.product_statistics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Logs de modération
CREATE TABLE IF NOT EXISTS public.product_moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_status public.product_status,
  new_status public.product_status,
  reason text,
  moderator_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_moderation_logs_product
  ON public.product_moderation_logs(product_id);

-- 9. Tables auxiliaires (favoris, recommandations)
CREATE TABLE IF NOT EXISTS public.product_favorites (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.user_products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  score numeric(10,4) NOT NULL DEFAULT 0,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_product
  ON public.product_recommendations(product_id);

DROP TRIGGER IF EXISTS trg_product_recommendations_updated_at ON public.product_recommendations;
CREATE TRIGGER trg_product_recommendations_updated_at
  BEFORE UPDATE ON public.product_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Vues/agrégations à prévoir (TODO)
-- - vue "products_with_stats" combinant user_products + stats + vendeur
-- - vue "public_products_catalog" pour exposition côté client
-- - vue "vendor_products_overview" pour dashboard vendeur

-- 11. RLS (à activer après remplissage)
-- ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ...

-- 12. Résumé
DO $$
BEGIN
  RAISE NOTICE '✅ Schéma produits unifié appliqué.';
END $$;
