-- MIGRATION : 20260909000001_create_role_management.sql
-- Crée les tables pour la gestion des rôles et permissions

-- Table des définitions de rôles avec leurs sections et fonctionnalités
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

-- Table des permissions par rôle
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_code, permission_code)
);

-- Table des attributions de rôles aux utilisateurs
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL,
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_code)
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_role_definitions_role_code ON public.role_definitions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_code ON public.role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_code ON public.user_role_assignments(role_code);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_role_definitions_updated_at ON public.role_definitions;
CREATE TRIGGER set_role_definitions_updated_at
  BEFORE UPDATE ON public.role_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Politiques Seul le Super Admin peut gérer les rôles
CREATE POLICY "Super Admin can manage role_definitions"
  ON public.role_definitions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can manage role_permissions"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can manage user_role_assignments"
  ON public.user_role_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );