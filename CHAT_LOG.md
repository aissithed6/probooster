# Journal de discussion (auto-sauvegarde)

> Objectif: conserver un historique des échanges afin d’éviter toute perte en cas de fermeture de l’IDE ou d’arrêt du PC.

## Contexte courant
- Problème bloquant initial: crash natif pendant `next build` sur Windows: `Next.js build worker exited with code: 3221225477 (0xC0000005)`.
- Stack: Next.js `15.2.4`, React `^19`, Yarn `1.22.22`.

## Dernières actions connues
- Corrections JSX dans `components/layout/header-cart.tsx`.
- Refactor `/auth/register` pour `useSearchParams()` (Server Component + Client Component sous `Suspense`).
- Contournement du crash SWC: minification désactivée (warning Next "minification-disabled").
- Corrections de prerender (imports d’icônes, `useSearchParams` sous `Suspense`, providers manquants, etc.).
- Build `npx next build` OK (139/139 pages générées).
- Neutralisation des routes de test en production via `middleware.ts` (bloque `/test`, `/test-*`, `/demo-*` en production).

## Livraison / panier (en cours)
- Total final panier désormais calculé comme: `produits - promo/points + frais de livraison` (livraison affichée séparément).
- Calcul des frais livraison en live: zone/mode/champs géo + changements du panier.
- Option d'agrégation multi-vendeurs `max/sum`: défaut super-admin via `/api/public/delivery-config`, override client si autorisé.
- Persistance checkout livraison: `localStorage` (clé `probooster_delivery_checkout_v1`) + tentative de sync via `PATCH /api/client/deliveries/preferences` (dans `metadata.checkout`).

## Dernières actions (2026-02-11)
- Le checkout envoie désormais `delivery: { zone, method, aggregation, geo* }` dans `POST /api/client/orders` (HeaderCart).
- L'API `POST /api/client/orders` recalcule désormais server-side:
  - configuration super-admin (`super_admin_settings.settings.deliveryRules` + `freeShippingConfig`)
  - fallback checkout depuis `delivery_preferences.metadata.checkout` si le payload delivery est absent/incomplet
  - coût de livraison (règles) + livraison gratuite (standard uniquement), puis persiste dans `orders.shipping_address.metadata.delivery`.
- Correction: `POST /api/client/orders` renvoie maintenant un `401` si erreur d'auth (au lieu d'un `500`).
