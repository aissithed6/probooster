-- 🆕 SEED CENTRE D'AIDE - ARTICLES DE BLOG
-- Garantit les 6 catégories d'aide et insère des articles pour chacune,
-- synchronise la section "Articles populaires" et enrichit la FAQ.
-- Idempotent : réexécutable sans créer de doublons.

-- =====================================================================
-- 0. ASSURER LE SCHÉMA (idempotent) — tables, RLS, policies, triggers
-- =====================================================================
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

ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lecture_publique_help_categories" ON public.help_categories;
DROP POLICY IF EXISTS "lecture_publique_help_articles" ON public.help_articles;
DROP POLICY IF EXISTS "lecture_publique_help_faqs" ON public.help_faqs;
DROP POLICY IF EXISTS "insertion_publique_support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "lecture_tickets_proprietaire" ON public.support_tickets;

CREATE POLICY "lecture_publique_help_categories" ON public.help_categories FOR SELECT USING (is_active = true);
CREATE POLICY "lecture_publique_help_articles" ON public.help_articles FOR SELECT USING (is_active = true);
CREATE POLICY "lecture_publique_help_faqs" ON public.help_faqs FOR SELECT USING (is_active = true);
CREATE POLICY "insertion_publique_support_tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "lecture_tickets_proprietaire" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR email = (SELECT email FROM public.users WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS update_help_categories_updated_at ON public.help_categories;
DROP TRIGGER IF EXISTS update_help_articles_updated_at ON public.help_articles;
DROP TRIGGER IF EXISTS update_help_faqs_updated_at ON public.help_faqs;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;

CREATE TRIGGER update_help_categories_updated_at BEFORE UPDATE ON public.help_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_help_articles_updated_at BEFORE UPDATE ON public.help_articles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_help_faqs_updated_at BEFORE UPDATE ON public.help_faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 1. GARANTIR LES 6 CATÉGORIES DU CENTRE D'AIDE
-- =====================================================================
DO $$
DECLARE
  v_gen UUID;
  v_compte UUID;
  v_shopping UUID;
  v_points UUID;
  v_paiement UUID;
  v_livraison UUID;
BEGIN
  -- Insère une catégorie si elle n'existe pas déjà, puis récupère son id.
  INSERT INTO public.help_categories (name, description, icon, color, sort_order, is_active)
  SELECT 'Général', 'Questions courantes sur Probooster', 'HelpCircle', 'from-blue-500 to-cyan-500', 1, true
  WHERE NOT EXISTS (SELECT 1 FROM public.help_categories WHERE name = 'Général');
  SELECT id INTO v_gen FROM public.help_categories WHERE name = 'Général';

  INSERT INTO public.help_categories (name, description, icon, color, sort_order, is_active)
  SELECT 'Compte & Profil', 'Gestion de votre compte et informations personnelles', 'Users', 'from-green-500 to-emerald-500', 2, true
  WHERE NOT EXISTS (SELECT 1 FROM public.help_categories WHERE name = 'Compte & Profil');
  SELECT id INTO v_compte FROM public.help_categories WHERE name = 'Compte & Profil';

  INSERT INTO public.help_categories (name, description, icon, color, sort_order, is_active)
  SELECT 'Shopping', 'Tout sur l''achat de produits et services', 'ShoppingCart', 'from-orange-500 to-red-500', 3, true
  WHERE NOT EXISTS (SELECT 1 FROM public.help_categories WHERE name = 'Shopping');
  SELECT id INTO v_shopping FROM public.help_categories WHERE name = 'Shopping';

  INSERT INTO public.help_categories (name, description, icon, color, sort_order, is_active)
  SELECT 'Système de Points', 'Comment gagner et utiliser vos points', 'Gift', 'from-purple-500 to-violet-500', 4, true
  WHERE NOT EXISTS (SELECT 1 FROM public.help_categories WHERE name = 'Système de Points');
  SELECT id INTO v_points FROM public.help_categories WHERE name = 'Système de Points';

  INSERT INTO public.help_categories (name, description, icon, color, sort_order, is_active)
  SELECT 'Paiement', 'Méthodes de paiement et sécurité', 'CreditCard', 'from-yellow-500 to-orange-500', 5, true
  WHERE NOT EXISTS (SELECT 1 FROM public.help_categories WHERE name = 'Paiement');
  SELECT id INTO v_paiement FROM public.help_categories WHERE name = 'Paiement';

  INSERT INTO public.help_categories (name, description, icon, color, sort_order, is_active)
  SELECT 'Livraison', 'Suivi de commande et délais de livraison', 'Truck', 'from-indigo-500 to-purple-500', 6, true
  WHERE NOT EXISTS (SELECT 1 FROM public.help_categories WHERE name = 'Livraison');
  SELECT id INTO v_livraison FROM public.help_categories WHERE name = 'Livraison';

