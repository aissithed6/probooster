-- Fix order_items.product_id foreign key to reference user_products instead of legacy products.

DO $$
BEGIN
  -- Drop old constraint if it exists (name may vary across environments).
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_order_items_product_id'
  ) THEN
    ALTER TABLE public.order_items
      DROP CONSTRAINT fk_order_items_product_id;
  END IF;

  -- Drop potential alternative FK names (safety).
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_product_id_fkey'
  ) THEN
    ALTER TABLE public.order_items
      DROP CONSTRAINT order_items_product_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  -- Recreate FK towards the actual product table used by the app.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_order_items_product_id'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT fk_order_items_product_id
      FOREIGN KEY (product_id)
      REFERENCES public.user_products(id)
      ON DELETE SET NULL;
  END IF;
END $$;
