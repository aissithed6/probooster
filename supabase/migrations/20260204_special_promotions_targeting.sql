ALTER TABLE public.special_promotions
  ADD COLUMN IF NOT EXISTS applicable_products text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_vendors text[] NOT NULL DEFAULT '{}';

UPDATE public.special_promotions
SET
  applicable_products = COALESCE(applicable_products, '{}'),
  applicable_categories = COALESCE(applicable_categories, '{}'),
  applicable_vendors = COALESCE(applicable_vendors, '{}')
WHERE applicable_products IS NULL OR applicable_categories IS NULL OR applicable_vendors IS NULL;

CREATE INDEX IF NOT EXISTS idx_special_promotions_applicable_products_gin
  ON public.special_promotions USING gin (applicable_products);

CREATE INDEX IF NOT EXISTS idx_special_promotions_applicable_categories_gin
  ON public.special_promotions USING gin (applicable_categories);

CREATE INDEX IF NOT EXISTS idx_special_promotions_applicable_vendors_gin
  ON public.special_promotions USING gin (applicable_vendors);

NOTIFY pgrst, 'reload schema';
