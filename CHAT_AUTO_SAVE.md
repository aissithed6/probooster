# Chat auto-save

- Date: 2026-02-19
- Contexte: Synchronisation du chat client/vendeur et supervision super-admin.

## Changements appliqués

- `components/super-admin/messaging-chat-synced.tsx`
  - Correction `formatDate`: évite l'affichage "Hier" pour un message d'aujourd'hui et affiche l'heure (Aujourd'hui/Hier + HH:MM, sinon date+heure).

- `components/product/product-modal.tsx`
  - La section chat inline (bas de fiche produit) n'utilise plus l'envoi simulé.
  - Ouverture/création automatique d'une session Supabase via `useChatContext` quand le modal est ouvert.
  - Affichage synchronisé avec `activeChatSession` + `messages` du ChatContext.
  - Envoi via `sendMessage` du ChatContext.
  - Correction du "clignotement" de l'historique: on évite d'écraser les messages affichés quand `syncedMessages` est temporairement vide (transition/refresh).

## TODO restant

- Ajouter l'envoi de messages depuis le dashboard super admin (Boutique) dans `MessagingChatSynced` + endpoint `POST /api/super-admin/chats/[chatId]/messages`.
- Tests manuels de toutes les entrées chat pour confirmer même `chatId` + temps réel côté super admin.
