-- MIGRATION : 20260909000005_add_admin_role.sql
-- Ajoute le rôle 'admin' dans role_definitions (pour ceux qui ont déjà
-- exécuté 20260909000003). Idempotent.

INSERT INTO public.role_definitions (role_code, role_name, description, is_system, sections, features)
VALUES (
  'admin',
  'Admin',
  'Administration générale : produits, commandes, utilisateurs et modération (sans finances ni configuration système)',
  true,
  ARRAY['overview','users','products','orders','deliveries','reviews','messaging','notifications'],
  ARRAY['view_users','edit_users','view_products','edit_products','view_orders','edit_orders','cancel_orders','view_deliveries','track_deliveries','view_reviews','respond_reviews','send_messages','view_notifications']
)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  features = EXCLUDED.features,
  updated_at = NOW();