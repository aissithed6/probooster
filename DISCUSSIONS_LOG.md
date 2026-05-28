# Journal des discussions (auto)

## 2026-02-15 — Intégration des messages système automatiques dans le chat livraison et amélioration UI type WhatsApp dans DeliveryChatReplacement

- **Objectif**: améliorer l'expérience utilisateur du chat livraison en intégrant des messages système automatiques et en adoptant une interface utilisateur inspirée de WhatsApp.
- **Fonctionnalités**:
  - Ajout de messages système automatiques dans le chat livraison (table `delivery_chat_messages`) lors des étapes:
    - acceptation (`/api/driver/deliveries/[id]/accept`)
    - refus (`/api/driver/deliveries/[id]/reject`)
    - arrivée à destination (`/api/driver/deliveries/[id]/arrived`)
    - livraison effectuée (`/api/driver/deliveries/[id]/delivered`)
  - Amélioration du composant `components/chat/DeliveryChatReplacement.tsx` en mode UX “WhatsApp”:
    - bulles gauche/droite, affichage du nom + “Vous”, messages système centrés
    - aperçu participants (résolution via `delivery_chat_participants` + `user_profiles`)
    - scroll auto sur le dernier message

## 2026-02-13 — Normalisation affichage adresses livraisons

- **Problème**: dans les dashboards Livraisons (vendeur / client / livreur), le champ **Adresse** s'affichait en JSON brut (ex: `{ "customer_email": ..., "customer_phone": ..., "delivery_address": ... }`).
- **Cause**: les routes API `/api/*/deliveries` formataient `orders.shipping_address` via `formatShippingAddress` qui ne supportait pas le nouveau format normalisé (`customer_email`, `customer_phone`, `delivery_address`) et retombait sur `JSON.stringify`.
- **Fix**: amélioration de `formatShippingAddress` pour:
  - parser les strings JSON (`"{...}"`) en objet,
  - concaténer `customer_email`, `customer_phone`, `delivery_address` (ou `deliveryAddress`),
  - garder la compatibilité legacy en extrayant aussi les champs d'adresse classiques.
- **Fichiers modifiés**:
  - `app/api/vendor/deliveries/route.ts`
  - `app/api/driver/deliveries/route.ts`
  - `app/api/client/deliveries/route.ts`
  - `app/api/super-admin/deliveries/route.ts` (+ typage `normalizedBase` pour éviter implicit-any)


## 2026-02-13 — Workflow livreur (events + preuve photo + arrivée)

- **Objectif**
  - Tracer les actions livreur (arrivée + livraison effectuée) et stocker une preuve photo liée à la livraison/commande.
  - Notifier client / vendeur / super-admin lors des jalons.

- **DB / SQL**
  - Ajout migration `supabase/migrations/20260215_delivery_proofs_and_events.sql`:
    - `public.delivery_events` (si absente) + indexes + RLS (parties prenantes + super-admin)
    - `public.delivery_proofs` + RLS (lecture: super-admin + client)
    - bucket Storage `delivery-proofs`
    - colonnes `arrived_at`, `driver_delivered_at`, `client_received_at` sur `public.deliveries`
  - **Correction**: la partie `storage.objects` est rendue **non bloquante** (DO/EXCEPTION) pour éviter l'erreur Supabase "must be owner of table objects".

- **API**
  - `POST /api/driver/deliveries/[id]/arrived`:
    - update `deliveries.arrived_at`
    - insert event `driver_arrived`
    - notifications via `user_notifications`
  - `POST /api/driver/deliveries/[id]/delivered`:
    - upload image dans bucket `delivery-proofs`
    - insert `delivery_proofs`
    - update `deliveries.driver_delivered_at` + `status='delivered'`
    - insert event `driver_delivered`
    - notifications via `user_notifications`

- **UI livreur**
  - `app/driver-dashboard/page.tsx`:
    - modal motif de refus (motif obligatoire)
    - boutons "Arrivé à destination" + "Livraison effectuée" (capture caméra via input file)


## 2026-02-11 — Livraison gratuite (spécifications)

- **Objectif**
  - Ajouter un 3e onglet **"Livraison gratuite"** dans **Super Admin → Gestion des livraisons**.
  - Le Super Admin peut définir des règles détaillées (produits / catégories / vendeurs / zones / seuils quantité/prix), activer/désactiver globalement et par règle.
  - Application automatique au **panier/commande** côté client.
  - Affichage côté vendeur dans le modal produit : **badge + détails**, section livraison **grisée** (lecture seule) si gérée par Super Admin.

- **Décisions fonctionnelles**
  - **Livraison gratuite = 0 FCFA** uniquement pour le **mode Standard**.
  - Si le client choisit **Express** : **pas de gratuité** (Express reste payant).
  - Les règles peuvent appliquer la gratuité :
    - **par produit** (une partie du panier gratuite)
    - ou **par commande** (si seuil atteint, commande gratuite)
  - Les conditions (seuils) peuvent se baser sur :
    - **total panier**
    - ou **items éligibles** (selon la règle)
  - Résolution des conflits : **priorité numérique `priority`** (contrôle manuel)
  - Zones : support **détaillé** (local + national hiérarchisé), en cohérence avec `deliveryGeo`.

- **Technique / stockage**
  - Stockage dans `super_admin_settings` (scope `global`) via `settings.freeShippingConfig`.
  - Exposition au front via `/api/public/delivery-config`.
  - Devise de seuil : **FCFA**, conversion multi-devise prévue plus tard.

## 2026-02-11 — Livraison gratuite (implémentation Super Admin)

- **UI Super Admin**
  - Ajout d’un 3e onglet **"Livraison gratuite"** dans `components/super-admin/delivery-management.tsx`.
  - Activation globale `freeShippingConfig.enabled` + CRUD de règles (titre, priorité, seuil montant/quantité, portée du seuil).

- **Catégories (sélection par nom)**
  - Chargement des catégories via `/api/super-admin/categories`.
  - Sélection affichée par **nom**, stockage en **UUID** (`categoryIds`).

## 2026-02-11 — Livraison gratuite (extension ciblage)

- **Ciblage complet (flexible)**
  - Ajout champs de ciblage par **Produits** (`productIds`), **Vendeurs** (`vendorIds`) et **Zones** (`zone + localDistrict/department/city/arrondissement/district`) en plus des catégories.
  - Rappel: pour cibler **tous les produits**, laisser produits/catégories/vendeurs vides et Zone = "Toutes".

## 2026-02-11 — Application côté panier (HeaderCart)

- **Calcul livraison gratuite (config Super Admin)**
  - `HeaderCart` charge `freeShippingConfig` depuis `/api/public/delivery-config`.
  - Application **Standard uniquement** (Express reste payant).
  - Critères combinés en logique **ET** : produits, catégories, vendeurs, zones.
  - Seuils montant/quantité supportés + portée `cart_total` vs `eligible_items`.
  - Résolution par priorité (plus petit d'abord), première règle qui match => appliquée.

