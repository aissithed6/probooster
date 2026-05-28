# Documentation Synchronisation Super Admin

## 1. Contexte et objectifs
La refonte de la gestion des utilisateurs « super admin » visait à rétablir une synchronisation complète entre l’interface Next.js et la base Supabase. Les points clés sont :

- Suppression du mode dégradé côté UI : toutes les créations/éditions passent désormais par les API.
- Réactivation des synchronisations pour chaque sous-ensemble de données (profil, rôles secondaires, permissions, fonctionnalités, sécurité).
- Alignement du schéma Supabase avec les attentes des helpers backend.
- Sécurisation des flux pour éviter les erreurs 500/401 précédemment rencontrées.

## 2. Arborescence des fichiers impactés
- `app/api/super-admin/_helpers/users.ts`
  - Remise en service des fonctions `syncUserProfile`, `syncSecondaryRoles`, etc.
  - Ajout de `loadUserSummaryById` pour agréger les données par requêtes ciblées.
- `components/super-admin/user-management.tsx`
  - Suppression du mode dégradé, dépendance totale aux réponses API.
- Scripts Supabase (nouveau script exécuté via SQL Editor) : création/ajout de tables/colonnes support (`user_profiles`, `user_role_assignments`, `user_custom_permissions`, `user_features`, `user_security_settings`, etc.).

## 3. Flux API détaillés
### 3.1 Création d’un utilisateur (`POST /api/super-admin/users`)
1. Insertion dans `users` : email, rôle principal, statut, type de compte, indicateurs (is_verified, has_2fa, points_balance).
2. Synchronisation profil (`user_profiles`) : prénom/nom dérivés, téléphone, ville, avatar, bio, préférences JSON.
3. Synchronisation rôles
   - `syncPrimaryRoleAssignment` : entrée unique dans `user_role_assignments` avec `assignment_source = 'primary'`.
   - `syncSecondaryRoles` : nettoyage + réinsertion ordonnée (`assignment_order`) pour chaque rôle secondaire.
4. Permissions personnalisées (`user_custom_permissions`) : insertion unique par code (contrainte d’unicité `(user_id, permission_code)`).
5. Fonctionnalités activées (`user_features`) : `feature_code`, `feature_scope`, `enabled`.
6. Sécurité (`user_security_settings`) : `two_factor_enabled`, `login_notifications`, `session_timeout`.
7. Rechargement des données via `loadUserSummaryById` (voir §4) pour renvoyer un snapshot complet au front.

### 3.2 Mise à jour d’un utilisateur (`PUT /api/super-admin/users/[id]`)
1. Mise à jour conditionnelle des colonnes de `users` (les champs `undefined` sont ignorés).
2. Répétition des synchronisations pour profil, rôles, permissions, fonctionnalités, sécurité.
3. Retour du snapshot complet via `loadUserSummaryById`.

### 3.3 Contraintes et retours d’erreur
- **409 Conflict** lors de tentatives de création avec un email déjà utilisé (contrainte Supabase sur `users.email`). Message retourné : « Cette adresse e-mail est déjà utilisée ».
- Journalisation console sur les cas où un rôle secondaire n’existe pas (slug non trouvé) : l’insertion est simplement ignorée.
- Les fonctions de chargement avertissent en console (`console.warn`) si un sous-ensemble n’est pas récupéré, mais continuent avec les données disponibles.

## 4. Agrégation serveur : `loadUserSummaryById`
Pour éviter les erreurs d’embed (« Could not embed because more than one relationship… »), l’utilisateur est reconstitué en plusieurs requêtes parallèles (`Promise.all`). Les datasets sont fusionnés dans un `DbUserRecord` artificiel avant passage dans `mapUserToSummary`.

Requêtes exécutées :
- `users` (colonnes principales)
- `user_profiles`
- `user_role_assignments` (avec `roles(id, slug, name)`)
- `user_custom_permissions`
- `user_features`
- `user_security_settings`

Chaque résultat est optionnel : en cas d’erreur ponctuelle, un warning est loggé mais la réponse est construite avec les valeurs existantes.

## 5. Schéma Supabase attendu
Script exécuté le 29/10/2025 :
- Création/ajout de tables
  - `user_profiles` (JSON pour `social_media` et `preferences`).
  - `user_role_assignments` (enum `role_assignment_source`, colonnes `assignment_source`, `assignment_order`).
  - `user_custom_permissions` (contrainte unique `(user_id, permission_code)`).
  - `user_features` (colonnes `feature_code`, `feature_scope`, `enabled`).
  - `user_security_settings`.
  - `loyalty_points`, `vendor_sales` (utilisés dans les dashboards).
- Ajout de colonnes sur `users` : `account_type`, `points_balance`, `has_2fa`, `is_verified`, `last_active_at`.
- Index et triggers `set_updated_at` sur les tables critiques.

**Attention** : si de nouvelles colonnes sont ajoutées côté UI, mettre à jour les fonctions `sync*` correspondantes et le script Supabase.

## 6. Tests réalisés et résultats
| Scénario | Étapes | Résultat |
| --- | --- | --- |
| Création utilisateur complet | Formulaire super admin → API `POST /api/super-admin/users` → vérification Supabase (`SELECT` dans chaque table) | ✅ Données persistées dans toutes les tables, réponse 201, interface rafraîchie |
| Création avec email existant | Même email qu’un utilisateur Supabase | ❌ 409 Conflict (comportement attendu) |
| Édition utilisateur | Modification de profil, rôles secondaires, permissions custom, fonctionnalités, sécurité → API `PUT` | ✅ Données mises à jour en base et rafraîchies dans l’UI |
| Liste utilisateurs | `GET /api/super-admin/users?limit=200` | ✅ Utilise le select complet, aucune bascule fallback |

## 7. Points de vigilance
- Toute nouvelle relation Supabase nécessite une désambiguïsation explicite dans `USER_SELECT` (notation `!foreign_key`).
- Les colonnes `feature_scope` et `scope` doivent rester synchronisées entre script SQL, helpers et types front.
- En cas de suppression d’un utilisateur, les tables dérivées (`user_profiles`, `user_role_assignments`, etc.) sont nettoyées automatiquement via les FK `ON DELETE CASCADE`.

## 8. Suites recommandées
1. Automatisez des tests e2e couvrant les scénarios principaux (création, édition, contrôle de duplicata).
2. Centralisez ce script SQL dans un dossier `supabase/migrations` pour conserver l’historique.
3. Lors des futures évolutions (produits, inventaire, etc.), suivre la même approche : aligner le schéma, factoriser les loaders côté API, éviter les embeds ambigus.

---
**Dernière mise à jour** : 29 octobre 2025 – Cascade
