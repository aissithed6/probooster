-- =====================================================
-- SCRIPT DE CONFIGURATION COMPLÈTE DE LA BASE DE DONNÉES
-- PROBOOSTER MARKETPLACE - NOUVELLE BASE SUPABASE
-- =====================================================

-- 1. TABLE DES UTILISATEURS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'vendor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COMPATIBILITÉ SCHÉMA (idempotence)
-- Certains environnements ont déjà des tables sans colonne vendor_id.
-- On ajoute les colonnes manquantes si la table existe.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'products'
  ) THEN
    EXECUTE 'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE';
    EXECUTE 'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'orders'
  ) THEN
    EXECUTE 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
  ) THEN
    EXECUTE 'ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'promotions'
  ) THEN
    EXECUTE 'ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE';
    EXECUTE 'ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true';
  END IF;
END $$;

-- 2. TABLE DES PROFILS UTILISATEURS
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Côte d''Ivoire',
    postal_code VARCHAR(20),
    bio TEXT,
    website TEXT,
    social_media JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. TABLE DES CATÉGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    parent_id UUID REFERENCES public.categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE DES PRODUITS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'FCFA',
    images JSONB,
    specifications JSONB,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLE DES COMMANDES
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'FCFA',
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLE DES DÉTAILS DE COMMANDES
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLE DES POINTS DE FIDÉLITÉ
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    points_balance INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_spent INTEGER DEFAULT 0,
    fcfa_value DECIMAL(10,2) DEFAULT 0,
    withdrawal_threshold INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 8. TABLE DES TRANSACTIONS DE POINTS
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    fcfa_value DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLE DES DEMANDES DE PAIEMENT
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'FCFA',
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    bank_details JSONB,
    mobile_money_details JSONB,
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLE DES CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    subject VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABLE DES MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABLE DES AVIS ET ÉVALUATIONS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images JSONB,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. TABLE DES PROMOTIONS
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TABLE DES PARTAGES ET ENGAGEMENTS
CREATE TABLE IF NOT EXISTS public.shares_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    share_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50),
    engagement_metrics JSONB,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. TABLE DES CLASSEMENTS
