## 1. Synchronisation Super Admin – récapitulatif rapide

- **API & Base alignées** : `createUserAdmin` et `updateUserAdmin` orchestrent désormais profil, rôles multiples, permissions, fonctionnalités, sécurité et relisent en une seule vue via `loadUserSummaryById`.
- **Schéma Supabase** : tables auxiliaires (`user_profiles`, `user_role_assignments`, `user_custom_permissions`, `user_features`, `user_security_settings`) recréées, colonnes ajoutées sur `users`, triggers `set_updated_at` actifs.
- **Tests menés** : création, édition, duplication, filtres → OK ; gestion des erreurs 409 (email dupliqué) documentée.
- **Documentation détaillée** : voir `DOCUMENTATION_SUPER_ADMIN_SYNCHRONISATION.md`.

⚠️ **État actuel produits** : aucune API super-admin n’est implémentée. Les composants (super admin, vendeur, client) fonctionnent encore avec des données simulées ou des services partiels. Les étapes suivantes visent à combler cette lacune avant de brancher réellement la UI.

## 2. Gestion des produits – structure actuelle (mock)

### 2.1 Architecture UI
- **Composant principal** : `components/super-admin/product-management.tsx`.
- **Modal réutilisé** : `AdvancedProductModal` (seller dashboard) pour création/édition.
- **Séparation logique** :
  1. En-tête + actions globales (création produit, export CSV/XLS/PDF).
  2. Barre de filtres (texte + Statut + Catégorie + Vendeur).
  3. Barre d’actions en lot (selon sélection et onglet).
  4. Navigation par onglets (All, Active, Pending, Reported, Featured, Low-stock, Draft).
  5. Liste de cartes produits (mock) avec menu contextuel (dupliquer, statuts, signaler, supprimer…).
  6. Modaux : création/édition via `AdvancedProductModal`, visualisation via `Dialog` interne.

### 2.2 Jeu de données actuel (mock)
- Trois produits hardcodés (`useEffect` initial).
- Attributs gérés : pricing complet, SEO, social media, stock, vendor, statut, tags, rating, etc.
  → aucun appel API réel pour l’instant.

### 2.3 Onglets & actions détaillés
| Onglet | Source | Actions disponibles |
| --- | --- | --- |
| Tous | `filteredProducts` | Dupliquer, changer statut (active/inactive/pending/draft/reported), exporter, suppression |
| Actifs | `status === 'active'` | idem Tous |
| En attente | `status === 'pending'` | Activer, Inactiver, Brouillon, Signalé, Dupliquer |
| Signalés | `status === 'reported'` | Activer, Inactiver, En attente, Brouillon, Dupliquer |
| Vedettes | `featured === true` | Dupliquer, changer statut + marquer signalé |
| Stock faible | `stock <= stockAlert` | Dupliquer, statuts, signaler |
| Brouillons | `status === 'draft'` | Activer, Inactiver, En attente, Signalé, Dupliquer |

### 2.4 Exports
- Formats : CSV, Excel (TSV renommé .xls), HTML (pour impression/PDF).
- Fonctionnement : export soit de la sélection, soit du filtre courant.
- À formaliser côté backend : endpoint REST / job asynchrone si dataset volumineux.

### 2.5 Bulk actions & sélection multiple
- `selectedProducts` (Set), `selectAll`, `showBulkActions`.
- `handleBulkAction` exécute en séquence des actions simulées (à brancher sur API). Actions : duplicate, changement de statut (inactive/pending/draft/reported/active), delete.

### 2.6 Menu contextuel par produit
- Boutons directs : Voir, Éditer, Vedette toggle, Supprimer.
- Menu déroulant `MoreHorizontal` : dupliquer, changer statut (inactive/pending/draft), signaler.

## 3. Écarts / besoins pour la phase backend

1. **Chargement réel des produits**
   - Implémenter `SuperAdminDashboardService.getProducts` (pagination, filtres, tri).
   - Créer endpoint `/api/super-admin/products` avec query params.
   - Mapper tables Supabase : `user_products`, `users` (vendor), `product_media`, `product_tags`, `product_seo`, `product_statistics`…

2. **Création / édition**
   - Brancher `AdvancedProductModal` sur endpoints `POST/PUT /api/super-admin/products`.
   - Gérer upload média + relations tags/categories.
   - Ajouter validations (prix, stock, statuts, SEO).

3. **Actions en lot**
   - Endpoints dédiés ex : `POST /api/super-admin/products/bulk` (body { action, productIds }).
   - Gestion transactionnelle pour duplication et changement de statut.

4. **Exports**
   - Génération côté serveur (CSV/Excel/PDF) + téléchargement signé.
   - Ajouter indicateurs de progression (si >500 lignes).

5. **Notifications & audit**
   - Remplacer `console.log`/`alert` par système toast + log d’audit (qui fait quoi, quand ?).

6. **Gestion des statuts / signalements**
   - Définir table `product_moderation_logs` (super admin, motif, timestamps).
   - API pour ajouter/lever un signalement.

7. **Performance & filtrage**
   - Ajouter index (status, vendor_id, category, featured).
   - Support tri (date, ventes, stock) côté UI + API.

8. **Sécurité & permissions**
   - Réutiliser `assertSuperAdmin`.
   - Envisager rôle `moderator`.

## 4. Prochaines actions recommandées

1. Définir schéma cible Supabase pour produits (tables, vues, triggers, RLS).
2. Exposer endpoints REST correspondants (GET list/detail, POST, PUT, DELETE, bulk, export).
3. Connecter le composant à ces endpoints (remplacer mocks, gérer loaders & erreurs).
4. Ajouter tests (unit, integration, e2e) couvrant workflows super admin.
5. Documenter la section « Gestion des produits » après implémentation.

---
**Statut** : analyse terminée – prêt pour la conception API/BD produits.
