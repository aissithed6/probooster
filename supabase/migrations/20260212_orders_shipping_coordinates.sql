-- Adds explicit shipping coordinates to orders so delivery tracking can rely on required lat/lng fields.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'shipping_lat'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN shipping_lat double precision NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'shipping_lng'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN shipping_lng double precision NULL;
  END IF;
END $$;

-- Ensure both coordinates are provided together.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_shipping_coords_check'
  ) THEN
    ALTER TABLE public.orders
      DROP CONSTRAINT orders_shipping_coords_check;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_coords_check
  CHECK (
    (shipping_lat IS NULL AND shipping_lng IS NULL)
    OR
    (shipping_lat IS NOT NULL AND shipping_lng IS NOT NULL)
  );
