-- Ajout de la colonne category à la table user_messages
-- Objectif: activer les filtres/export "Catégorie" côté UI (super-admin / client / vendeur)
-- Exécution: Supabase SQL editor ou migration

BEGIN;

-- 1) Ajout de la colonne (nullable au départ pour compatibilité)
ALTER TABLE public.user_messages
ADD COLUMN IF NOT EXISTS category text;

-- 2) Backfill des lignes existantes (par défaut: general)
UPDATE public.user_messages
SET category = 'general'
WHERE category IS NULL;

-- 3) Default pour les nouvelles lignes
ALTER TABLE public.user_messages
ALTER COLUMN category SET DEFAULT 'general';

-- 4) Contrainte de valeurs autorisées
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_messages_category_check'
  ) THEN
    ALTER TABLE public.user_messages
    ADD CONSTRAINT user_messages_category_check
    CHECK (category IN ('support', 'technical', 'billing', 'general', 'account'));
  END IF;
END $$;

-- 5) Index (utile si tu filtres beaucoup par catégorie)
CREATE INDEX IF NOT EXISTS user_messages_category_idx
ON public.user_messages (category);

COMMIT;
