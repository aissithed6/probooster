-- Ajout de champs produit pour garantie et politique de retour
-- Objectif: alimenter l'affichage client (fiche produit, panier, commande, reçu) avec des données réelles.

alter table public.user_products
  add column if not exists warranty text null,
  add column if not exists return_policy text null;
