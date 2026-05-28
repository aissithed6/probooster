# 📬 Messagerie Interne Synchronisée avec Supabase

## ✅ Système Créé

Un système complet de messagerie interne pour la communication **Admin/Super Admin ↔ Vendeurs/Clients** avec synchronisation temps réel Supabase.

---

## 📁 Fichiers Créés

### 1. **`lib/services/internal-messaging-service.ts`** ✅
Service complet de messagerie interne avec Supabase.

**Fonctionnalités:**
- ✅ Envoi/réception de messages
- ✅ Marquage comme lu
- ✅ Archivage et suppression
- ✅ Recherche dans les messages
- ✅ Filtres (catégorie, priorité, statut)
- ✅ Threads de conversation
- ✅ Notifications automatiques
- ✅ Abonnement temps réel aux nouveaux messages
- ✅ Compteur de messages non lus

### 2. **`contexts/InternalMessagingContext.tsx`** ✅
Contexte React pour la gestion globale de la messagerie.

**Fonctionnalités:**
- ✅ Chargement automatique des messages
- ✅ Synchronisation temps réel
- ✅ Gestion des états (loading, syncing)
- ✅ Actions: envoyer, répondre, archiver, supprimer
- ✅ Filtres et recherche
- ✅ Notifications toast

### 3. **`components/providers/InternalMessagingProviderWrapper.tsx`** ✅
Wrapper client pour passer l'userId automatiquement.

### 4. **`components/seller-dashboard/internal-messaging-section-synced.tsx`** ✅
Interface UI complète pour la messagerie interne (vendeurs/clients).

**Fonctionnalités UI:**
- ✅ Liste des messages avec filtres
- ✅ Statistiques (total, non lus, temps de réponse)
- ✅ Recherche en temps réel
- ✅ Nouveau message modal
- ✅ Visualisation de message
- ✅ Réponse aux messages
- ✅ Actions: archiver, supprimer, marquer comme lu
- ✅ Export CSV
- ✅ Indicateur de synchronisation

---

## 🗄️ Structure Base de Données

### Table: `user_messages`

```sql
CREATE TABLE user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'internal', -- 'internal' | 'support'
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'urgent'
  category VARCHAR(50) DEFAULT 'general', -- 'support' | 'technical' | 'billing' | 'general' | 'account'
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'archived' | 'deleted'
  parent_message_id UUID REFERENCES user_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_user_messages_sender ON user_messages(sender_id);
CREATE INDEX idx_user_messages_recipient ON user_messages(recipient_id);
CREATE INDEX idx_user_messages_status ON user_messages(status);
CREATE INDEX idx_user_messages_is_read ON user_messages(is_read);
```

### Activer Realtime

```sql
-- Activer Realtime pour user_messages
ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;
```

### Row Level Security (RLS)

```sql
-- Activer RLS
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs messages
CREATE POLICY "Users can view their own messages" ON user_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Politique: Les utilisateurs peuvent envoyer des messages
CREATE POLICY "Users can send messages" ON user_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- Politique: Les utilisateurs peuvent mettre à jour leurs messages
CREATE POLICY "Users can update their own messages" ON user_messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Politique: Les utilisateurs peuvent supprimer leurs messages
CREATE POLICY "Users can delete their own messages" ON user_messages
  FOR DELETE USING (
    auth.uid() = sender_id
  );
```

---

## 🚀 Intégration

### Étape 1: Ajouter le Provider dans `app/layout.tsx`

```tsx
import { InternalMessagingProviderWrapper } from "@/components/providers/InternalMessagingProviderWrapper"

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <NotificationProvider>
            <ChatProviderWrapper>
              <InternalMessagingProviderWrapper>
                {/* Votre contenu */}
              </InternalMessagingProviderWrapper>
            </ChatProviderWrapper>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Étape 2: Utiliser dans les Tableaux de Bord

#### Pour le Vendeur:

```tsx
// Dans app/seller-dashboard/page.tsx
import InternalMessagingSectionSynced from '@/components/seller-dashboard/internal-messaging-section-synced'

