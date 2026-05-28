-- ============================================
-- MIGRATION - Marketing et Promotions
-- Pour mettre à jour les tables existantes
-- ============================================

-- 1. Supprimer les tables existantes si nécessaire (ATTENTION: perte de données)
-- Décommenter si vous voulez repartir de zéro
/*
DROP TABLE IF EXISTS promotion_usage CASCADE;
DROP TABLE IF EXISTS boosting_performance CASCADE;
DROP TABLE IF EXISTS boosting_pricing CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS boosting_campaigns CASCADE;
DROP TABLE IF EXISTS boosting_services CASCADE;
*/

-- 2. Ajouter les colonnes manquantes si les tables existent déjà

-- Ajouter la colonne code à promotions si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' 
    AND column_name = 'code'
  ) THEN
    ALTER TABLE promotions ADD COLUMN code VARCHAR(50) UNIQUE;
  END IF;
END $$;

-- Ajouter description à promotions si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE promotions ADD COLUMN description TEXT;
  END IF;
END $$;

-- Ajouter usage_limit_per_user si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' 
    AND column_name = 'usage_limit_per_user'
  ) THEN
    ALTER TABLE promotions ADD COLUMN usage_limit_per_user INTEGER DEFAULT 1;
  END IF;
END $$;

-- Ajouter is_auto_apply si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' 
    AND column_name = 'is_auto_apply'
  ) THEN
    ALTER TABLE promotions ADD COLUMN is_auto_apply BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Ajouter applicable_vendors si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' 
    AND column_name = 'applicable_vendors'
  ) THEN
    ALTER TABLE promotions ADD COLUMN applicable_vendors JSONB DEFAULT '[]';
  END IF;
END $$;

-- 3. Créer l'index sur code si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' 
    AND column_name = 'code'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Vérifier les colonnes de la table promotions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'promotions'
ORDER BY ordinal_position;