-- =====================================================================
  -- 2. INSERTION DES ARTICLES (5 par catégorie, idempotent par titre)
  -- =====================================================================
  -- Catégorie Général
  INSERT INTO public.help_articles (category_id, title, content, views, rating, is_popular)
  SELECT v_gen, t.title, t.content, t.views, t.rating, t.is_popular FROM (VALUES
    ('Bienvenue sur Probooster : guide de démarrage',
     '<h2>Bienvenue sur Probooster</h2><p>Probooster est votre plateforme de marketplace qui connecte acheteurs et vendeurs en toute sécurité. Ce guide vous accompagne dans vos premiers pas : création de compte, navigation dans les catégories, ajout de produits au panier et passage de commande.</p><h3>Les étapes clés</h3><ul><li>Créez votre compte gratuit en quelques minutes</li><li>Confirmez votre adresse email pour sécuriser votre profil</li><li>Explorez les centaines de produits et services disponibles</li><li>Commandez et suivez votre livraison en temps réel</li></ul>',
     1500, 4.9, true),
    ('Comment utiliser le centre d''aide ?',
     '<h2>Le centre d''aide à votre service</h2><p>Le centre d''aide centralise toutes les réponses à vos questions. Utilisez la barre de recherche pour trouver un article précis, ou parcourez les catégories thématiques. Si vous ne trouvez pas de réponse, notre équipe reste joignable 24h/24 via le chat en ligne.</p>',
     980, 4.7, false),
    ('Vos avantages en tant que membre Probooster',
     '<h2>Les avantages membres</h2><p>En rejoignant Probooster, vous accédez à des offres exclusives, au système de points récompenses et à un support prioritaire. Ce guide détaille l''ensemble des avantages dont vous bénéficiez dès votre inscription.</p>',
     720, 4.6, false),
    ('Guide de sécurité en ligne',
     '<h2>Restez en sécurité</h2><p>Protégez vos informations personnelles : utilisez un mot de passe fort, activez la double authentification et ne partagez jamais vos identifiants. Probooster applique un cryptage SSL de niveau bancaire sur toutes vos données.</p><p>En cas de doute, signalez immédiatement tout comportement suspect à notre support.</p>',
     1105, 4.8, false),
    ('Mises à jour de la plateforme',
     '<h2>Restez informé</h2><p>Découvrez les dernières nouveautés de Probooster : nouvelles fonctionnalités, améliorations de l''interface et optimisations de performance. Cette page est régulièrement mise à jour pour vous tenir informé.</p>',
     640, 4.5, false)
  ) AS t(title, content, views, rating, is_popular)
  WHERE NOT EXISTS (SELECT 1 FROM public.help_articles a WHERE a.title = t.title);

  -- Catégorie Compte & Profil
  INSERT INTO public.help_articles (category_id, title, content, views, rating, is_popular)
  SELECT v_compte, t.title, t.content, t.views, t.rating, t.is_popular FROM (VALUES
    ('Comment créer un compte ?',
     '<h2>Créer votre compte</h2><p>Cliquez sur « Se connecter » en haut à droite, puis sur « Créer un compte ». Remplissez vos informations personnelles, choisissez un mot de passe sécurisé et confirmez votre adresse email pour activer votre profil.</p><h3>Pourquoi valider votre email ?</h3><p>La validation de votre email protège votre compte et vous permet de récupérer votre mot de passe facilement en cas d''oubli.</p>',
     1320, 4.8, true),
    ('Modifier mes informations personnelles',
     '<h2>Mettre à jour votre profil</h2><p>Rendez-vous dans votre espace personnel puis « Paramètres du compte ». Vous pouvez y modifier votre nom, votre photo, votre numéro de téléphone et vos préférences de notification à tout moment.</p>',
     850, 4.6, false),
    ('Gérer la sécurité de mon compte',
     '<h2>Sécurisez votre profil</h2><p>Changez régulièrement votre mot de passe et activez la double authentification. Vous pouvez visualiser les appareils connectés et en déconnecter un à distance si nécessaire.</p>',
     760, 4.7, false),
    ('Changer ou récupérer mon mot de passe',
     '<h2>Mot de passe oublié ?</h2><p>Cliquez sur « Mot de passe oublié » à l''écran de connexion. Vous recevrez un lien de réinitialisation par email. Pensez à utiliser un mot de passe d''au moins 8 caractères combinant lettres, chiffres et symboles.</p>',
     690, 4.5, false),
    ('Fermer ou supprimer mon compte',
     '<h2>Clôturer votre compte</h2><p>Vous pouvez désactiver temporairement ou supprimer définitivement votre compte depuis « Paramètres du compte ». La suppression est définitive : vos points, avis et commandes seront supprimés après une période de vérification de 30 jours.</p>',
     420, 4.3, false)
  ) AS t(title, content, views, rating, is_popular)
  WHERE NOT EXISTS (SELECT 1 FROM public.help_articles a WHERE a.title = t.title);

  -- Catégorie Shopping
  INSERT INTO public.help_articles (category_id, title, content, views, rating, is_popular)
  SELECT v_shopping, t.title, t.content, t.views, t.rating, t.is_popular FROM (VALUES
    ('Comment passer une commande ?',
     '<h2>Commander en 4 étapes</h2><p>1. Parcourez les produits et ajoutez-les au panier. 2. Validez votre panier et renseignez votre adresse de livraison. 3. Choisissez votre mode de paiement. 4. Confirmez et suivez votre commande dans « Mes commandes ».</p>',
     1250, 4.8, true),
    ('Suivre ma commande en temps réel',
     '<h2>Suivi de commande</h2><p>Depuis « Mes commandes », vous pouvez voir l''état de votre commande : confirmée, préparée, expédiée ou livrée. Un lien de suivi de livraison vous est envoyé par email dès l''expédition.</p>',
     1420, 4.9, true),
    ('Retourner un produit',
     '<h2>Retour et remboursement</h2><p>Vous disposez de 14 jours pour initier un retour depuis « Mes commandes ». Sélectionnez la commande, cliquez sur « Retourner », puis suivez les instructions. Votre remboursement est traité sous 5 jours ouvrés après réception.</p>',
     960, 4.7, false),
    ('Évaluer un produit acheté',
     '<h2>Partagez votre avis</h2><p>Après réception, vous pouvez laisser une note et un commentaire sur le produit. Vos avis aident la communauté à faire les bons choix et récompensent les vendeurs de qualité.</p>',
     610, 4.5, false),
    ('Utiliser mes favoris et le panier',
     '<h2>Panier et favoris</h2><p>Enregistrez les produits qui vous plaisent dans vos favoris pour les retrouver facilement, et utilisez le panier pour grouper vos achats. Vous recevrez une alerte quand un favori est en promotion.</p>',
     560, 4.5, false)
  ) AS t(title, content, views, rating, is_popular)
  WHERE NOT EXISTS (SELECT 1 FROM public.help_articles a WHERE a.title = t.title);

  -- Catégorie Système de Points
  INSERT INTO public.help_articles (category_id, title, content, views, rating, is_popular)
  SELECT v_points, t.title, t.content, t.views, t.rating, t.is_popular FROM (VALUES
    ('Comment gagner des points ?',
     '<h2>Multipliez vos points</h2><p>Gagnez des points à chaque achat, en partageant des produits sur les réseaux sociaux, en laissant des avis et en participant à la communauté. Plus vous êtes actif, plus vous récoltez !</p>',
     1180, 4.8, true),
    ('Utiliser mes points pour des réductions',
     '<h2>Échanger vos points</h2><p>Rendez-vous dans votre espace « Mes points » pour convertir vos points en bons de réduction applicables sur votre prochaine commande ou en remise directe.</p>',
     820, 4.6, false),
    ('Système de parrainage',
     '<h2>Parrainez et gagnez</h2><p>Invitez vos amis à rejoindre Probooster via votre lien de parrainage. Vous gagnez des points bonus, et votre filleul reçoit aussi un cadeau de bienvenue.</p>',
     700, 4.7, false),
    ('Gagner des points avec vos avis',
     '<h2>Points de récompense</h2><p>Rédigez un avis détaillé après un achat pour gagner des points bonus. Les avis de qualité avec photos rapportent davantage et sont mis en avant sur la fiche produit.</p>',
     640, 4.6, false),
    ('Vérifier mon solde de points',
     '<h2>Consulter votre solde</h2><p>Votre solde de points, votre historique et vos bons d''achat sont consultables en temps réel depuis « Mes points ». Chaque transaction y est détaillée avec son montant en valeur.</p>',
     510, 4.5, false)
  ) AS t(title, content, views, rating, is_popular)
  WHERE NOT EXISTS (SELECT 1 FROM public.help_articles a WHERE a.title = t.title);

  -- Catégorie Paiement
  INSERT INTO public.help_articles (category_id, title, content, views, rating, is_popular)
  SELECT v_paiement, t.title, t.content, t.views, t.rating, t.is_popular FROM (VALUES
    ('Quels moyens de paiement acceptez-vous ?',
     '<h2>Moyens de paiement</h2><p>Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, le mobile money et les paiements à la livraison selon les vendeurs. Toutes les transactions sont sécurisées par cryptage SSL.</p>',
     1010, 4.7, true),
    ('Les paiements sont-ils sécurisés ?',
     '<h2>Sécurité des transactions</h2><p>Probooster utilise un cryptage SSL de niveau bancaire. Vos coordonnées bancaires ne sont jamais stockées sur nos serveurs et sont transmises directement à nos partenaires de paiement certifiés.</p>',
     1320, 4.9, true),
    ('Que faire en cas de paiement échoué ?',
     '<h2>Paiement refusé</h2><p>Vérifiez le solde ou la validité de votre carte, puis réessayez. Si le problème persiste, contactez notre support qui vous aidera à finaliser votre commande par un autre moyen.</p>',
     540, 4.4, false),
    ('Factures et reçus de commande',
     '<h2>Obtenir votre facture</h2><p>Chaque commande confirmée génère un reçu. Vous pouvez le télécharger en PDF depuis « Mes commandes » pour vos archives ou vos remboursements.</p>',
     480, 4.5, false),
    ('Payer avec le mobile money',
     '<h2>Mobile money accepté</h2><p>Payez facilement via MTN Mobile Money, Moov Money ou tout autre opérateur mobile. Saisissez votre numéro dans l''étape de paiement, validez la notification sur votre téléphone et votre commande est confirmée immédiatement.</p><p>Le mobile money est disponible dans la plupart des pays d''Afrique de l''Ouest.</p>',
     730, 4.7, true)
  ) AS t(title, content, views, rating, is_popular)
  WHERE NOT EXISTS (SELECT 1 FROM public.help_articles a WHERE a.title = t.title);

  -- Catégorie Livraison
  INSERT INTO public.help_articles (category_id, title, content, views, rating, is_popular)
  SELECT v_livraison, t.title, t.content, t.views, t.rating, t.is_popular FROM (VALUES
    ('Quels sont les délais de livraison ?',
     '<h2>Délais indicatifs</h2><p>Comptez 2 à 5 jours ouvrés pour la livraison standard et 1 à 2 jours pour la livraison express. Les délais peuvent varier selon votre localisation et la disponibilité du vendeur.</p>',
     1390, 4.8, true),
    ('Suivre ma livraison',
     '<h2>Suivi du colis</h2><p>Utilisez le numéro de suivi reçu par email pour suivre votre colis en temps réel. Vous recevrez des notifications à chaque étape du parcours de livraison.</p>',
     1340, 4.9, true),
    ('Modifier mon adresse de livraison',
     '<h2>Changer l''adresse</h2><p>Vous pouvez modifier votre adresse de livraison tant que la commande n''a pas été expédiée. Rendez-vous dans « Mes commandes », sélectionnez la commande et mettez à jour l''adresse.</p>',
     620, 4.6, false),
    ('Réception et vérification du colis',
     '<h2>À la réception</h2><p>Vérifiez l''état du colis et son contenu à la réception. En cas d''anomalie, notez-le immédiatement et contactez notre support dans les 48h pour déclarer le problème.</p>',
     580, 4.5, false),
    ('Zones de livraison disponibles',
     '<h2>Où livrons-nous ?</h2><p>Probooster livre dans tout le Bénin avec des partenaires de confiance, et étend progressivement sa couverture. Vérifiez la disponibilité à votre adresse lors de la commande.</p>',
     510, 4.4, false)
  ) AS t(title, content, views, rating, is_popular)
  WHERE NOT EXISTS (SELECT 1 FROM public.help_articles a WHERE a.title = t.title);

  -- =====================================================================
  -- 3. FAQ SUPPLÉMENTAIRES (idempotent par question)
  -- =====================================================================
  INSERT INTO public.help_faqs (category_id, question, answer, sort_order)
  SELECT v_points, 'Mes points expirent-ils ?', 'Vos points restent valables tant que votre compte est actif. Une activité régulière suffit pour conserver l''ensemble de vos récompenses.', 7
  WHERE NOT EXISTS (SELECT 1 FROM public.help_faqs f WHERE f.question = 'Mes points expirent-ils ?');

  INSERT INTO public.help_faqs (category_id, question, answer, sort_order)
  SELECT v_paiement, 'Puis-je payer à la livraison ?', 'Oui, selon les vendeurs le paiement à la livraison est disponible. Vérifiez les options affichées sur la fiche produit avant de valider votre commande.', 8
  WHERE NOT EXISTS (SELECT 1 FROM public.help_faqs f WHERE f.question = 'Puis-je payer à la livraison ?');

  INSERT INTO public.help_faqs (category_id, question, answer, sort_order)
  SELECT v_compte, 'Puis-je avoir plusieurs comptes ?', 'Non, un seul compte est autorisé par personne. La création de comptes multiples peut entraîner la suspension de vos avantages et de vos points.', 9
  WHERE NOT EXISTS (SELECT 1 FROM public.help_faqs f WHERE f.question = 'Puis-je avoir plusieurs comptes ?');

END $$;