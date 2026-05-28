# Historique de discussion (auto-save)

> Fichier destiné à conserver une trace des échanges et décisions techniques.
> Alimentation via `POST /api/internal/chat-history/append`.


---
## 2026-03-09T18:43:00.000Z

- **Objectif**: Ajouter une nouvelle section Super Admin "Partages & Engagements" juste après la section "Points & Fidélité".
- **Déjà existant (retrouvé)**:
- Service: `lib/services/share-engagement-service.ts` (record share, eligibility, analytics, realtime, sync points).
- Contexte: `contexts/ShareEngagementContext.tsx`.
- UI vendeur: `components/seller-dashboard/shares-engagement-section-synced.tsx`.
- API Super Admin:
- `GET /api/super-admin/shares/summary`
- `GET /api/super-admin/shares/list`
- `GET /api/super-admin/shares/interactions`
- API publique record/eligibility:
- `POST /api/shares/record`
- `GET /api/shares/eligibility`
- **Implémenté**:
- Nouveau composant: `components/super-admin/shares-engagement.tsx`.
- Intégration dashboard: `app/super-admin-dashboard/page.tsx` (menu + allowedSections + rendu `renderSectionContent`).
- **Nouvelle section** id: `shares-engagement` (placée juste après `loyalty`).
- **UI/UX**: onglets (Analyses / Partages / Interactions), filtres (dates, plateforme, recherche, IDs), pagination, exports CSV.
- **Auto-save discussion**:
- Endpoint: `POST /api/internal/chat-history/append` (append dans `logs/chat-history.md`).
- Script Windows: `tools/chat-autosave.ps1` (envoie le presse-papiers toutes les 60s).

---

## 2026-03-09T18:53:00.000Z

- **Amélioration UX (Super Admin > Partages & Engagements)**: ajout d’un **modal moderne** au clic sur un partage.
- **Fichier**: `components/super-admin/shares-engagement.tsx`.
- **Comportement**:
- Clic sur une carte partage => ouverture d’un `Dialog` responsive.
- Affiche les infos: utilisateur, produit, vendeur, plateforme, date, lien, points gagnés.
- Charge en live les interactions détaillées via `GET /api/super-admin/shares/interactions?shareId=...` (pageSize=200).
- `Ouvrir lien` n’ouvre plus le modal (stopPropagation).

---

## 2026-03-09T19:25:00.000Z

- **Objectif**: Réutiliser le même modal “Détails du partage” côté **Super Admin**, **Vendeur** et **Client**, et ajouter des actions **Copier** / **Ouvrir** le lien dans la liste.
- **Composant partagé**:
- `components/shares/share-details-dialog.tsx` (`ShareDetailsDialog`) + types `ShareDetailsDialogShare` / `ShareDetailsDialogInteraction`.
- **API (interactions non super-admin)**:
- `GET /api/shares/interactions?shareId=...` (auth requise + vérifie que le share appartient à l'utilisateur ou au vendeur).
- **Intégrations UI**:
- Super Admin: `components/super-admin/shares-engagement.tsx` => utilise désormais `ShareDetailsDialog`.
- Vendeur: `components/seller-dashboard/shares-engagement-section-synced.tsx` => ligne partage cliquable + boutons Copier/Ouvrir (avec `stopPropagation`) + modal.
- Client: `components/dashboard/shares-section-synced.tsx` => ligne partage cliquable + boutons Copier/Ouvrir (avec `stopPropagation`) + modal (onglet Historique).
- **Sauvegarde discussion**:
- Script PowerShell: `tools/chat-backup-to-desktop.ps1` => copie `logs/chat-history.md` vers le Bureau Windows.

---

## 2026-03-14T17:38:00.000Z

- **Objectif**: Synchroniser “Avis & Réputation” côté vendeur avec Supabase (sans mock) pour les actions **Répondre** et **Signaler** sur les avis produits.
- **API ajoutée (Vendor)**:
- `POST /api/vendor/reviews/product/[reviewId]/reply` => upsert dans `product_review_responses` avec `status = "pending"` (validation Super Admin).
- `POST /api/vendor/reviews/product/[reviewId]/flag` => insert dans `product_review_flags` (reason parmi `inappropriate|spam|fake|harassment|other`).
- **Dashboard API enrichie**:
- `GET /api/vendor/dashboard` joint désormais `product_review_responses` et `product_review_flags` pour alimenter `sellerReply`, `replyCount`, `flags` et `status = flagged` si flag `open|investigating`.
- **UI wiring (Seller dashboard)**:
- `app/seller-dashboard/page.tsx` branche `handleReviewReply` et `handleReviewFlag` sur ces endpoints, affiche un toast de succès/erreur, puis `refreshData()`.

---

## 2026-03-14T18:11:00.000Z

- **Objectif**: Activer la **modération Super Admin** des réponses vendeurs et des signalements d’avis produits, en supprimant les mocks et en synchronisant 100% avec Supabase.
- **API Super Admin ajoutée**:
- `POST /api/super-admin/reviews/responses/[responseId]/approve` => met `product_review_responses.status = approved` (+ event best-effort dans `product_review_moderation_events`).
- `POST /api/super-admin/reviews/responses/[responseId]/reject` => met `product_review_responses.status = rejected` (+ raison en payload event best-effort).
- `POST /api/super-admin/reviews/flags/[flagId]/investigate` => met `product_review_flags.status = investigating`.
- `POST /api/super-admin/reviews/flags/[flagId]/resolve` => met `product_review_flags.status = resolved`.
- `POST /api/super-admin/reviews/flags/[flagId]/dismiss` => met `product_review_flags.status = dismissed`.
- **API Super Admin enrichie**:
- `GET /api/super-admin/reviews` inclut désormais `response` (depuis `product_review_responses`) + `reports` (liste des flags depuis `product_review_flags`) + stats `flaggedReviews` et `responseRate`.
- **UI Super Admin**:
- `components/super-admin/reviews-reputation.tsx` charge désormais `reports` depuis l’API (plus de `setReports([])`), remplace la liste mock de l’onglet **Réponses** par les réponses DB, et branche les actions (approve/reject, investigate/resolve/dismiss) avec refresh (`reloadReviews()`) + notifications.

---

## 2026-03-14T19:05:00.000Z

- **Objectif**: Supprimer les derniers mocks côté **Super Admin > Avis & Réputation** (Avis Vidéo + Règles/Configuration + champs vides), et persister les actions.
- **API Super Admin ajoutée**:
- `POST /api/super-admin/reviews/responses/[responseId]/request-modifications` => enregistre une demande de modifications (event best-effort `response_modifications_requested`).
- `POST /api/super-admin/reviews/[reviewId]/moderate` => enregistre une action de modération d’avis (event best-effort `review_approve|review_reject|review_flag|review_edit`).
- **API Super Admin enrichie**:
- `GET /api/super-admin/reviews` complète désormais `response.vendorName` et `reports.reporterName` via `user_profiles` (plus de noms vides).
- **UI Super Admin** (`components/super-admin/reviews-reputation.tsx`):
- Onglet **Avis Vidéo**: suppression des cartes hardcodées; affiche les avis vidéo réels si `isVideo=true`, sinon un empty-state.
- Modales **Règles de Modération** et **Configuration des Avis Clients**: lecture/écriture via `GET/PUT /api/super-admin/settings` (scope `global`, section `settings.reviews`). Switches désormais contrôlés par états React (plus de logique fragile `dataset.state`).
- Modale **Modération d’Avis**: bouton *Appliquer la Modération* branché sur l’API `/moderate` + refresh `reloadReviews()`.
