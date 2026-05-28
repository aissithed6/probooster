-- Script d'insertion de données de test pour le tableau de bord
-- Exécutez ce script dans votre base de données Supabase

-- 1. Insérer des utilisateurs de test
INSERT INTO users (id, email, role, created_at, updated_at) VALUES
('user-001', 'client1@example.com', 'client', NOW(), NOW()),
('user-002', 'client2@example.com', 'client', NOW(), NOW()),
('user-003', 'vendor1@example.com', 'vendor', NOW(), NOW()),
('user-004', 'vendor2@example.com', 'vendor', NOW(), NOW()),
('user-005', 'admin1@example.com', 'admin', NOW(), NOW());

-- 2. Insérer des profils utilisateur
INSERT INTO user_profiles (id, user_id, first_name, last_name, avatar_url, phone, address, city, country, postal_code, bio, website, social_media, preferences, created_at, updated_at) VALUES
('profile-001', 'user-001', 'Jean', 'Dupont', 'https://example.com/avatar1.jpg', '+225 0123456789', '123 Rue de la Paix', 'Abidjan', 'Côte d''Ivoire', '22500', 'Client passionné de technologie', 'https://jeandupont.com', '{"facebook": "jean.dupont", "twitter": "@jeandupont"}', '{"theme": "dark", "language": "fr"}', NOW(), NOW()),
('profile-002', 'user-002', 'Marie', 'Martin', 'https://example.com/avatar2.jpg', '+225 0987654321', '456 Avenue des Fleurs', 'Abidjan', 'Côte d''Ivoire', '22500', 'Acheteuse régulière', 'https://mariemartin.com', '{"instagram": "marie.martin"}', '{"theme": "light", "language": "fr"}', NOW(), NOW()),
('profile-003', 'user-003', 'Pierre', 'Durand', 'https://example.com/avatar3.jpg', '+225 0555666777', '789 Boulevard du Commerce', 'Abidjan', 'Côte d''Ivoire', '22500', 'Vendeur professionnel', 'https://pierredurand.com', '{"linkedin": "pierre-durand"}', '{"theme": "dark", "language": "fr"}', NOW(), NOW()),
('profile-004', 'user-004', 'Sophie', 'Leroy', 'https://example.com/avatar4.jpg', '+225 0444333222', '321 Rue du Marché', 'Abidjan', 'Côte d''Ivoire', '22500', 'Vendeuse expérimentée', 'https://sophieleroy.com', '{"facebook": "sophie.leroy"}', '{"theme": "light", "language": "fr"}', NOW(), NOW()),
('profile-005', 'user-005', 'Admin', 'System', 'https://example.com/avatar5.jpg', '+225 0111222333', 'Admin Address', 'Abidjan', 'Côte d''Ivoire', '22500', 'Administrateur système', 'https://admin.com', '{}', '{"theme": "dark", "language": "fr"}', NOW(), NOW());

-- 3. Insérer des points de fidélité
INSERT INTO loyalty_points (id, user_id, points_balance, points_earned, points_spent, fcfa_value, withdrawal_threshold, created_at, updated_at) VALUES
('lp-001', 'user-001', 2500, 5000, 2500, 25000, 1000, NOW(), NOW()),
('lp-002', 'user-002', 1800, 3000, 1200, 18000, 1000, NOW(), NOW()),
('lp-003', 'user-003', 5000, 8000, 3000, 50000, 1000, NOW(), NOW()),
('lp-004', 'user-004', 3200, 6000, 2800, 32000, 1000, NOW(), NOW()),
('lp-005', 'user-005', 10000, 15000, 5000, 100000, 1000, NOW(), NOW());

-- 4. Insérer des catégories de produits
INSERT INTO categories (id, name, description, parent_id, is_active, created_at, updated_at) VALUES
('cat-001', 'Électronique', 'Produits électroniques et technologiques', NULL, true, NOW(), NOW()),
('cat-002', 'Vêtements', 'Vêtements et accessoires de mode', NULL, true, NOW(), NOW()),
('cat-003', 'Maison', 'Articles pour la maison et le jardin', NULL, true, NOW(), NOW()),
('cat-004', 'Beauté', 'Produits de beauté et soins', NULL, true, NOW(), NOW()),
('cat-005', 'Sport', 'Équipements et vêtements de sport', NULL, true, NOW());

