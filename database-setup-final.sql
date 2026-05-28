-- 🚀 CONFIGURATION COMPLÈTE DE LA BASE DE DONNÉES SUPABASE
-- Ce script crée toutes les tables, vues, fonctions et triggers nécessaires

-- =====================================================
-- 1. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des utilisateurs (extension de auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('client', 'vendor', 'admin')) DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Côte d''Ivoire',
    postal_code TEXT,
    bio TEXT,
    website TEXT,
    social_media JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des points de fidélité
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    points_balance INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_spent INTEGER DEFAULT 0,
    fcfa_value DECIMAL(10,2) DEFAULT 0.00,
    withdrawal_threshold INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des catégories de produits
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    parent_id UUID REFERENCES public.categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'F CFA',
    images JSONB,
    specifications JSONB,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'F CFA',
    shipping_address JSONB,
    billing_address JSONB,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id),
    subject TEXT,
    status TEXT DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres système
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    data_type TEXT DEFAULT 'string',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CRÉATION DES VUES
-- =====================================================

-- Vue des statistiques vendeur
CREATE OR REPLACE VIEW public.vendor_stats AS
SELECT 
    u.id as vendor_id,
    up.first_name,
    up.last_name,
    COUNT(p.id) as total_products,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(AVG(p.rating), 0) as average_rating,
    COALESCE(SUM(p.review_count), 0) as total_reviews
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.products p ON u.id = p.vendor_id
LEFT JOIN public.orders o ON u.id = o.vendor_id
WHERE u.role = 'vendor'
GROUP BY u.id, up.first_name, up.last_name;

-- Vue des statistiques client
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
-- 3. CRÉATION DES FONCTIONS
-- =====================================================

-- Fonction pour calculer les points gagnés
CREATE OR REPLACE FUNCTION public.calculate_points_earned(
    order_amount DECIMAL,
    base_rate DECIMAL DEFAULT 0.01
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN FLOOR(order_amount * base_rate);
END;
$$;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =====================================================
-- 4. CRÉATION DES TRIGGERS
-- =====================================================

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON public.loyalty_points
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. INSERTION DES DONNÉES INITIALES
-- =====================================================

-- Catégories de base
INSERT INTO public.categories (name, description, icon, color, sort_order) VALUES
('Électronique', 'Produits électroniques et technologiques', 'smartphone', '#3b82f6', 1),
('Informatique', 'Ordinateurs, accessoires et logiciels', 'laptop', '#10b981', 2),
('Mode', 'Vêtements, chaussures et accessoires', 'shirt', '#f59e0b', 3),
('Maison', 'Décoration, mobilier et jardinage', 'home', '#8b5cf6', 4),
('Sport', 'Équipements et vêtements de sport', 'dumbbell', '#ef4444', 5),
('Beauté', 'Cosmétiques, parfums et soins', 'heart', '#ec4899', 6),
('Loisirs', 'Livres, jeux et divertissements', 'book-open', '#06b6d4', 7),
('Automobile', 'Pièces et accessoires automobiles', 'car', '#84cc16', 8);

-- Paramètres système de base
INSERT INTO public.system_settings (key, value, description, is_public, data_type) VALUES
('site_name', 'Probooster', 'Nom du site', true, 'string'),
('site_description', 'La marketplace du futur avec système de points innovant', 'Description du site', true, 'string'),
('default_currency', 'F CFA', 'Devise par défaut', true, 'string'),
('points_to_fcfa_rate', '0.1', 'Taux de conversion points vers F CFA', true, 'decimal'),
('min_withdrawal_amount', '1000', 'Montant minimum de retrait en points', true, 'integer'),
('max_products_per_vendor', '1000', 'Nombre maximum de produits par vendeur', true, 'integer'),
('support_email', 'support@probooster.com', 'Email de support', true, 'string'),
('maintenance_mode', 'false', 'Mode maintenance', false, 'boolean');

-- =====================================================
-- 6. CONFIGURATION RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CRÉATION DES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index sur les clés étrangères
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Index sur les colonnes fréquemment utilisées
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- 8. MESSAGE DE SUCCÈS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Configuration de la base de données terminée avec succès !';
    RAISE NOTICE '📊 Tables créées: 10';
    RAISE NOTICE '👁️ Vues créées: 2';
    RAISE NOTICE '⚙️ Fonctions créées: 2';
    RAISE NOTICE '🔧 Triggers créés: 8';
    RAISE NOTICE '📝 Données initiales insérées';
    RAISE NOTICE '🔒 RLS activé sur toutes les tables';
    RAISE NOTICE '🚀 Votre base de données Probooster est prête !';
END $$;
