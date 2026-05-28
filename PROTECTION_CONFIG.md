# 🛡️ CONFIGURATION DE PROTECTION - NE JAMAIS SUPPRIMER

## 📁 FICHIERS CRITIQUES (CORE)
- `app/layout.tsx` - Layout principal avec providers
- `app/page.tsx` - Page d'accueil
- `lib/chat-context.tsx` - Contexte de chat global
- `components/ui/modern-notification.tsx` - Système de notifications

## 🧩 COMPOSANTS ESSENTIELS
- `components/layout/header-modular.tsx` - En-tête principal
- `components/layout/footer.tsx` - Pied de page
- `components/chat/global-chat-widget.tsx` - Widget de chat global
- `components/chat/chat-widget.tsx` - Composant de chat principal

## 🎯 SECTIONS DU TABLEAU DE BORD VENDEUR
- `components/seller-dashboard/messaging-section.tsx` - Section Messagerie
- `components/seller-dashboard/ranking-section.tsx` - Section Classement
- `components/seller-dashboard/payment-requests-section.tsx` - Section Demandes de Paiement
- `components/seller-dashboard/order-management.tsx` - Section Commandes et Ventes

## ⚠️ RÈGLES DE PROTECTION
1. **NE JAMAIS SUPPRIMER** les fichiers listés ci-dessus
2. **TOUJOURS SAUVEGARDER** avant modification
3. **TESTER** après chaque modification
4. **UTILISER** `git add` et `git commit` pour sauvegarder

## 🔄 PROCÉDURE DE RÉCUPÉRATION
Si un fichier critique est supprimé :
1. Vérifier l'historique git
2. Restaurer depuis le dernier commit
3. Vérifier la cohérence des imports
4. Tester l'application complètement