-- 5. Insérer des produits utilisateur
INSERT INTO user_products (id, vendor_id, name, description, price, original_price, currency, category, subcategory, images, stock_quantity, is_active, is_featured, is_shareable, rating, total_reviews, total_sales, total_revenue, total_shares, seo_title, seo_description, tags, weight, dimensions, shipping_cost, created_at, updated_at) VALUES
('prod-001', 'user-003', 'Smartphone Android', 'Smartphone dernière génération avec appareil photo haute résolution', 150000, 180000, 'XOF', 'cat-001', 'Téléphones', '["https://example.com/phone1.jpg", "https://example.com/phone2.jpg"]', 15, true, true, true, 4.5, 25, 50, 7500000, 120, 'Smartphone Android - Meilleur prix', 'Smartphone Android avec appareil photo haute résolution', '["smartphone", "android", "photo", "4G"]', 180, '{"length": 15, "width": 7, "height": 0.8}', 5000, NOW(), NOW()),
('prod-002', 'user-003', 'Ordinateur portable', 'Ordinateur portable performant pour le travail et les jeux', 450000, 500000, 'XOF', 'cat-001', 'Ordinateurs', '["https://example.com/laptop1.jpg"]', 8, true, false, true, 4.8, 18, 30, 13500000, 85, 'Ordinateur portable gaming', 'Ordinateur portable haute performance', '["laptop", "gaming", "performance", "SSD"]', 2500, '{"length": 35, "width": 24, "height": 2}', 8000, NOW(), NOW()),
('prod-003', 'user-004', 'T-shirt en coton', 'T-shirt confortable en coton 100% bio', 15000, 20000, 'XOF', 'cat-002', 'Hauts', '["https://example.com/tshirt1.jpg"]', 100, true, true, true, 4.2, 45, 200, 3000000, 300, 'T-shirt coton bio', 'T-shirt confortable en coton bio', '["tshirt", "coton", "bio", "confortable"]', 150, '{"length": 70, "width": 50, "height": 1}', 2000, NOW(), NOW()),
('prod-004', 'user-004', 'Jeans slim', 'Jeans moderne et élégant', 25000, 30000, 'XOF', 'cat-002', 'Bas', '["https://example.com/jeans1.jpg"]', 75, true, false, true, 4.0, 32, 150, 3750000, 180, 'Jeans slim moderne', 'Jeans slim et élégant', '["jeans", "slim", "moderne", "élégant"]', 400, '{"length": 100, "width": 35, "height": 2}', 2500, NOW(), NOW()),
('prod-005', 'user-003', 'Lampe de bureau LED', 'Lampe de bureau moderne avec éclairage LED réglable', 35000, 40000, 'XOF', 'cat-003', 'Éclairage', '["https://example.com/lamp1.jpg"]', 25, true, true, true, 4.6, 28, 80, 2800000, 95, 'Lampe bureau LED', 'Lampe de bureau LED moderne', '["lampe", "bureau", "LED", "réglable"]', 800, '{"length": 25, "width": 15, "height": 45}', 3000, NOW(), NOW());

