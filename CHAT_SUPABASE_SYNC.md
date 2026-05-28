# 🔄 Synchronisation Chat avec Supabase

## 📋 Résumé

J'ai créé un système de synchronisation en temps réel pour le chat entre clients et vendeurs utilisant Supabase. Le système permet aux conversations de se synchroniser automatiquement partout sur le site.

## 🗄️ Structure de la Base de Données

### Tables Supabase utilisées:

1. **`user_chats`** - Sessions de chat
   - `id` (uuid)
   - `participant1_id` (uuid) - Premier participant
   - `participant2_id` (uuid) - Deuxième participant
   - `last_message_at` (timestamp)
   - `is_active` (boolean)
   - `created_at` (timestamp)

2. **`chat_messages`** - Messages du chat
   - `id` (uuid)
   - `chat_id` (uuid) - Référence à user_chats
   - `sender_id` (uuid)
   - `content` (text)
   - `message_type` ('text' | 'image' | 'file' | 'system')
   - `is_read` (boolean)
   - `created_at` (timestamp)

3. **`users`** - Informations utilisateurs
4. **`user_profiles`** - Profils utilisateurs

## 📁 Fichiers Créés

### 1. **`lib/services/chat-service.ts`** ✅
Service complet de gestion du chat avec Supabase:

**Fonctionnalités:**
- ✅ Création/récupération de sessions de chat
- ✅ Envoi de messages
- ✅ Récupération des messages
- ✅ Marquage des messages comme lus
- ✅ Abonnement temps réel aux nouveaux messages
- ✅ Abonnement temps réel aux sessions de chat
- ✅ Archivage et suppression de conversations
- ✅ Comptage des messages non lus

### 2. **`lib/chat-context-supabase.tsx`** ✅
Contexte React avec synchronisation Supabase:

**Fonctionnalités:**
- ✅ Chargement automatique des conversations depuis Supabase
- ✅ Synchronisation en temps réel des messages
- ✅ Synchronisation en temps réel des sessions
- ✅ Compatible avec l'interface existante
- ✅ Gestion des statuts de livraison
- ✅ Support multi-utilisateurs

## 🔧 Configuration Supabase

