-- Script pour créer les tables manquantes nécessaires au service dashboard
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Table des produits des vendeurs
CREATE TABLE IF NOT EXISTS public.user_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'XOF',
    category VARCHAR(100),
    subcategory VARCHAR(100),
    images TEXT[],
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_shareable BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_shares INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    tags TEXT[],
    weight DECIMAL(8,2),
    dimensions JSONB,
    shipping_cost DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_products_vendor_id ON public.user_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_user_products_category ON public.user_products(category);
CREATE INDEX IF NOT EXISTS idx_user_products_is_active ON public.user_products(is_active);

-- 3. Contraintes d'unicité (sans IF NOT EXISTS)
DO $$
BEGIN
    -- Ajouter la contrainte unique_vendor_product_name si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_vendor_product_name' 
        AND table_name = 'user_products'
    ) THEN
        ALTER TABLE public.user_products ADD CONSTRAINT unique_vendor_product_name UNIQUE(vendor_id, name);
    END IF;
END $$;

-- 4. Triggers pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger (supprimer d'abord s'il existe)
DROP TRIGGER IF EXISTS update_user_products_updated_at ON public.user_products;
CREATE TRIGGER update_user_products_updated_at 
    BEFORE UPDATE ON public.user_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Politiques RLS (Row Level Security)
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_products
CREATE POLICY "Users can view all active products" ON public.user_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can manage their own products" ON public.user_products
    FOR ALL USING (auth.uid() = vendor_id);

-- 6. Vérification
SELECT 
    'user_products' as table_name,
    COUNT(*) as row_count
FROM public.user_products;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table user_products créée avec succès !';
    RAISE NOTICE '📊 user_products: Table des produits des vendeurs';
    RAISE NOTICE '🔒 RLS activé pour la sécurité';
    RAISE NOTICE '⚡ Index créés pour les performances';
END $$;
