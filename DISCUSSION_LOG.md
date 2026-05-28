# Journal de discussion (auto)

## 2026-02-24

- Synchronisation fiche produit `/product/[id]` : points d'achat via `purchaseValue` (config Super Admin), points de partage via `socialShareValue/socialSharePerNetwork`, compteur de partages via `ShareEngagementService.getProductShareCounts`.
- Réduction des overlays Next.js en dev : downgrade des logs réseau/abort en `console.warn` dans `ClientPointsService.handleSupabaseError` et dans `ProductModal`.
- Build Windows : commande `npm run build:win` (avec `NEXT_PRIVATE_MAX_WORKERS=1`) fonctionne, mais des erreurs intermittentes Windows peuvent apparaître (`EPERM .next\trace`, `spawn EPERM`).
- Fix RLS/accès public : ajout des endpoints `GET /api/public/points-config` et `GET /api/public/products/share-counts?productId=...` (Supabase admin) + mise à jour de `ShareEngagementService` pour les consommer côté client.

## 2026-03-19

- Automatisation Super Admin : suppression des données mock restantes dans l'onglet Workflows (état vide réel).
- Automatisation : ajout des tables `automation_events` et `automation_executions` + index + activation RLS dans `database-setup-new.sql`.
- APIs Super Admin : ajout de `GET /api/super-admin/automation-events` et `GET /api/super-admin/automation-executions`.
- Ingestion événements : création de `lib/automation-events.ts` (`recordAutomationEvent`) + instrumentation de `POST /api/client/orders` pour enregistrer `order.created`.
- UI : onglet Événements branché sur l'API réelle (`automation-events`) (plus de mapping sur les exécutions).