// Remplacer l'ancienne section par:
{activeTab === 'messages' && (
  <InternalMessagingSectionSynced />
)}
```

#### Pour le Client:

```tsx
// Dans app/dashboard/page.tsx
import InternalMessagingSectionSynced from '@/components/seller-dashboard/internal-messaging-section-synced'

// Ajouter dans la section messages:
{activeTab === 'messages' && (
  <InternalMessagingSectionSynced />
)}
```

#### Pour l'Admin/Super Admin:

Créer un composant similaire avec la possibilité de:
- Voir tous les messages
- Envoyer des messages à tous les utilisateurs
- Filtrer par utilisateur
- Gérer les priorités

---

## 🔄 Fonctionnement

### Scénario: Admin envoie un message au Vendeur

1. **Admin** (tableau de bord):
   ```typescript
   await sendMessage(
     vendorId,
     "Vérification de compte",
     "Votre compte a été vérifié",
     { priority: 'high', category: 'account' }
   )
   ```
   → Message envoyé à Supabase

2. **Supabase Realtime**:
   → Notifie le vendeur en temps réel

3. **Vendeur** (tableau de bord):
   → Reçoit le message instantanément
   → Notification toast affichée
   → Badge "Nouveau" sur le message
   → Compteur de messages non lus mis à jour

4. **Vendeur répond**:
   ```typescript
   await replyToMessage(messageId, "Merci pour la vérification!")
   ```

5. **Admin reçoit la réponse** en temps réel

---

## 📊 Fonctionnalités Disponibles

### Pour les Vendeurs/Clients:

- ✅ Recevoir des messages de l'admin
- ✅ Répondre aux messages
- ✅ Envoyer de nouveaux messages à l'admin
- ✅ Marquer comme lu/non lu
- ✅ Archiver les messages
- ✅ Supprimer les messages
- ✅ Rechercher dans les messages
- ✅ Filtrer par catégorie, priorité, statut
- ✅ Export CSV
- ✅ Notifications en temps réel

### Pour les Admins:

- ✅ Envoyer des messages à tous les utilisateurs
- ✅ Définir la priorité (urgente, haute, normale, basse)
- ✅ Catégoriser les messages
- ✅ Voir tous les messages
- ✅ Threads de conversation
- ✅ Statistiques globales

---

## 🎨 Interface UI

### Statistiques:
- 📊 Total des messages reçus
- 🔔 Messages non lus
- ⏱️ Temps de réponse moyen
- ⭐ Note de satisfaction

### Filtres:
- 🔍 Recherche par sujet/contenu
- 📁 Catégorie (Support, Technique, Facturation, Général, Compte)
- 🎯 Priorité (Urgente, Haute, Normale, Basse)
- 📌 Statut (Non lu, Lu, Archivé)

### Actions:
- ✉️ Nouveau message
- 💬 Répondre
- 📥 Archiver
- 🗑️ Supprimer
- ✅ Marquer comme lu
- 📤 Export CSV

---

## 🔔 Notifications

Le système crée automatiquement des notifications dans la table `user_notifications` lors de:
- Réception d'un nouveau message
- Réponse à un message
- Message urgent

---

## 🧪 Test

### 1. Créer la table dans Supabase:
Exécuter les scripts SQL ci-dessus dans SQL Editor

### 2. Activer Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;
```

### 3. Tester l'envoi:
```typescript
// Depuis le tableau de bord vendeur
await sendMessage(
  'admin-id',
  'Test de message',
  'Ceci est un test',
  { priority: 'normal', category: 'general' }
)
```

### 4. Vérifier la réception:
- Message apparaît instantanément
- Notification toast affichée
- Compteur mis à jour

---

## 📝 TODO

- [ ] Intégrer dans `app/layout.tsx`
- [ ] Créer la table `user_messages` dans Supabase
- [ ] Activer Realtime pour `user_messages`
- [ ] Configurer RLS
- [ ] Remplacer les anciennes sections de messagerie
- [ ] Créer l'interface Admin pour envoyer des messages
- [ ] Tester la synchronisation temps réel
- [ ] Ajouter les pièces jointes (optionnel)

---

**Date de création**: 2025-10-07
**Statut**: ✅ Code créé - En attente d'intégration
**Prochaine étape**: Intégrer dans les tableaux de bord
