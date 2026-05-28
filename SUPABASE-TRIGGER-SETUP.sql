-- 🚀 CONFIGURATION DU TRIGGER POUR LA GESTION AUTOMATIQUE DES RÔLES
-- Ce script doit être exécuté dans l'éditeur SQL de Supabase

-- =====================================================
-- 1. FONCTION POUR GÉRER LES NOUVEAUX UTILISATEURS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_metadata JSONB;
BEGIN
    -- Récupérer les métadonnées de l'utilisateur (incluant le rôle)
    user_metadata := NEW.raw_user_meta_data;
    
    -- Extraire le rôle des métadonnées, sinon utiliser 'client' par défaut
    user_role := COALESCE(user_metadata->>'role', 'client');
    
    -- Vérifier que le rôle est valide
    IF user_role NOT IN ('client', 'vendor', 'admin') THEN
        user_role := 'client';
    END IF;
    
    -- Créer l'entrée dans la table public.users avec le bon rôle
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, user_role);
    
    -- Créer automatiquement le profil utilisateur
    INSERT INTO public.user_profiles (user_id, first_name, last_name, country)
    VALUES (NEW.id, 
            COALESCE(user_metadata->>'first_name', 'Prénom'),
            COALESCE(user_metadata->>'last_name', 'Nom'),
            'Côte d''Ivoire');
    
    -- Créer automatiquement les points de fidélité
    INSERT INTO public.loyalty_points (user_id, points_balance, fcfa_value)
    VALUES (NEW.id, 0, 0.00);
    
    -- Log pour le débogage
    RAISE NOTICE 'Nouvel utilisateur créé: ID=%, Email=%, Rôle=%', NEW.id, NEW.email, user_role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CRÉATION DU TRIGGER
-- =====================================================

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger qui se déclenche après l'insertion d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. VÉRIFICATION ET TEST
-- =====================================================

-- Vérifier que la fonction a été créée
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- Vérifier que le trigger a été créé
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'on_auth_user_created';

-- =====================================================
-- 4. POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de modifier leur propre profil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre l'insertion automatique via le trigger
CREATE POLICY "Trigger can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. MESSAGE DE SUCCÈS
-- =====================================================

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ TRIGGER CONFIGURÉ AVEC SUCCÈS !';
    RAISE NOTICE '🎯 Les nouveaux utilisateurs auront automatiquement le bon rôle';
    RAISE NOTICE '🔧 Le rôle est extrait des métadonnées utilisateur';
    RAISE NOTICE '📝 Exécutez ce script dans l''éditeur SQL de Supabase';
END $$;
