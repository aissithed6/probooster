-- ============================================
-- SYSTÈME DE PARTAGE ET ENGAGEMENT
-- Tables pour tracer les partages et interactions
-- ============================================

-- Supprimer les objets existants dans le bon ordre
-- D'abord les vues et fonctions (pas de dépendances sur les tables)
DROP VIEW IF EXISTS share_interaction_stats CASCADE;
DROP VIEW IF EXISTS vendor_share_stats CASCADE;
DROP VIEW IF EXISTS user_share_stats CASCADE;
DROP FUNCTION IF EXISTS update_user_points_balance() CASCADE;
DROP FUNCTION IF EXISTS calculate_conversion_rate(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_share_leaderboard(INTEGER) CASCADE;

-- Ensuite les tables (CASCADE supprimera automatiquement les triggers)
DROP TABLE IF EXISTS share_interactions CASCADE;
DROP TABLE IF EXISTS product_shares CASCADE;
DROP TABLE IF EXISTS user_points_transactions CASCADE;

-- Table des partages de produits
CREATE TABLE IF NOT EXISTS product_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL, -- Peut être UUID ou autre identifiant
  vendor_id UUID NOT NULL, -- ID du vendeur (peut ne pas être dans users si table séparée)
  platform VARCHAR(50) NOT NULL, -- facebook, twitter, whatsapp, instagram, linkedin, email, copy
  share_url TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des interactions sur les partages
CREATE TABLE IF NOT EXISTS share_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES product_shares(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- view, click, conversion, purchase
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des transactions de points
CREATE TABLE IF NOT EXISTS user_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- share, conversion, purchase, bonus, withdrawal
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la colonne points_balance si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_product_shares_user ON product_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_product_shares_product ON product_shares(product_id);
CREATE INDEX IF NOT EXISTS idx_product_shares_vendor ON product_shares(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_shares_created ON product_shares(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_interactions_share ON share_interactions(share_id);
CREATE INDEX IF NOT EXISTS idx_share_interactions_type ON share_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_share_interactions_created ON share_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON user_points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON user_points_transactions(type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created ON user_points_transactions(created_at DESC);

-- Activer Realtime pour les tables
ALTER PUBLICATION supabase_realtime ADD TABLE product_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE share_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_points_transactions;

-- Row Level Security (RLS)
ALTER TABLE product_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points_transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour product_shares
CREATE POLICY "Users can view their own shares" ON product_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view shares of their products" ON product_shares
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Users can create shares" ON product_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour share_interactions
CREATE POLICY "Users can view interactions on their shares" ON share_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_shares 
      WHERE product_shares.id = share_interactions.share_id 
      AND (product_shares.user_id = auth.uid() OR product_shares.vendor_id = auth.uid())
    )
  );

CREATE POLICY "Anyone can create interactions" ON share_interactions
  FOR INSERT WITH CHECK (true);

-- Politiques RLS pour user_points_transactions
CREATE POLICY "Users can view their own transactions" ON user_points_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" ON user_points_transactions
  FOR INSERT WITH CHECK (true);

-- Vue pour les statistiques de partage par utilisateur
CREATE OR REPLACE VIEW user_share_stats AS
SELECT 
  user_id,
  COUNT(*) as total_shares,
  SUM(points_earned) as total_points_earned,
  COUNT(DISTINCT platform) as platforms_used,
  MAX(created_at) as last_share_at
FROM product_shares
GROUP BY user_id;

-- Vue pour les statistiques de partage par vendeur
CREATE OR REPLACE VIEW vendor_share_stats AS
SELECT 
  vendor_id,
  COUNT(*) as total_shares,
  COUNT(DISTINCT user_id) as unique_sharers,
  COUNT(DISTINCT product_id) as products_shared,
  MAX(created_at) as last_share_at
FROM product_shares
GROUP BY vendor_id;

-- Vue pour les statistiques d'interaction
CREATE OR REPLACE VIEW share_interaction_stats AS
SELECT 
  ps.user_id,
  ps.vendor_id,
  COUNT(si.id) as total_interactions,
  COUNT(CASE WHEN si.interaction_type = 'view' THEN 1 END) as views,
  COUNT(CASE WHEN si.interaction_type = 'click' THEN 1 END) as clicks,
  COUNT(CASE WHEN si.interaction_type = 'conversion' THEN 1 END) as conversions,
  COUNT(CASE WHEN si.interaction_type = 'purchase' THEN 1 END) as purchases
FROM product_shares ps
LEFT JOIN share_interactions si ON ps.id = si.share_id
GROUP BY ps.user_id, ps.vendor_id;

-- Fonction pour calculer le taux de conversion
CREATE OR REPLACE FUNCTION calculate_conversion_rate(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_shares INTEGER;
  total_conversions INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_shares
  FROM product_shares
  WHERE user_id = p_user_id;
  
  SELECT COUNT(DISTINCT si.id) INTO total_conversions
  FROM product_shares ps
  JOIN share_interactions si ON ps.id = si.share_id
  WHERE ps.user_id = p_user_id
  AND si.interaction_type IN ('conversion', 'purchase');
  
  IF total_shares = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (total_conversions::NUMERIC / total_shares::NUMERIC) * 100;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le classement des partageurs
CREATE OR REPLACE FUNCTION get_share_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  total_shares BIGINT,
  total_points BIGINT,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.user_id,
    COUNT(*) as total_shares,
    SUM(ps.points_earned) as total_points,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, SUM(ps.points_earned) DESC)::INTEGER as rank
  FROM product_shares ps
  GROUP BY ps.user_id
  ORDER BY total_shares DESC, total_points DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le solde de points automatiquement
CREATE OR REPLACE FUNCTION update_user_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET points_balance = points_balance + NEW.points
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_points_balance
AFTER INSERT ON user_points_transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_points_balance();

-- Données de test (optionnel)
-- INSERT INTO product_shares (user_id, product_id, vendor_id, platform, share_url, points_earned)
-- VALUES 
--   ('user-uuid', 'product-uuid', 'vendor-uuid', 'facebook', 'https://example.com/share/1', 10),
--   ('user-uuid', 'product-uuid', 'vendor-uuid', 'twitter', 'https://example.com/share/2', 8);

-- =========================================================
-- RPC sécurisées pour l’accès vendeur aux statistiques agrégées
-- =========================================================

-- Fonction RPC sécurisée pour récupérer les statistiques de partage d’un vendeur.
-- Cette fonction s’exécute en SECURITY DEFINER mais impose auth.uid() = p_vendor pour éviter tout contournement des politiques RLS.
CREATE OR REPLACE FUNCTION public.vendor_share_stats_for(p_vendor UUID)
RETURNS TABLE (
  vendor_id UUID,
  total_shares BIGINT,
  unique_sharers BIGINT,
  products_shared BIGINT,
  last_share_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    v.vendor_id,
    v.total_shares,
    v.unique_sharers,
    v.products_shared,
    v.last_share_at
  FROM vendor_share_stats v
  WHERE v.vendor_id = p_vendor
    AND auth.uid() = p_vendor;
$$;

GRANT EXECUTE ON FUNCTION public.vendor_share_stats_for(UUID) TO authenticated;

-- Fonction RPC sécurisée pour récupérer les statistiques d’interaction relatives à un vendeur.
-- Elle suit le même principe de garde d’accès que la fonction précédente.
CREATE OR REPLACE FUNCTION public.share_interaction_stats_for(p_vendor UUID)
RETURNS TABLE (
  vendor_id UUID,
  total_interactions BIGINT,
  views BIGINT,
  clicks BIGINT,
  conversions BIGINT,
  purchases BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.vendor_id,
    s.total_interactions,
    s.views,
    s.clicks,
    s.conversions,
    s.purchases
  FROM share_interaction_stats s
  WHERE s.vendor_id = p_vendor
    AND auth.uid() = p_vendor;
$$;

GRANT EXECUTE ON FUNCTION public.share_interaction_stats_for(UUID) TO authenticated;
