-- Ajout des champs de remise et de planification aux promotions spéciales
-- Table: public.special_promotions

ALTER TABLE public.special_promotions
  ADD COLUMN IF NOT EXISTS start_date timestamptz NULL,
  ADD COLUMN IF NOT EXISTS discount_type text NULL,
  ADD COLUMN IF NOT EXISTS discount_value numeric NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'special_promotions_discount_type_check'
  ) THEN
    ALTER TABLE public.special_promotions
      ADD CONSTRAINT special_promotions_discount_type_check
      CHECK (
        discount_type IS NULL
        OR discount_type IN ('percentage', 'fixed', 'free_shipping')
      );
  END IF;
END $$;

ALTER TABLE public.special_promotions
  ALTER COLUMN start_date SET DEFAULT now(),
  ALTER COLUMN discount_type SET DEFAULT 'percentage',
  ALTER COLUMN discount_value SET DEFAULT 0;

UPDATE public.special_promotions
SET
  start_date = COALESCE(start_date, created_at, now()),
  discount_type = COALESCE(discount_type, 'percentage'),
  discount_value = COALESCE(discount_value, 0)
WHERE start_date IS NULL OR discount_type IS NULL OR discount_value IS NULL;

CREATE INDEX IF NOT EXISTS idx_special_promotions_active_dates
  ON public.special_promotions (is_active, start_date, end_date);
