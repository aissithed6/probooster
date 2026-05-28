-- ============================================
-- SCRIPT DE CRÉATION DES TABLES MANQUANTES
-- ============================================
-- À exécuter dans Supabase SQL Editor

-- 1. Création de la table boosting_services
CREATE TABLE IF NOT EXISTS boosting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('recommendation', 'banner', 'whatsapp', 'social', 'email')),
  base_price DECIMAL(10,2) NOT NULL,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('per_page_day', 'per_message_country', 'fixed')),
  is_active BOOLEAN DEFAULT true,
  features TEXT[],
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Si la table existe déjà, s'assurer que les colonnes attendues existent (idempotence)
ALTER TABLE boosting_services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE boosting_services ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE boosting_services ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE boosting_services ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE boosting_services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE boosting_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- 2. Création de la table boosting_campaigns
CREATE TABLE IF NOT EXISTS boosting_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES boosting_services(id),
  type TEXT NOT NULL CHECK (type IN ('recommendation', 'banner', 'whatsapp', 'social', 'email')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'completed', 'rejected')),
  start_date DATE,
  end_date DATE,
  target_pages TEXT[],
  duration INTEGER,
  total_cost DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  payment_method TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejected_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Modification de la table promotions existante
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping'));
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT 100;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS applicable_products TEXT[];
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS applicable_categories TEXT[];
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS conditions TEXT;

-- 4. Table de file technique pour notifications multi-canaux (Email/Push)
CREATE TABLE IF NOT EXISTS notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'failed')),
  payload JSONB NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Templates Email (transactionnels/marketing) - source de vérité DB
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'transactional' CHECK (category IN ('transactional', 'marketing', 'system')),
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS html TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notification_jobs_status_created_at
  ON notification_jobs (status, created_at);

CREATE INDEX IF NOT EXISTS idx_notification_jobs_channel_status
  ON notification_jobs (channel, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_key_unique
  ON email_templates (key);

CREATE INDEX IF NOT EXISTS idx_email_templates_category_active
  ON email_templates (category, is_active);

-- ============================================
-- CONFIGURATION DES POLITIQUES RLS
-- ============================================

-- 1. Politique pour boosting_services
ALTER TABLE boosting_services ENABLE ROW LEVEL SECURITY;

-- Les super-admins peuvent gérer les templates email
DROP POLICY IF EXISTS "Super admins can manage email_templates" ON email_templates;
CREATE POLICY "Super admins can manage email_templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Les admins peuvent tout faire
DROP POLICY IF EXISTS "Admins can manage boosting_services" ON boosting_services;
CREATE POLICY "Admins can manage boosting_services" ON boosting_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les utilisateurs peuvent voir les services actifs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boosting_services'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.boosting_services ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view active boosting_services" ON boosting_services;
CREATE POLICY "Users can view active boosting_services" ON boosting_services
  FOR SELECT USING (is_active = true);

-- Les vendeurs peuvent créer des services
DROP POLICY IF EXISTS "Vendors can create boosting_services" ON boosting_services;
CREATE POLICY "Vendors can create boosting_services" ON boosting_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

-- 2. Politique pour boosting_campaigns
ALTER TABLE boosting_campaigns ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage boosting_campaigns" ON boosting_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les vendeurs peuvent voir et gérer leurs propres campagnes
CREATE POLICY "Vendors can manage own campaigns" ON boosting_campaigns
  FOR ALL USING (vendor_id = auth.uid());

-- Les vendeurs peuvent créer des campagnes
CREATE POLICY "Vendors can create campaigns" ON boosting_campaigns
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

-- Tout le monde peut voir les campagnes approuvées
CREATE POLICY "Everyone can view approved campaigns" ON boosting_campaigns
  FOR SELECT USING (status IN ('active', 'completed'));

-- 3. Politique pour promotions (mettre à jour si nécessaire)
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage promotions" ON promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les vendeurs peuvent gérer leurs propres promotions
CREATE POLICY "Vendors can manage own promotions" ON promotions
  FOR ALL USING (vendor_id = auth.uid() OR vendor_id IS NULL);

-- Tout le monde peut voir les promotions actives
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE POLICY "Everyone can view active promotions" ON promotions
  FOR SELECT USING (is_active = true);

-- ============================================
-- INSERTION DE DONNÉES DE TEST
-- ============================================

-- Insertion de services de test
INSERT INTO boosting_services (name, description, type, base_price, pricing_model, features, status)
VALUES
  (
    'Boost Recommandation',
    'Mise en avant sur la page d''accueil et produits recommandés',
    'recommendation',
    5000.00,
    'per_page_day',
    ARRAY['Page d''accueil', 'Produits recommandés', 'Durée 7 jours'],
    'available'
  ),
  (
    'Boost Bannière',
    'Bannières publicitaires sur le site',
    'banner',
    10000.00,
    'per_page_day',
    ARRAY['Bannières visuelles', 'Ciblage par page', 'Durée personnalisable'],
    'available'
  ),
  (
    'Boost WhatsApp',
    'Promotion via WhatsApp Business',
    'whatsapp',
    15000.00,
    'per_message_country',
    ARRAY['Messages ciblés', 'Ciblage géographique', 'Suivi des conversions'],
    'available'
  );

-- Insertion de campagnes de test (nécessite des utilisateurs existants)
-- Note: Remplacez 'user-id-here' par de vrais IDs d'utilisateurs
-- INSERT INTO boosting_campaigns (vendor_id, service_id, type, status, total_cost, payment_status)
-- VALUES
--   ('user-id-here', (SELECT id FROM boosting_services WHERE type = 'recommendation' LIMIT 1), 'recommendation', 'active', 5000.00, 'paid'),
--   ('user-id-here', (SELECT id FROM boosting_services WHERE type = 'banner' LIMIT 1), 'banner', 'pending', 10000.00, 'pending');

-- ============================================
-- VÉRIFICATION DES TABLES CRÉÉES
-- ============================================

-- Vérifier les tables créées
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('boosting_services', 'boosting_campaigns')
ORDER BY tablename;

-- Vérifier les politiques RLS créées
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('boosting_services', 'boosting_campaigns', 'promotions')
ORDER BY tablename, policyname;

-- ============================================
-- RÉSUMÉ
-- ============================================
/*
RÉSUMÉ DE L'EXÉCUTION :

✅ Tables créées :
   - boosting_services (services de boostage)
   - boosting_campaigns (campagnes de boostage)

✅ Politiques RLS configurées :
   - Admins : accès complet
   - Vendeurs : gestion de leurs propres données
   - Utilisateurs : lecture des données publiques

✅ Données de test insérées :
   - 3 services de boostage disponibles

🚀 Prochaines étapes :
   1. Insérer des données de test avec de vrais user_id
   2. Tester le composant Marketing & Promotions
   3. Ajuster les politiques RLS si nécessaire

Le composant devrait maintenant fonctionner parfaitement !
*/