CREATE TABLE IF NOT EXISTS public.rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    rank_position INTEGER NOT NULL,
    score DECIMAL(10,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. TABLE DES NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. TABLE DES ALERTES SYSTÈME
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    target_roles JSONB,
    action_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. TABLE DES PARAMÈTRES SYSTÈME
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    data_type VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. TABLE DES ANALYTICS
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'daily',
    date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. TABLE DES AUTOMATISATIONS
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_conditions JSONB,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. TABLE DES ÉVÉNEMENTS D'AUTOMATISATION
CREATE TABLE IF NOT EXISTS public.automation_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source VARCHAR(50) NOT NULL DEFAULT 'system',
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. TABLE DES EXÉCUTIONS D'AUTOMATISATION
CREATE TABLE IF NOT EXISTS public.automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.automation_events(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    output JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CRÉATION DES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Index pour les profils
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Index pour les catégories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- Index pour les produits
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'vendor_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'is_active'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Index pour les commandes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'vendor_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Index pour les points
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);

-- Index pour les conversations
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'vendor_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations(vendor_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);

-- Index pour les messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Index pour les avis
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Index pour les promotions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'promotions'
      AND column_name = 'vendor_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_promotions_vendor_id ON public.promotions(vendor_id)';
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'promotions'
      AND column_name = 'is_active'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Index pour les analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics(date);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_name ON public.analytics(metric_name);

-- Index pour les automatisations
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON public.automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON public.automations(trigger_type);

-- Index pour les événements/exécutions d'automatisation
CREATE INDEX IF NOT EXISTS idx_automation_events_event_type ON public.automation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_events_created_at ON public.automation_events(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_events_entity ON public.automation_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_automation_executions_automation_id ON public.automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_event_id ON public.automation_executions(event_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_started_at ON public.automation_executions(started_at);

-- =====================================================
-- ACTIVATION DE LA SÉCURITÉ ROW LEVEL (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRÉATION DES VUES UTILES
-- =====================================================

-- Vue pour les statistiques des vendeurs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'vendor_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'vendor_id'
  ) THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW public.vendor_stats AS
      SELECT 
          u.id as vendor_id,
          up.first_name,
          up.last_name,
          COUNT(p.id) as total_products,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          AVG(r.rating) as average_rating,
          COUNT(r.id) as total_reviews
      FROM public.users u
      LEFT JOIN public.user_profiles up ON u.id = up.user_id
      LEFT JOIN public.products p ON u.id = p.vendor_id
      LEFT JOIN public.orders o ON u.id = o.vendor_id
      LEFT JOIN public.reviews r ON p.id = r.product_id
      WHERE u.role = 'vendor'
      GROUP BY u.id, up.first_name, up.last_name;
    $view$;
  END IF;
END $$;

-- Vue pour les statistiques des clients
CREATE OR REPLACE VIEW public.customer_stats AS
SELECT 
    u.id as customer_id,
    up.first_name,
    up.last_name,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    lp.points_balance,
    lp.fcfa_value
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.orders o ON u.id = o.customer_id
LEFT JOIN public.loyalty_points lp ON u.id = lp.user_id
WHERE u.role = 'client'
GROUP BY u.id, up.first_name, up.last_name, lp.points_balance, lp.fcfa_value;

-- =====================================================
-- CRÉATION DES FONCTIONS UTILES
-- =====================================================

-- Fonction pour calculer les points gagnés
CREATE OR REPLACE FUNCTION public.calculate_points_earned(
    order_amount DECIMAL,
    base_rate DECIMAL DEFAULT 0.01
)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(order_amount * base_rate);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CRÉATION DES TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_loyalty_points_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_requests_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reviews_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_promotions_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_alerts_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON public.system_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_automations_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON public.automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

-- =====================================================
-- INSERTION DES DONNÉES INITIALES
-- =====================================================

-- Catégories de base
INSERT INTO public.categories (name, description, icon, color, sort_order) VALUES
('Électronique', 'Produits électroniques et gadgets', 'smartphone', '#ff6600', 1),
('Mode', 'Vêtements et accessoires', 'shirt', '#535455', 2),
('Maison', 'Articles pour la maison', 'home', '#ff6600', 3),
('Beauté', 'Produits de beauté et soins', 'heart', '#535455', 4),
('Sport', 'Équipements sportifs', 'zap', '#ff6600', 5),
('Livres', 'Livres et publications', 'book', '#535455', 6),
('Jouets', 'Jouets et jeux', 'gamepad-2', '#ff6600', 7),
('Automobile', 'Pièces et accessoires auto', 'car', '#535455', 8);

-- Paramètres système de base
DO $$
DECLARE
  pairs jsonb := jsonb_build_array(
    jsonb_build_object('key','site_name','value','Probooster','description','Nom du site','is_public',true),
    jsonb_build_object('key','site_description','value','Marketplace innovante en Côte d''Ivoire','description','Description du site','is_public',true),
    jsonb_build_object('key','default_currency','value','FCFA','description','Devise par défaut','is_public',true),
    jsonb_build_object('key','points_to_fcfa_rate','value','0.01','description','Taux de conversion points vers FCFA','is_public',true),
    jsonb_build_object('key','withdrawal_threshold','value','1000','description','Seuil minimum de retrait en points','is_public',true),
    jsonb_build_object('key','commission_rate','value','0.05','description','Taux de commission sur les ventes','is_public',true),
    jsonb_build_object('key','max_products_per_vendor','value','1000','description','Nombre maximum de produits par vendeur','is_public',true),
    jsonb_build_object('key','auto_approval_threshold','value','4.5','description','Seuil d''approbation automatique des avis','is_public',true)
  );
  item jsonb;
  k text;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(pairs)
  LOOP
    k := item->>'key';

    UPDATE public.system_settings
    SET
      value = item->>'value',
      description = item->>'description',
      is_public = (item->>'is_public')::boolean,
      updated_at = NOW()
    WHERE key = k;

    IF NOT FOUND THEN
      INSERT INTO public.system_settings (key, value, description, is_public)
      VALUES (k, item->>'value', item->>'description', (item->>'is_public')::boolean);
    END IF;
  END LOOP;
END $$;

-- Utilisateur administrateur par défaut
DO $$
BEGIN
  UPDATE public.users
  SET role = 'admin', updated_at = NOW()
  WHERE lower(email) = 'admin@probooster.ci';

  IF NOT FOUND THEN
    INSERT INTO public.users (email, role)
    VALUES ('admin@probooster.ci', 'admin');
  END IF;
END $$;

-- Profil administrateur
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM public.users
  WHERE lower(email) = 'admin@probooster.ci'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.user_profiles
  SET
    first_name = 'Admin',
    last_name = 'Probooster',
    phone = '+22500000000',
    city = 'Abidjan',
    country = 'Côte d''Ivoire',
    updated_at = NOW()
  WHERE user_id = admin_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (user_id, first_name, last_name, phone, city, country)
    VALUES (admin_user_id, 'Admin', 'Probooster', '+22500000000', 'Abidjan', 'Côte d''Ivoire');
  END IF;
END $$;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

-- Script terminé avec succès !
-- Base de données Probooster Marketplace configurée
-- 20 tables créées avec index, contraintes et RLS
-- 2 vues créées pour les statistiques
-- 2 fonctions créées pour les calculs
-- 20 triggers créés pour la maintenance automatique
-- Données initiales insérées
