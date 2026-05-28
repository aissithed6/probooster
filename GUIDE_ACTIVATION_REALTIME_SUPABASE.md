# 🔴 Guide d'Activation Realtime dans Supabase

## ✅ Synchronisation Activée !

La synchronisation chat avec Supabase est maintenant **ACTIVE** dans votre application.

**Fichier modifié**: `app/layout.tsx`
- ✅ Import du ChatProvider avec Supabase
- ✅ userId passé automatiquement au ChatProvider

---

## 📋 Étapes pour Activer Realtime dans Supabase

### Étape 1: Se Connecter à Supabase

1. Allez sur: **https://supabase.com**
2. Connectez-vous à votre compte
3. Sélectionnez votre projet: **csvvbcwvkqfhnjuldgow**

### Étape 2: Activer Realtime pour les Tables

#### Option A: Via l'Interface Supabase (Recommandé)

1. **Dans le menu de gauche**, cliquez sur **"Database"**
2. Cliquez sur **"Replication"** (ou "Publications")
3. Vous verrez une section **"supabase_realtime"**
4. Activez les tables suivantes:
   - ✅ Cochez **`user_chats`**
   - ✅ Cochez **`chat_messages`**
5. Cliquez sur **"Save"** ou **"Update"**

#### Option B: Via SQL Editor

1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New Query"**
3. Copiez et collez ce code:

```sql
-- Activer Realtime pour user_chats
ALTER PUBLICATION supabase_realtime ADD TABLE user_chats;

-- Activer Realtime pour chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

4. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter)
5. Vous devriez voir: **"Success. No rows returned"**

### Étape 3: Vérifier que Realtime est Activé

1. Retournez dans **Database** → **Replication**
2. Vérifiez que les tables apparaissent dans la liste:
   - ✅ `user_chats` (avec une coche verte)
   - ✅ `chat_messages` (avec une coche verte)

### Étape 4: Vérifier les Tables (Important!)

Vérifiez que les tables existent dans votre base de données:

1. Allez dans **Database** → **Tables**
2. Cherchez:
   - ✅ `user_chats`
   - ✅ `chat_messages`

**Si les tables n'existent PAS**, exécutez ce SQL:

```sql
-- Table des sessions de chat
CREATE TABLE IF NOT EXISTS user_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

### Étape 5: Configurer Row Level Security (RLS)

**Important pour la sécurité!**

1. Dans **SQL Editor**, exécutez:

```sql
-- Activer RLS
ALTER TABLE user_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_chats
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

-- Politiques pour chat_messages
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

---

## 🧪 Test de la Synchronisation

### Test 1: Vérification Basique

1. Ouvrez votre application
2. Connectez-vous en tant que **client**
3. Ouvrez la console du navigateur (F12)
4. Cherchez des messages comme:
   - `"🔍 Tentative de récupération..."`
   - `"Chargement des sessions chat..."`

### Test 2: Test Temps Réel

1. **Navigateur 1**: Connectez-vous comme **client**
2. **Navigateur 2**: Connectez-vous comme **vendeur** (même vendeur que le client contacte)
3. **Client**: Envoyez un message au vendeur
4. **Vendeur**: Le message devrait apparaître **instantanément** dans son tableau de bord

### Test 3: Vérification dans Supabase

1. Allez dans **Database** → **Table Editor**
2. Sélectionnez la table **`chat_messages`**
3. Envoyez un message depuis l'application
4. **Actualisez** la table → Le message devrait apparaître

---

## ❓ Dépannage

### Problème: "Realtime not enabled"

**Solution**:
1. Vérifiez que Realtime est activé (Étape 2)
2. Attendez 1-2 minutes après activation
3. Redémarrez votre application: `npm run dev`

### Problème: "Permission denied"

**Solution**:
1. Vérifiez que RLS est configuré (Étape 5)
2. Vérifiez que l'utilisateur est bien connecté
3. Vérifiez les politiques dans **Authentication** → **Policies**

### Problème: Tables n'existent pas

**Solution**:
1. Exécutez les scripts SQL de l'Étape 4
2. Vérifiez dans **Database** → **Tables**

### Problème: Messages ne se synchronisent pas

**Solution**:
1. Ouvrez la console (F12)
2. Cherchez les erreurs
3. Vérifiez que `userId` est bien défini
4. Vérifiez la connexion Supabase

---

## 📊 Vérification Finale

### Checklist Complète:

- [ ] **Realtime activé** pour `user_chats`
- [ ] **Realtime activé** pour `chat_messages`
- [ ] **Tables créées** dans Supabase
- [ ] **RLS configuré** avec les politiques
- [ ] **Application redémarrée** (`npm run dev`)
- [ ] **Test effectué** entre client et vendeur
- [ ] **Messages synchronisés** en temps réel

---

## 🎯 Résultat Attendu

Une fois tout configuré:

✅ **Client écrit** → Message envoyé à Supabase
✅ **Supabase Realtime** → Notifie le vendeur
✅ **Vendeur reçoit** → Message apparaît instantanément
✅ **Vendeur répond** → Client reçoit en temps réel
✅ **Historique sauvegardé** → Persistant dans la base de données

---

## 📞 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs Supabase (Database → Logs)
3. Consultez: `CHAT_SUPABASE_SYNC.md` pour plus de détails

---

**Date de création**: 2025-10-07
**Statut**: ✅ Synchronisation ACTIVE
**Prochaine étape**: Activer Realtime dans Supabase Dashboard
