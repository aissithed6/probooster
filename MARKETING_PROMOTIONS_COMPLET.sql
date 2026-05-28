-- ============================================
-- SYSTÈME MARKETING ET PROMOTIONS - SCRIPT COMPLET
-- ============================================
-- Date: 2025-10-07
-- Description: Script complet pour créer toutes les tables et permissions
-- À exécuter sur Supabase
-- ============================================

-- ============================================
-- ÉTAPE 1: SUPPRIMER LES TABLES EXISTANTES
-- ============================================
-- IMPORTANT: Décommentez ces lignes pour repartir de zéro
-- ATTENTION: Cela supprimera toutes les données!

DROP TABLE IF EXISTS promotion_usage CASCADE;
DROP TABLE IF EXISTS boosting_performance CASCADE;
DROP TABLE IF EXISTS boosting_pricing CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS boosting_campaigns CASCADE;
DROP TABLE IF EXISTS boosting_services CASCADE;

-- ============================================
-- ÉTAPE 2: CRÉER LES TABLES
-- ============================================

-- 2.1 Table des services de boostage
CREATE TABLE IF NOT EXISTS boosting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('recommendation', 'banner', 'whatsapp')),
  base_price DECIMAL(10,2) NOT NULL,
  pricing_model VARCHAR(50) NOT NULL CHECK (pricing_model IN ('per_page_day', 'per_message_country', 'fixed')),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Table des campagnes de boostage
CREATE TABLE IF NOT EXISTS boosting_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID,
  service_id UUID REFERENCES boosting_services(id) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('recommendation', 'banner', 'whatsapp')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'completed', 'rejected')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_pages JSONB DEFAULT '[]',
  duration INTEGER,
  total_cost DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Table des performances
CREATE TABLE IF NOT EXISTS boosting_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES boosting_campaigns(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- 2.4 Table des promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('coupon', 'discount', 'flash_sale', 'bundle')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_limit_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  target_audience JSONB DEFAULT '[]',
  applicable_products JSONB DEFAULT '[]',
  applicable_categories JSONB DEFAULT '[]',
  applicable_vendors JSONB DEFAULT '[]',
  is_auto_apply BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Table d'utilisation des promotions
CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  order_id UUID,
  product_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6 Table de configuration des prix
CREATE TABLE IF NOT EXISTS boosting_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES boosting_services(id) ON DELETE CASCADE NOT NULL,
  page_type VARCHAR(100),
  country_code VARCHAR(10),
  price_per_day DECIMAL(10,2),
  price_per_message DECIMAL(10,2),
  min_duration INTEGER DEFAULT 1,
  max_duration INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 3: CRÉER LES INDEX
-- ============================================

-- Index pour boosting_services
CREATE INDEX IF NOT EXISTS idx_boosting_services_active ON boosting_services(is_active);
CREATE INDEX IF NOT EXISTS idx_boosting_services_type ON boosting_services(type);

-- Index pour boosting_campaigns
CREATE INDEX IF NOT EXISTS idx_boosting_campaigns_vendor ON boosting_campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_boosting_campaigns_product ON boosting_campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_boosting_campaigns_status ON boosting_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_boosting_campaigns_dates ON boosting_campaigns(start_date, end_date);

-- Index pour boosting_performance
CREATE INDEX IF NOT EXISTS idx_boosting_performance_campaign ON boosting_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_boosting_performance_date ON boosting_performance(date);

-- Index pour promotions
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);

-- Index pour promotion_usage
CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_user ON promotion_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_order ON promotion_usage(order_id);

-- Index pour boosting_pricing
CREATE INDEX IF NOT EXISTS idx_boosting_pricing_service ON boosting_pricing(service_id);

-- ============================================
-- ÉTAPE 4: ACTIVER RLS (ROW LEVEL SECURITY)
-- ============================================

ALTER TABLE boosting_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosting_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosting_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosting_pricing ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 5: SUPPRIMER LES ANCIENNES POLITIQUES
-- ============================================

DROP POLICY IF EXISTS "Services visibles par tous" ON boosting_services;
DROP POLICY IF EXISTS "Admins gèrent services" ON boosting_services;
DROP POLICY IF EXISTS "Vendeurs voient leurs campagnes" ON boosting_campaigns;
DROP POLICY IF EXISTS "Admins voient toutes campagnes" ON boosting_campaigns;
DROP POLICY IF EXISTS "Vendeurs créent campagnes" ON boosting_campaigns;
DROP POLICY IF EXISTS "Admins gèrent campagnes" ON boosting_campaigns;
DROP POLICY IF EXISTS "Vendeurs voient leurs performances" ON boosting_performance;
DROP POLICY IF EXISTS "Admins voient toutes performances" ON boosting_performance;
DROP POLICY IF EXISTS "Promotions actives visibles par tous" ON promotions;
DROP POLICY IF EXISTS "Admins gèrent promotions" ON promotions;
DROP POLICY IF EXISTS "Utilisateurs voient leur utilisation" ON promotion_usage;
DROP POLICY IF EXISTS "Admins voient toute utilisation" ON promotion_usage;
DROP POLICY IF EXISTS "Prix visibles par tous" ON boosting_pricing;
DROP POLICY IF EXISTS "Admins gèrent prix" ON boosting_pricing;

