-- Indexes pour améliorer les performances des requêtes publiques d'offres/promotions

-- Index temporels et statut pour filtrer rapidement les promos actives
create index if not exists idx_promotions_status on public.promotions (status);
create index if not exists idx_promotions_start_date on public.promotions (start_date);
create index if not exists idx_promotions_end_date on public.promotions (end_date);

-- Index GIN sur les tableaux d'applicabilité (produits, catégories, vendeurs)
-- Remarque: nécessite que les colonnes soient bien de type array
create index if not exists idx_promotions_applicable_products_gin on public.promotions using gin (applicable_products);
create index if not exists idx_promotions_applicable_categories_gin on public.promotions using gin (applicable_categories);
create index if not exists idx_promotions_applicable_vendors_gin on public.promotions using gin (applicable_vendors);
