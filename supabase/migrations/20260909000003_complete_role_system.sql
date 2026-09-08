-- MIGRATION : 20260909000003_complete_role_system.sql
-- Crée le système complet de gestion des rôles

-- 1. AJOUT DES NOUVEAUX RÔLES DANS LA CONTRAINTE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT users_role_check';
  END IF;
END $$;

ALTER TABLE public.users ADD CONSTRAINT users_role_check
CHECK (role IN ('client','vendor','admin','super_admin','driver','ops','order_manager','delivery_supervisor','marketing_manager','finance_manager'));

-- 2. FONCTION set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- 3. TABLE role_definitions
CREATE TABLE IF NOT EXISTS public.role_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT UNIQUE NOT NULL,
  role_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sections TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE user_role_assignments
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL,
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_code)
);

-- 5. INDEX
CREATE INDEX IF NOT EXISTS idx_role_definitions_role_code ON public.role_definitions(role_code);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);

-- 6. TRIGGER
DROP TRIGGER IF EXISTS set_role_definitions_updated_at ON public.role_definitions;
CREATE TRIGGER set_role_definitions_updated_at BEFORE UPDATE ON public.role_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. RLS
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin can manage role_definitions" ON public.role_definitions;
CREATE POLICY "Super Admin can manage role_definitions" ON public.role_definitions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "Super Admin can manage user_role_assignments" ON public.user_role_assignments;
CREATE POLICY "Super Admin can manage user_role_assignments" ON public.user_role_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'));

-- 8. RÔLES PAR DÉFAUT
INSERT INTO public.role_definitions (role_code, role_name, description, is_system, sections, features) VALUES
  ('order_manager', 'Gestionnaire des commandes et des ventes', 'Gère les commandes et ventes', true,
   ARRAY['overview','orders','deliveries','reviews','messaging','notifications'],
   ARRAY['view_orders','edit_orders','cancel_orders','refund_orders','view_deliveries','track_deliveries','view_reviews','respond_reviews','send_messages','view_notifications']),
  ('delivery_supervisor', 'Superviseur des livraisons', 'Supervise les livraisons', true,
   ARRAY['overview','deliveries','orders','notifications','messaging'],
   ARRAY['view_deliveries','assign_deliveries','track_deliveries','update_delivery_status','view_orders','view_delivery_reports','send_messages','view_notifications','manage_drivers']),
  ('marketing_manager', 'Responsable marketing', 'Gère le marketing et les promotions', true,
   ARRAY['overview','marketing','loyalty','shares-engagement','users','notifications','analytics'],
   ARRAY['view_marketing','create_promotions','edit_promotions','delete_promotions','view_loyalty','manage_points','view_shares','view_engagement','view_users','send_notifications','view_analytics']),
  ('finance_manager', 'Responsable finance', 'Gère les finances et les paiements', true,
   ARRAY['overview','financial','orders','users','analytics','notifications'],
   ARRAY['view_financial','view_reports','manage_payouts','view_orders','view_transactions','view_users','view_user_transactions','view_analytics','export_reports','send_notifications']),
  ('super_admin', 'Super Admin', 'Accès complet', true,
   ARRAY['overview','users','products','orders','deliveries','financial','marketing','loyalty','shares-engagement','messaging','reviews','notifications','settings','automation','analytics','design','messages-conseils','support-videos','seller-applications'],
   ARRAY['all_features'])
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  features = EXCLUDED.features,
  updated_at = NOW();