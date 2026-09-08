-- MIGRATION : 20260909000002_seed_default_roles.sql
-- Insère les rôles par défaut avec leurs sections et fonctionnalités

-- Sections disponibles dans le Super Admin Dashboard
-- overview, users, products, orders, deliveries, financial, marketing, loyalty,
-- shares-engagement, messaging, reviews, notifications, settings, automation,
-- analytics, design, messages-conseils, support-videos, seller-applications

-- Rôle: Gestionnaire des commandes et des ventes
INSERT INTO public.role_definitions (role_code, role_name, description, is_system, sections, features)
VALUES (
  'order_manager',
  'Gestionnaire des commandes et des ventes',
  'Gère les commandes, les ventes et le suivi des transactions',
  true,
  ARRAY['overview', 'orders', 'deliveries', 'reviews', 'messaging', 'notifications'],
  ARRAY[
    'view_orders', 'edit_orders', 'cancel_orders', 'refund_orders',
    'view_deliveries', 'track_deliveries',
    'view_reviews', 'respond_reviews',
    'send_messages', 'view_notifications'
  ]
)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Rôle: Superviseur des livraisons
INSERT INTO public.role_definitions (role_code, role_name, description, is_system, sections, features)
VALUES (
  'delivery_supervisor',
  'Superviseur des livraisons',
  'Supervise et suit les livraisons, coordonne les livreurs',
  true,
  ARRAY['overview', 'deliveries', 'orders', 'notifications', 'messaging'],
  ARRAY[
    'view_deliveries', 'assign_deliveries', 'track_deliveries', 'update_delivery_status',
    'view_orders', 'view_delivery_reports',
    'send_messages', 'view_notifications',
    'manage_drivers'
  ]
)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Rôle: Responsable marketing
INSERT INTO public.role_definitions (role_code, role_name, description, is_system, sections, features)
VALUES (
  'marketing_manager',
  'Responsable marketing',
  'Gère les promotions, le marketing et l''engagement des utilisateurs',
  true,
  ARRAY['overview', 'marketing', 'loyalty', 'shares-engagement', 'users', 'notifications', 'analytics'],
  ARRAY[
    'view_marketing', 'create_promotions', 'edit_promotions', 'delete_promotions',
    'view_loyalty', 'manage_points',
    'view_shares', 'view_engagement',
    'view_users', 'send_notifications',
    'view_analytics'
  ]
)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Rôle: Responsable finance
INSERT INTO public.role_definitions (role_code, role_name, description, is_system, sections, features)
VALUES (
  'finance_manager',
  'Responsable finance',
  'Gère les finances, les paiements et les rapports financiers',
  true,
  ARRAY['overview', 'financial', 'orders', 'users', 'analytics', 'notifications'],
  ARRAY[
    'view_financial', 'view_reports', 'manage_payouts',
    'view_orders', 'view_transactions',
    'view_users', 'view_user_transactions',
    'view_analytics', 'export_reports',
    'send_notifications'
  ]
)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Rôle: Super Admin (toutes les sections et fonctionnalités)
INSERT INTO public.role_definitions (role_code, role_name, description, is_system, sections, features)
VALUES (
  'super_admin',
  'Super Admin',
  'Accès complet à toutes les sections et fonctionnalités',
  true,
  ARRAY[
    'overview', 'users', 'products', 'orders', 'deliveries', 'financial',
    'marketing', 'loyalty', 'shares-engagement', 'messaging', 'reviews',
    'notifications', 'settings', 'automation', 'analytics', 'design',
    'messages-conseils', 'support-videos', 'seller-applications'
  ],
  ARRAY['all_features']
)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  features = EXCLUDED.features,
  updated_at = NOW();