-- 6. Insérer des commandes utilisateur
INSERT INTO user_orders (id, user_id, order_number, total_amount, currency, status, shipping_address, billing_address, payment_method, shipping_cost, tax_amount, discount_amount, notes, created_at, updated_at) VALUES
('order-001', 'user-001', 'ORD-2024-001', 155000, 'XOF', 'delivered', '123 Rue de la Paix, Abidjan', '123 Rue de la Paix, Abidjan', 'card', 5000, 7750, 0, 'Livraison en point relais', NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days'),
('order-002', 'user-001', 'ORD-2024-002', 265000, 'XOF', 'shipped', '123 Rue de la Paix, Abidjan', '123 Rue de la Paix, Abidjan', 'card', 8000, 13250, 0, 'Livraison express', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
('order-003', 'user-002', 'ORD-2024-003', 40000, 'XOF', 'processing', '456 Avenue des Fleurs, Abidjan', '456 Avenue des Fleurs, Abidjan', 'card', 2000, 2000, 0, 'Livraison standard', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
('order-004', 'user-002', 'ORD-2024-004', 180000, 'XOF', 'pending', '456 Avenue des Fleurs, Abidjan', '456 Avenue des Fleurs, Abidjan', 'card', 5000, 9000, 0, 'En attente de confirmation', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('order-005', 'user-001', 'ORD-2024-005', 75000, 'XOF', 'confirmed', '123 Rue de la Paix, Abidjan', '123 Rue de la Paix, Abidjan', 'card', 3000, 3750, 0, 'Commande confirmée', NOW() - INTERVAL '1 day', NOW());

-- 7. Insérer des chats utilisateur
INSERT INTO user_chats (id, participant1_id, participant2_id, chat_type, last_message_at, unread_count_p1, unread_count_p2, created_at, updated_at) VALUES
('chat-001', 'user-001', 'user-003', 'product_inquiry', NOW() - INTERVAL '2 hours', 0, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours'),
('chat-002', 'user-002', 'user-004', 'support', NOW() - INTERVAL '1 day', 2, 0, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
('chat-003', 'user-001', 'user-004', 'general', NOW() - INTERVAL '3 days', 0, 0, NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days');

-- 8. Insérer des messages de chat
INSERT INTO chat_messages (id, chat_id, sender_id, message_text, message_type, is_read, created_at, updated_at) VALUES
('msg-001', 'chat-001', 'user-001', 'Bonjour, votre smartphone est-il toujours disponible ?', 'text', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('msg-002', 'chat-001', 'user-003', 'Oui, il reste 15 exemplaires en stock', 'text', false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('msg-003', 'chat-002', 'user-002', 'J''ai un problème avec ma commande', 'text', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('msg-004', 'chat-002', 'user-004', 'Pouvez-vous me donner plus de détails ?', 'text', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('msg-005', 'chat-002', 'user-002', 'La commande n''est pas arrivée', 'text', false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 9. Insérer des messages utilisateur
INSERT INTO user_messages (id, sender_id, recipient_id, subject, message_text, message_type, priority, status, is_read, expires_at, created_at, updated_at) VALUES
('um-001', 'user-005', 'user-001', 'Bienvenue sur la plateforme', 'Bienvenue ! Nous sommes ravis de vous compter parmi nos utilisateurs.', 'system', 'normal', 'active', false, NOW() + INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('um-002', 'user-005', 'user-002', 'Promotion spéciale', 'Profitez de 20% de réduction sur tous les produits électroniques !', 'promotion', 'high', 'active', false, NOW() + INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('um-003', 'user-003', 'user-001', 'Réponse à votre question', 'Merci pour votre intérêt. Le produit est disponible.', 'support', 'normal', 'active', true, NOW() + INTERVAL '90 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('um-004', 'user-004', 'user-002', 'Confirmation de commande', 'Votre commande a été confirmée et sera expédiée demain.', 'order', 'normal', 'active', false, NOW() + INTERVAL '60 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('um-005', 'user-005', 'user-003', 'Nouvelle fonctionnalité', 'Découvrez notre nouvelle fonctionnalité de suivi en temps réel !', 'announcement', 'high', 'active', false, NOW() + INTERVAL '14 days', NOW(), NOW());

-- 10. Insérer des notifications utilisateur
INSERT INTO user_notifications (id, user_id, type, title, message, is_read, priority, action_url, expires_at, created_at) VALUES
('notif-001', 'user-001', 'order', 'Commande livrée', 'Votre commande ORD-2024-001 a été livrée avec succès', false, 'normal', '/orders/order-001', NOW() + INTERVAL '7 days', NOW() - INTERVAL '1 day'),
('notif-002', 'user-001', 'promotion', 'Offre spéciale', '20% de réduction sur les smartphones cette semaine', false, 'high', '/promotions', NOW() + INTERVAL '7 days', NOW() - INTERVAL '2 days'),
('notif-003', 'user-002', 'message', 'Nouveau message', 'Vous avez reçu un message de Sophie Leroy', false, 'normal', '/messages', NOW() + INTERVAL '30 days', NOW() - INTERVAL '3 days'),
('notif-004', 'user-003', 'product', 'Stock faible', 'Le stock de votre smartphone est faible (5 restants)', false, 'urgent', '/products/prod-001', NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('notif-005', 'user-004', 'system', 'Maintenance', 'Maintenance prévue le 15 janvier de 2h à 4h du matin', false, 'normal', '/maintenance', NOW() + INTERVAL '30 days', NOW() - INTERVAL '5 days'),
('notif-006', 'user-001', 'points', 'Points gagnés', 'Vous avez gagné 500 points fidélité pour votre commande', false, 'normal', '/loyalty', NOW() + INTERVAL '60 days', NOW() - INTERVAL '1 day'),
('notif-007', 'user-002', 'order', 'Commande en cours', 'Votre commande ORD-2024-003 est en cours de traitement', false, 'normal', '/orders/order-003', NOW() + INTERVAL '14 days', NOW() - INTERVAL '2 days'),
('notif-008', 'user-003', 'review', 'Nouvel avis', 'Nouvel avis 5 étoiles sur votre smartphone', false, 'normal', '/products/prod-001', NOW() + INTERVAL '90 days', NOW());

-- 11. Insérer des paramètres système
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, description, is_active, created_at, updated_at) VALUES
('setting-001', 'maintenance_mode', 'false', 'boolean', 'Mode maintenance activé/désactivé', true, NOW(), NOW()),
('setting-002', 'points_multiplier', '1.0', 'number', 'Multiplicateur de points fidélité', true, NOW(), NOW()),
('setting-003', 'max_products_per_vendor', '100', 'number', 'Nombre maximum de produits par vendeur', true, NOW(), NOW()),
('setting-004', 'order_auto_cancel_hours', '24', 'number', 'Heures avant annulation automatique des commandes', true, NOW(), NOW()),
('setting-005', 'notification_retention_days', '90', 'number', 'Jours de rétention des notifications', true, NOW(), NOW());

-- 12. Insérer des données de test supplémentaires pour les statistiques
INSERT INTO user_orders (id, user_id, order_number, total_amount, currency, status, shipping_address, billing_address, payment_method, shipping_cost, tax_amount, discount_amount, notes, created_at, updated_at) VALUES
('order-006', 'user-001', 'ORD-2024-006', 120000, 'XOF', 'delivered', '123 Rue de la Paix, Abidjan', '123 Rue de la Paix, Abidjan', 'card', 4000, 6000, 0, 'Livraison réussie', NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days'),
('order-007', 'user-002', 'ORD-2024-007', 85000, 'XOF', 'delivered', '456 Avenue des Fleurs, Abidjan', '456 Avenue des Fleurs, Abidjan', 'card', 3000, 4250, 0, 'Client satisfait', NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days'),
('order-008', 'user-001', 'ORD-2024-008', 200000, 'XOF', 'delivered', '123 Rue de la Paix, Abidjan', '123 Rue de la Paix, Abidjan', 'card', 6000, 10000, 0, 'Commande premium', NOW() - INTERVAL '75 days', NOW() - INTERVAL '70 days');

-- 13. Insérer des produits supplémentaires pour plus de variété
INSERT INTO user_products (id, vendor_id, name, description, price, original_price, currency, category, subcategory, images, stock_quantity, is_active, is_featured, is_shareable, rating, total_reviews, total_sales, total_revenue, total_shares, seo_title, seo_description, tags, weight, dimensions, shipping_cost, created_at, updated_at) VALUES
('prod-006', 'user-004', 'Sac à dos scolaire', 'Sac à dos robuste et spacieux pour écoliers', 18000, 22000, 'XOF', 'cat-002', 'Accessoires', '["https://example.com/bag1.jpg"]', 60, true, false, true, 4.3, 35, 120, 2160000, 150, 'Sac à dos scolaire', 'Sac à dos robuste pour écoliers', '["sac", "scolaire", "robuste", "spacieux"]', 800, '{"length": 40, "width": 30, "height": 15}', 2500, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
('prod-007', 'user-003', 'Casque audio sans fil', 'Casque Bluetooth avec réduction de bruit', 85000, 100000, 'XOF', 'cat-001', 'Audio', '["https://example.com/headphones1.jpg"]', 20, true, true, true, 4.7, 42, 65, 5525000, 200, 'Casque audio sans fil', 'Casque Bluetooth haute qualité', '["casque", "bluetooth", "sans fil", "audio"]', 250, '{"length": 20, "width": 18, "height": 8}', 4000, NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days'),
('prod-008', 'user-004', 'Parfum féminin', 'Parfum élégant et durable', 65000, 80000, 'XOF', 'cat-004', 'Parfums', '["https://example.com/perfume1.jpg"]', 30, true, false, true, 4.4, 28, 85, 5525000, 120, 'Parfum féminin élégant', 'Parfum durable et raffiné', '["parfum", "féminin", "élégant", "durable"]', 100, '{"length": 8, "width": 4, "height": 12}', 3000, NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days');

-- 14. Insérer des messages et notifications supplémentaires
INSERT INTO user_messages (id, sender_id, recipient_id, subject, message_text, message_type, priority, status, is_read, expires_at, created_at, updated_at) VALUES
('um-006', 'user-005', 'user-001', 'Félicitations', 'Félicitations ! Vous êtes maintenant un client VIP', 'congratulation', 'high', 'active', false, NOW() + INTERVAL '60 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('um-007', 'user-003', 'user-001', 'Suivi de commande', 'Votre commande est en route vers vous', 'order_update', 'normal', 'active', true, NOW() + INTERVAL '30 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
('um-008', 'user-004', 'user-002', 'Remerciement', 'Merci pour votre confiance !', 'thank_you', 'normal', 'active', false, NOW() + INTERVAL '45 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

INSERT INTO user_notifications (id, user_id, type, title, message, is_read, priority, action_url, expires_at, created_at) VALUES
('notif-009', 'user-001', 'points', 'Nouveau niveau', 'Félicitations ! Vous avez atteint le niveau Silver', false, 'high', '/loyalty/levels', NOW() + INTERVAL '30 days', NOW() - INTERVAL '8 days'),
('notif-010', 'user-002', 'product', 'Produit disponible', 'Le produit que vous surveillez est de nouveau en stock', false, 'normal', '/products/prod-003', NOW() + INTERVAL '7 days', NOW() - INTERVAL '4 days'),
('notif-011', 'user-003', 'system', 'Mise à jour', 'Nouvelle version de l''application disponible', false, 'normal', '/updates', NOW() + INTERVAL '60 days', NOW() - INTERVAL '6 days'),
('notif-012', 'user-004', 'review', 'Avis positif', 'Excellent avis 5 étoiles sur votre boutique', false, 'normal', '/reviews', NOW() + INTERVAL '90 days', NOW() - INTERVAL '3 days');

-- Message de confirmation
SELECT 'Données de test insérées avec succès !' as status;

-- Vérification des données insérées
SELECT 
  'Utilisateurs' as table_name,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Profils utilisateur' as table_name,
  COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 
  'Points de fidélité' as table_name,
  COUNT(*) as count
FROM loyalty_points
UNION ALL
SELECT 
  'Catégories' as table_name,
  COUNT(*) as count
FROM categories
UNION ALL
SELECT 
  'Produits' as table_name,
  COUNT(*) as count
FROM user_products
UNION ALL
SELECT 
  'Commandes' as table_name,
  COUNT(*) as count
FROM user_orders
UNION ALL
SELECT 
  'Chats' as table_name,
  COUNT(*) as count
FROM user_chats
UNION ALL
SELECT 
  'Messages de chat' as table_name,
  COUNT(*) as count
FROM chat_messages
UNION ALL
SELECT 
  'Messages utilisateur' as table_name,
  COUNT(*) as count
FROM user_messages
UNION ALL
SELECT 
  'Notifications' as table_name,
  COUNT(*) as count
FROM user_notifications
UNION ALL
SELECT 
  'Paramètres système' as table_name,
  COUNT(*) as count
FROM system_settings;