-- ============================================
-- ÉTAPE 6: CRÉER LES POLITIQUES RLS
-- ============================================

-- 6.1 Politiques pour boosting_services
CREATE POLICY "Services visibles par tous" ON boosting_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins gèrent services" ON boosting_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 6.2 Politiques pour boosting_campaigns
CREATE POLICY "Vendeurs voient leurs campagnes" ON boosting_campaigns
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Admins voient toutes campagnes" ON boosting_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Vendeurs créent campagnes" ON boosting_campaigns
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins gèrent campagnes" ON boosting_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 6.3 Politiques pour boosting_performance
CREATE POLICY "Vendeurs voient leurs performances" ON boosting_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boosting_campaigns 
      WHERE boosting_campaigns.id = boosting_performance.campaign_id 
      AND boosting_campaigns.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Admins voient toutes performances" ON boosting_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 6.4 Politiques pour promotions
CREATE POLICY "Promotions actives visibles par tous" ON promotions
  FOR SELECT USING (
    status = 'active' 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  );

CREATE POLICY "Admins gèrent promotions" ON promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 6.5 Politiques pour promotion_usage
CREATE POLICY "Utilisateurs voient leur utilisation" ON promotion_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins voient toute utilisation" ON promotion_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 6.6 Politiques pour boosting_pricing
CREATE POLICY "Prix visibles par tous" ON boosting_pricing
  FOR SELECT USING (true);

CREATE POLICY "Admins gèrent prix" ON boosting_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- ÉTAPE 7: CRÉER LES FONCTIONS
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour activer automatiquement les campagnes payées
CREATE OR REPLACE FUNCTION auto_activate_campaigns()
RETURNS void AS $$
BEGIN
  UPDATE boosting_campaigns
  SET status = 'active',
      start_date = COALESCE(start_date, NOW()),
      updated_at = NOW()
  WHERE payment_status = 'paid'
    AND status = 'pending'
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW());
END;
$$ LANGUAGE plpgsql;

-- Fonction pour désactiver les campagnes expirées
CREATE OR REPLACE FUNCTION deactivate_expired_campaigns()
RETURNS void AS $$
BEGIN
  UPDATE boosting_campaigns
  SET status = 'completed',
      updated_at = NOW()
  WHERE status = 'active'
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour désactiver les promotions expirées
CREATE OR REPLACE FUNCTION deactivate_expired_promotions()
RETURNS void AS $$
BEGIN
  UPDATE promotions
  SET status = 'ended',
      updated_at = NOW()
  WHERE status = 'active'
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter l'utilisation des promotions
CREATE OR REPLACE FUNCTION increment_promotion_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promotions
  SET used_count = used_count + 1
  WHERE id = NEW.promotion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÉTAPE 8: CRÉER LES TRIGGERS
-- ============================================

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_boosting_services_updated_at ON boosting_services;
CREATE TRIGGER update_boosting_services_updated_at 
  BEFORE UPDATE ON boosting_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_boosting_campaigns_updated_at ON boosting_campaigns;
CREATE TRIGGER update_boosting_campaigns_updated_at 
  BEFORE UPDATE ON boosting_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at 
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour incrémenter used_count
DROP TRIGGER IF EXISTS increment_promotion_usage_trigger ON promotion_usage;
CREATE TRIGGER increment_promotion_usage_trigger 
  AFTER INSERT ON promotion_usage
  FOR EACH ROW EXECUTE FUNCTION increment_promotion_usage();

-- ============================================
-- ÉTAPE 9: INSÉRER LES DONNÉES PAR DÉFAUT
-- ============================================

-- Services de boostage par défaut
INSERT INTO boosting_services (name, description, type, base_price, pricing_model, features, is_active) VALUES
('Recommandation Premium', 'Affichez vos produits dans la section "Recommandés pour vous"', 'recommendation', 5000, 'per_page_day', 
 '["Affichage prioritaire", "Badge Premium", "Analytics détaillés"]', true),
('Bannière Homepage', 'Bannière publicitaire sur la page d''accueil', 'banner', 10000, 'per_page_day',
 '["Position premium", "Design personnalisé", "Statistiques en temps réel"]', true),
('WhatsApp Marketing', 'Envoi de messages WhatsApp ciblés', 'whatsapp', 100, 'per_message_country',
 '["Ciblage géographique", "Templates personnalisés", "Rapports d''envoi"]', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ÉTAPE 10: ACTIVER REALTIME
-- ============================================

-- Ajouter les tables à la publication realtime
DO $$
BEGIN
  -- Vérifier et ajouter boosting_campaigns
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'boosting_campaigns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE boosting_campaigns;
  END IF;

  -- Vérifier et ajouter boosting_performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'boosting_performance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE boosting_performance;
  END IF;

  -- Vérifier et ajouter promotions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'promotions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE promotions;
  END IF;

  -- Vérifier et ajouter promotion_usage
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'promotion_usage'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE promotion_usage;
  END IF;
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Vérifications finales
SELECT 'Tables créées:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  AND tablename IN ('boosting_services', 'boosting_campaigns', 'boosting_performance', 'promotions', 'promotion_usage', 'boosting_pricing')
  ORDER BY tablename;

SELECT 'Services de boostage disponibles:' as info;
SELECT name, type, base_price, is_active FROM boosting_services;
