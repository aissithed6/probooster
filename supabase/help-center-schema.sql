-- 🛠️ SYSTÈME D'AIDE ET SUPPORT - SCHEMA SUPABASE
-- Ce script crée les tables pour le centre d'aide, la FAQ et le support client.

-- =====================================================
-- 1. TABLES DU CENTRE D'AIDE
-- =====================================================

-- Table des catégories d'aide
CREATE TABLE IF NOT EXISTS public.help_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des articles d'aide
CREATE TABLE IF NOT EXISTS public.help_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.help_categories(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des FAQ
CREATE TABLE IF NOT EXISTS public.help_faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.help_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLE DES TICKETS DE SUPPORT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    department TEXT DEFAULT 'general',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique pour l'aide
CREATE POLICY "lecture_publique_help_categories" ON public.help_categories FOR SELECT USING (is_active = true);
CREATE POLICY "lecture_publique_help_articles" ON public.help_articles FOR SELECT USING (is_active = true);
CREATE POLICY "lecture_publique_help_faqs" ON public.help_faqs FOR SELECT USING (is_active = true);

-- Politiques pour les tickets de support
CREATE POLICY "insertion_publique_support_tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "lecture_tickets_proprietaire" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- =====================================================
-- 4. DONNÉES INITIALES
-- =====================================================

-- Insertion des catégories d'aide
INSERT INTO public.help_categories (name, description, icon, color, sort_order) VALUES
('Général', 'Questions courantes sur Probooster', 'HelpCircle', 'from-blue-500 to-cyan-500', 1),
('Compte & Profil', 'Gestion de votre compte et informations personnelles', 'Users', 'from-green-500 to-emerald-500', 2),
('Shopping', 'Tout sur l''achat de produits et services', 'ShoppingCart', 'from-orange-500 to-red-500', 3),
('Système de Points', 'Comment gagner et utiliser vos points', 'Gift', 'from-purple-500 to-violet-500', 4),
('Paiement', 'Méthodes de paiement et sécurité', 'CreditCard', 'from-yellow-500 to-orange-500', 5),
('Livraison', 'Suivi de commande et délais de livraison', 'Truck', 'from-indigo-500 to-purple-500', 6);

-- Insertion de quelques FAQ
INSERT INTO public.help_faqs (question, answer, sort_order) VALUES
('Comment puis-je créer un compte sur Probooster ?', 'Pour créer un compte, cliquez sur ''Se connecter'' en haut à droite, puis sur ''Créer un compte''. Remplissez le formulaire avec vos informations personnelles et validez votre email.', 1),
('Comment fonctionne le système de points ?', 'Le système de points vous permet de gagner des points à chaque achat, partage sur les réseaux sociaux, et participation à la communauté. Ces points peuvent être échangés contre des réductions ou des produits gratuits.', 2),
('Quels sont les délais de livraison ?', 'Les délais de livraison varient selon votre localisation et le vendeur. En général, comptez 2-5 jours ouvrés pour la livraison standard et 1-2 jours pour la livraison express.', 3),
('Comment contacter le support client ?', 'Vous pouvez nous contacter via le chat en ligne disponible 24h/24, par email à support@probooster.online, ou par téléphone au +229 91 50 57 57 24h/24 et 7j/7.', 4),
('Comment retourner un produit ?', 'Pour retourner un produit, allez dans ''Mes commandes'', sélectionnez la commande concernée et cliquez sur ''Retourner''. Vous avez 14 jours pour initier un retour après réception.', 5),
('Les paiements sont-ils sécurisés ?', 'Oui, tous nos paiements sont sécurisés par un cryptage SSL de niveau bancaire. Nous acceptons les cartes bancaires, PayPal, et les paiements mobiles.', 6);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

CREATE TRIGGER update_help_categories_updated_at BEFORE UPDATE ON public.help_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at BEFORE UPDATE ON public.help_articles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_faqs_updated_at BEFORE UPDATE ON public.help_faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
