-- MIGRATION : 20260909000000_create_support_user.sql
-- Crée un utilisateur support technique pour le chat en direct
-- UUID : a1b2c3d4-e5f6-7890-abcd-ef1234567890

-- =====================================================
-- ÉTAPE 1 : Créer le support user dans auth.users
-- =====================================================
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'support@probooster.me',
  crypt('SupportProbooster2026!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Support Probooster"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ÉTAPE 2 : Créer le profil support dans public.users
-- NOTE: La table users n'a pas de first_name/last_name, seulement email et role
-- =====================================================
INSERT INTO public.users (
  id,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'support@probooster.me',
  'admin',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ÉTAPE 3 : Créer le user_profiles si la table existe
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    INSERT INTO public.user_profiles (
      id,
      user_id,
      first_name,
      last_name,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
      'Support',
      'Probooster',
      null,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