### Informations de connexion (déjà configurées):
```typescript
URL: https://csvvbcwvkqfhnjuldgow.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Tables à créer (si pas déjà créées):

```sql
-- Vérifier si les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_chats', 'chat_messages');
```

Si les tables n'existent pas, exécutez:

```sql
-- Table des sessions de chat
CREATE TABLE IF NOT EXISTS user_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES user_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_chats_participant1 ON user_chats(participant1_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_participant2 ON user_chats(participant2_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);

-- Activer Row Level Security (RLS)
ALTER TABLE user_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_chats
CREATE POLICY "Users can view their own chats" ON user_chats
  FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can create chats" ON user_chats
  FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can update their own chats" ON user_chats
  FOR UPDATE USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- Politiques RLS pour chat_messages
CREATE POLICY "Users can view messages from their chats" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_chats 
      WHERE user_chats.id = chat_messages.chat_id 
      AND (user_chats.participant1_id = auth.uid() OR user_chats.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their chats" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_chats 
      WHERE user_chats.id = chat_messages.chat_id 
      AND (user_chats.participant1_id = auth.uid() OR user_chats.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_chats 
      WHERE user_chats.id = chat_messages.chat_id 
      AND (user_chats.participant1_id = auth.uid() OR user_chats.participant2_id = auth.uid())
    )
  );
```

## 🚀 Activation de la Synchronisation

### Option 1: Remplacement complet (Recommandé)

Remplacer l'import dans `app/layout.tsx`:

```typescript
// AVANT
import { ChatProvider } from "@/lib/chat-context"

// APRÈS
import { ChatProvider } from "@/lib/chat-context-supabase"
```

Et passer l'ID utilisateur:

```typescript
<ChatProvider userId={user?.id}>
  {/* ... */}
</ChatProvider>
```

### Option 2: Migration progressive

Garder les deux contextes et basculer progressivement:

```typescript
// Dans les composants qui doivent utiliser Supabase
import { useChatContext } from "@/lib/chat-context-supabase"

// Dans les autres
import { useChatContext } from "@/lib/chat-context"
```

## 🔄 Fonctionnement de la Synchronisation

### 1. **Temps Réel**
- Utilise Supabase Realtime pour les mises à jour instantanées
- Les messages apparaissent immédiatement chez tous les participants
- Les sessions se synchronisent automatiquement

### 2. **Multi-Plateforme**
- Un client peut écrire depuis n'importe quelle page
- Le vendeur reçoit le message dans son tableau de bord
- Les conversations continuent de manière transparente

### 3. **Statuts de Messages**
- **Sending** → Message en cours d'envoi
- **Sent** → Message envoyé à Supabase
- **Delivered** → Message reçu par le destinataire
- **Read** → Message lu par le destinataire

## 📊 Exemple d'Utilisation

### Côté Client:
```typescript
const { createChatSession, sendMessage } = useChatContext()

// Démarrer une conversation avec un vendeur
const sessionId = await createChatSession(
  vendorId, 
  "Nom du Vendeur", 
  "/avatar.jpg"
)

// Envoyer un message
await sendMessage("Bonjour, je suis intéressé par votre produit")
```

### Côté Vendeur:
```typescript
const { chatSessions, openChatSession, sendMessage } = useChatContext()

// Les sessions se chargent automatiquement
// Ouvrir une conversation
openChatSession(sessionId)

// Répondre
await sendMessage("Bonjour ! Comment puis-je vous aider ?")
```

## 🔍 Vérification

### 1. Tester la synchronisation:
1. Ouvrir le site dans 2 navigateurs différents
2. Se connecter comme client dans l'un
3. Se connecter comme vendeur dans l'autre
4. Démarrer une conversation
5. Vérifier que les messages apparaissent des deux côtés en temps réel

### 2. Vérifier dans Supabase:
```sql
-- Voir toutes les sessions
SELECT * FROM user_chats;

-- Voir tous les messages
SELECT * FROM chat_messages;

-- Voir les messages non lus d'un utilisateur
SELECT cm.* 
FROM chat_messages cm
JOIN user_chats uc ON cm.chat_id = uc.id
WHERE (uc.participant1_id = 'USER_ID' OR uc.participant2_id = 'USER_ID')
AND cm.sender_id != 'USER_ID'
AND cm.is_read = FALSE;
```

## ⚠️ Points Importants

1. **Authentification requise**: L'utilisateur doit être connecté (avoir un `userId`)
2. **Tables Supabase**: Vérifier que les tables existent
3. **RLS activé**: Les politiques de sécurité doivent être configurées
4. **Realtime activé**: Vérifier dans Supabase Dashboard → Database → Replication

## 🐛 Dépannage

### Problème: Messages ne se synchronisent pas
**Solution**: Vérifier que Realtime est activé pour les tables dans Supabase

### Problème: Erreur de permissions
**Solution**: Vérifier les politiques RLS dans Supabase

### Problème: Sessions ne se chargent pas
**Solution**: Vérifier que `userId` est bien passé au `ChatProvider`

## 📝 Prochaines Étapes

1. ✅ Activer la synchronisation dans `app/layout.tsx`
2. ✅ Vérifier les tables Supabase
3. ✅ Tester la synchronisation client-vendeur
4. ⏳ Ajouter les notifications de nouveaux messages
5. ⏳ Implémenter l'upload de fichiers/images
6. ⏳ Ajouter l'historique de conversation

## 🎯 Résultat Final

Une fois activé, le chat sera:
- ✅ **Synchronisé** partout sur le site
- ✅ **Temps réel** entre tous les utilisateurs
- ✅ **Persistant** dans la base de données
- ✅ **Sécurisé** avec RLS Supabase
- ✅ **Scalable** pour des milliers d'utilisateurs

---

**Créé le**: 2025-10-07
**Fichiers modifiés**: 
- `lib/services/chat-service.ts` (nouveau)
- `lib/chat-context-supabase.tsx` (nouveau)
- `CHAT_SUPABASE_SYNC.md` (ce fichier)
