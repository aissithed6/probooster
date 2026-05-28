-- Script SQL safe: ajoute la colonne overall_rank dans rankings si elle n'existe pas.
-- Compatible PostgreSQL (Supabase)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rankings'
      AND column_name = 'overall_rank'
  ) THEN
    ALTER TABLE public.rankings
      ADD COLUMN overall_rank integer;
  END IF;
END $$;
