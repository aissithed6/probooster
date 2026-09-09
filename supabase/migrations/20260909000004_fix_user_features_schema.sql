-- MIGRATION : 20260909000004_fix_user_features_schema.sql
-- Aligne le schéma de user_features avec le code (colonne 'scope')
-- Le code (_helpers/users.ts) insère user_id, feature_code, scope, enabled
-- mais la table existante n'a que feature_scope.

-- 1. Ajouter la colonne scope manquante
ALTER TABLE public.user_features
  ADD COLUMN IF NOT EXISTS scope TEXT;

-- 2. Backfill depuis feature_scope (ancien nom) si présent
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_features'
      AND column_name = 'feature_scope'
  ) THEN
    UPDATE public.user_features
    SET scope = feature_scope
    WHERE (scope IS NULL OR scope = '')
      AND feature_scope IS NOT NULL;
  END IF;
END $$;

-- 3. Rendre feature_scope optionnelle pour ne pas casser les anciens inserts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_features'
      AND column_name = 'feature_scope'
      AND is_nullable = 'NO'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_features ALTER COLUMN feature_scope DROP NOT NULL';
  END IF;
END $$;

-- 4. Index de performance
CREATE INDEX IF NOT EXISTS idx_user_features_user_id ON public.user_features(user_id);

-- 5. Sécuriser les autres tables attendues par le code Super Admin
-- user_security_settings (colonnes attendues: two_factor_enabled, login_notifications, session_timeout)
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT false,
  login_notifications BOOLEAN DEFAULT true,
  session_timeout INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_security_settings
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.user_security_settings
  ADD COLUMN IF NOT EXISTS login_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.user_security_settings
  ADD COLUMN IF NOT EXISTS session_timeout INTEGER DEFAULT 60;

-- user_profiles (colonnes attendues par loadUserSummaryById)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}';
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS short_code TEXT;

-- user_custom_permissions (attendu: user_id, permission_code)
CREATE TABLE IF NOT EXISTS public.user_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_code)
);