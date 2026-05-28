-- ============================================
-- Ajouter Super Admin: asthedio@gmail.com
-- ============================================

-- 1. Mettre à jour le rôle de l'utilisateur existant
UPDATE users 
SET role = 'super_admin',
    updated_at = NOW()
WHERE email = 'asthedio@gmail.com';

-- 2. Si l'utilisateur n'existe pas encore, le créer
-- (Décommenter si nécessaire)
/*
INSERT INTO users (email, role, created_at, updated_at)
VALUES ('asthedio@gmail.com', 'super_admin', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = 'super_admin', updated_at = NOW();
*/

-- 3. Vérifier que le rôle a été mis à jour
SELECT id, email, role, created_at, updated_at 
FROM users 
WHERE email = 'asthedio@gmail.com';

-- ============================================
-- Résultat attendu:
-- email: asthedio@gmail.com
-- role: super_admin
-- ============================================
