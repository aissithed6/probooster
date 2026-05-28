# Journal de session (auto)

- Dernière mise à jour: 2026-02-09

## Notes

- Ce fichier sert à conserver un historique des actions réalisées dans l’IDE (résumés).
- Auto-save (les 2 options):
  - Append dans ce fichier + copie sur le Bureau: lance `scripts\\cascade-autosave.bat` (Windows) ou `scripts\\cascade-autosave.ps1` (PowerShell).
  - Le script ajoute une ligne "Auto-save heartbeat" toutes les 60s et copie ce fichier vers `Desktop\\MP1_CASCADE_LOG.md`.

## 2026-02-10

- Ajout des champs `deliveries(...)` dans les requêtes de commandes (repository + API vendeur) pour piloter l’état de livraison.
- Super-admin: ajout UI indicateur/bouton livraison (à créer clignotant, programmée grisée, livré badge), + POST /api/super-admin/deliveries (status=pending) et refresh.
- Vendeur: ajout UI indicateur non cliquable avec les mêmes états, + extension type `SellerOrder.deliveries`.
- Backend auth: ajout `assertOpsOrSuperAdmin` et activation des endpoints `/api/super-admin/orders` + `/api/super-admin/deliveries` pour le rôle `ops`.
