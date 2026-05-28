# Journal des échanges (auto)

## 2026-02-10

- Refonte du modal **Gestion des Livraisons** (HeaderCart) selon le flux demandé.
- Ajout du choix **Mode** (standard/express) + **Zone** (local/national/régional/international) à l’étape 1.
- Étape 2 simplifiée: résumé + agrégation (max/sum) + détail par produit + choix **Livraison programmée**.
- Étape 3: choix date/créneau + résumé final.
- Moteur de matching des règles étendu pour gérer `country` (international) et `regionDepartment` (régional) avec priorité "la plus spécifique gagne".
