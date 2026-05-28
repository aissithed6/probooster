-- Normalise orders.shipping_address by extracting checkout fields into dedicated columns.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'final_total'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN final_total numeric(12,2) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'points_used'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN points_used integer NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'points_discount'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN points_discount numeric(12,2) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_option'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN payment_option text NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'delivery_option'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN delivery_option text NULL;
  END IF;
END $$;

-- Backfill columns from shipping_address JSON if present.
UPDATE public.orders
SET
  final_total = COALESCE(
    final_total,
    CASE
      WHEN (shipping_address->>'final_total') ~ '^[0-9]+(\.[0-9]+)?$' THEN (shipping_address->>'final_total')::numeric
      ELSE NULL
    END
  ),
  points_used = COALESCE(
    points_used,
    CASE
      WHEN (shipping_address->>'points_used') ~ '^[0-9]+$' THEN (shipping_address->>'points_used')::integer
      ELSE NULL
    END
  ),
  points_discount = COALESCE(
    points_discount,
    CASE
      WHEN (shipping_address->>'points_discount') ~ '^[0-9]+(\.[0-9]+)?$' THEN (shipping_address->>'points_discount')::numeric
      ELSE NULL
    END
  ),
  payment_option = COALESCE(payment_option, NULLIF(shipping_address->>'payment_option', '')),
  delivery_option = COALESCE(delivery_option, NULLIF(shipping_address->>'delivery_option', ''))
WHERE shipping_address IS NOT NULL;

-- Keep only the allowed keys inside shipping_address.
UPDATE public.orders
SET shipping_address = jsonb_strip_nulls(
  jsonb_build_object(
    'customer_email', NULLIF(shipping_address->>'customer_email', ''),
    'customer_phone', NULLIF(shipping_address->>'customer_phone', ''),
    'delivery_address', NULLIF(shipping_address->>'delivery_address', ''),
    'metadata', shipping_address->'metadata'
  )
)
WHERE shipping_address IS NOT NULL;
