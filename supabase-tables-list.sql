-- ============================================
-- SCRIPT SQL POUR LISTER LES TABLES SUPABASE
-- ============================================
-- À exécuter dans Supabase SQL Editor

-- 1. Liste de toutes les tables dans le schéma public
SELECT
  schemaname as schema_name,
  tablename as table_name,
  tableowner as owner,
  tablespace as tablespace,
  hasindexes as has_indexes,
  hasrules as has_rules,
  hastriggers as has_triggers,
  rowsecurity as row_security_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- AUTRES INFORMATIONS UTILES
-- ============================================

-- 2. Liste des colonnes de chaque table
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 3. Liste des vues
SELECT
  schemaname as schema_name,
  viewname as view_name,
  viewowner as owner,
  definition as view_definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- 4. Liste des politiques RLS (Row Level Security)
SELECT
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  permissive as is_permissive,
  roles as target_roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Liste des fonctions
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prokind as function_kind,
  obj_description(p.oid, 'pg_proc') as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')  -- functions and procedures
ORDER BY p.proname;

-- 6. Informations sur les index
SELECT
  schemaname as schema_name,
  tablename as table_name,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. Taille des tables (approximative)
SELECT
  schemaname as schema_name,
  tablename as table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- RÉSUMÉ RAPIDE POUR DEBUGGING
-- ============================================

/*
📋 RÉSUMÉ - À exécuter individuellement :

1. Liste des tables :
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

2. Tables manquantes pour le composant :
   - boosting_services
   - boosting_campaigns

3. Tables qui devraient exister selon les types :
   - users, user_profiles, products, promotions, categories,
     user_orders, user_notifications, etc.

4. Pour créer les tables manquantes, utilisez le script :
   supabase-setup-script.sql

5. Pour analyser les permissions, utilisez le composant :
   supabase-schema-analyzer.tsx
*/
