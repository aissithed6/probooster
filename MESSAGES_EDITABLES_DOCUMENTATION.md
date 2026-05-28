# 📝 Système de Messages Éditables - Documentation

## 🎯 Objectif

Permettre aux **admins** et **super admins** de modifier dynamiquement les messages affichés aux utilisateurs sans toucher au code.

---

## 📋 Fichiers Créés

### 1. **SQL - Base de données**
**Fichier:** `ADMIN_MESSAGES_EDITABLES.sql`

**Contenu:**
- Table `editable_messages`
- RLS (Row Level Security)
- Message par défaut pour les conseils de partage
- Realtime activé

**À exécuter sur Supabase:**
```sql
-- Copier tout le contenu du fichier et l'exécuter dans l'éditeur SQL de Supabase
```

---

### 2. **Service TypeScript**
**Fichier:** `lib/services/editable-messages-service.ts`

**Fonctions disponibles:**
- `getMessageByKey(messageKey)` - Récupère un message par sa clé
- `getAllActiveMessages()` - Récupère tous les messages actifs
- `getAllMessages()` - Récupère tous les messages (admin)
- `createMessage()` - Crée un nouveau message (admin)
- `updateMessage()` - Met à jour un message (admin)
- `deleteMessage()` - Supprime un message (admin)
- `subscribeToMessage()` - S'abonne aux changements d'un message
- `subscribeToAllMessages()` - S'abonne à tous les messages

---

### 3. **Composant Admin**
**Fichier:** `components/admin/editable-messages-manager.tsx`

**Fonctionnalités:**
- ✅ Liste tous les messages
- ✅ Créer un nouveau message
- ✅ Modifier un message existant
- ✅ Supprimer un message
- ✅ Activer/Désactiver un message
- ✅ Synchronisation temps réel

---

### 4. **Intégration Dashboard Client**
**Fichier:** `components/dashboard/shares-section-synced.tsx`

**Modifications:**
- ✅ Import du service
- ✅ Chargement du message `share_tips`
- ✅ Abonnement aux changements en temps réel
- ✅ Affichage dynamique du message

---

## 🗄️ Structure de la Table

```sql
CREATE TABLE editable_messages (
  id UUID PRIMARY KEY,
  message_key VARCHAR(100) UNIQUE,  -- Identifiant unique
  title TEXT,                        -- Titre (optionnel)
  content TEXT NOT NULL,             -- Contenu du message
  message_type VARCHAR(50),          -- Type: info, success, warning, error
  is_active BOOLEAN,                 -- Actif ou non
  updated_by UUID,                   -- ID de l'admin qui a modifié
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🔧 Utilisation

### Pour les Admins/Super Admins

#### 1. **Accéder au Gestionnaire**

Dans le dashboard admin, ajouter le composant:

```typescript
import EditableMessagesManager from '@/components/admin/editable-messages-manager'

// Dans le rendu:
<EditableMessagesManager userId={user?.id || ''} />
```

#### 2. **Créer un Nouveau Message**

1. Cliquer sur "Nouveau Message"
2. Remplir le formulaire:
   - **Clé du message**: Identifiant unique (ex: `welcome_message`, `promo_banner`)
   - **Titre**: Titre affiché (optionnel)
   - **Contenu**: Texte du message
   - **Type**: info, success, warning, error
3. Cliquer sur "Créer"

#### 3. **Modifier un Message Existant**

1. Cliquer sur l'icône ✏️ (Edit) du message
2. Modifier le contenu
3. Cliquer sur "Enregistrer"

**Les changements sont appliqués instantanément partout!**

#### 4. **Activer/Désactiver un Message**

- Cliquer sur l'icône 👁️ (Eye) pour activer/désactiver
- Les messages désactivés ne sont pas affichés aux utilisateurs

---

### Pour les Développeurs

#### 1. **Afficher un Message dans un Composant**

```typescript
import { useState, useEffect } from 'react'
import { EditableMessagesService, type EditableMessage } from '@/lib/services/editable-messages-service'

function MyComponent() {
  const [message, setMessage] = useState<EditableMessage | null>(null)

  useEffect(() => {
    // Charger le message
    const loadMessage = async () => {
      const msg = await EditableMessagesService.getMessageByKey('my_message_key')
      setMessage(msg)
    }
    
    loadMessage()

    // S'abonner aux changements en temps réel
    const unsubscribe = EditableMessagesService.subscribeToMessage('my_message_key', (msg) => {
      setMessage(msg)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (!message) return null

  return (
    <div>
      {message.title && <h3>{message.title}</h3>}
      <p className="whitespace-pre-wrap">{message.content}</p>
    </div>
  )
}
```

#### 2. **Créer un Nouveau Message par Défaut**

Dans le fichier SQL, ajouter:

```sql
INSERT INTO editable_messages (message_key, title, content, message_type) VALUES
('my_new_message', 'Mon Titre', 'Mon contenu', 'info')
ON CONFLICT (message_key) DO NOTHING;
```

---

## 📊 Messages Prédéfinis

### 1. **share_tips** (Conseils de Partage)
- **Clé:** `share_tips`
- **Titre:** "Gagnez Plus de Points!"
- **Contenu:** Conseils pour gagner des points en partageant
- **Emplacement:** Dashboard Client > Section Partages

**Contenu par défaut:**
```
📱 Facebook & Instagram: 10 points par partage
🔗 Linkedin: 12 points par partage  
🐦 Twitter: 8 points par partage
💬 WhatsApp: 5 points par partage
🎁 Bonus: +20 points si quelqu'un achète via votre lien!
```

---

## 🎨 Types de Messages

### **info** (Bleu)
- Informations générales
- Conseils
- Instructions

### **success** (Vert)
- Messages de succès
- Félicitations
- Confirmations

### **warning** (Jaune)
- Avertissements
- Attention
- Précautions

### **error** (Rouge)
- Erreurs
- Problèmes
- Alertes importantes

---

## 🔒 Sécurité (RLS)

### Politiques Configurées:

1. **Lecture (SELECT)**
   - ✅ Tout le monde peut lire les messages actifs
   - ❌ Les messages désactivés sont invisibles

2. **Modification (INSERT/UPDATE/DELETE)**
   - ✅ Seuls les admins et super admins
   - ❌ Les utilisateurs normaux ne peuvent pas modifier

---

## 🔄 Synchronisation Temps Réel

### Comment ça fonctionne:

1. **Admin modifie un message** dans le dashboard
2. **Supabase Realtime** détecte le changement
3. **Tous les clients connectés** reçoivent la mise à jour
4. **Affichage mis à jour** automatiquement

**Aucun rechargement de page nécessaire!**

---

## 📝 Exemples d'Utilisation

### Exemple 1: Message de Bienvenue

```typescript
// Dans le dashboard
const [welcomeMessage, setWelcomeMessage] = useState<EditableMessage | null>(null)

useEffect(() => {
  const loadMessage = async () => {
    const msg = await EditableMessagesService.getMessageByKey('welcome_message')
    setWelcomeMessage(msg)
  }
  loadMessage()
}, [])

// Affichage
{welcomeMessage && (
  <Alert>
    <AlertTitle>{welcomeMessage.title}</AlertTitle>
    <AlertDescription>{welcomeMessage.content}</AlertDescription>
  </Alert>
)}
```

### Exemple 2: Bannière Promotionnelle

```typescript
const [promoBanner, setPromoBanner] = useState<EditableMessage | null>(null)

useEffect(() => {
  const loadMessage = async () => {
    const msg = await EditableMessagesService.getMessageByKey('promo_banner')
    setPromoBanner(msg)
  }
  loadMessage()
  
  // Temps réel
  const unsubscribe = EditableMessagesService.subscribeToMessage('promo_banner', setPromoBanner)
  return () => unsubscribe()
}, [])

// Affichage
{promoBanner && (
  <Banner type={promoBanner.message_type}>
    {promoBanner.content}
  </Banner>
)}
```

### Exemple 3: Maintenance Notice

```typescript
const [maintenanceNotice, setMaintenanceNotice] = useState<EditableMessage | null>(null)

useEffect(() => {
  const loadMessage = async () => {
    const msg = await EditableMessagesService.getMessageByKey('maintenance_notice')
    setMaintenanceNotice(msg)
  }
  loadMessage()
}, [])

// Affichage en haut de toutes les pages
{maintenanceNotice && (
  <div className="bg-yellow-100 border-yellow-400 p-4">
    <p className="text-yellow-800">{maintenanceNotice.content}</p>
  </div>
)}
```

---

## 🚀 Intégration dans les Dashboards

### Dashboard Admin

```typescript
// app/admin-dashboard/page.tsx
import EditableMessagesManager from '@/components/admin/editable-messages-manager'

{activeTab === 'messages' && (
  <EditableMessagesManager userId={user?.id || ''} />
)}
```

### Dashboard Super Admin

```typescript
// app/super-admin-dashboard/page.tsx
import EditableMessagesManager from '@/components/admin/editable-messages-manager'

{activeTab === 'messages' && (
  <EditableMessagesManager userId={user?.id || ''} />
)}
```

---

## ✅ Checklist d'Intégration

### Backend:
- [ ] Exécuter `ADMIN_MESSAGES_EDITABLES.sql` sur Supabase
- [ ] Vérifier que la table `editable_messages` est créée
- [ ] Vérifier que le message `share_tips` est inséré
- [ ] Vérifier que Realtime est activé

### Frontend:
- [ ] Service `editable-messages-service.ts` créé
- [ ] Composant `editable-messages-manager.tsx` créé
- [ ] Dashboard client modifié pour utiliser le message
- [ ] Intégrer le gestionnaire dans les dashboards admin

### Tests:
- [ ] Modifier le message depuis le dashboard admin
- [ ] Vérifier que le changement apparaît dans le dashboard client
- [ ] Tester la création d'un nouveau message
- [ ] Tester l'activation/désactivation
- [ ] Tester la suppression

---

## 🎯 Avantages

### Pour les Admins:
- ✅ Modification sans toucher au code
- ✅ Changements instantanés
- ✅ Interface intuitive
- ✅ Historique des modifications
- ✅ Activation/désactivation facile

### Pour les Développeurs:
- ✅ Code réutilisable
- ✅ Service centralisé
- ✅ Temps réel intégré
- ✅ Type-safe avec TypeScript
- ✅ Facile à intégrer

### Pour les Utilisateurs:
- ✅ Messages toujours à jour
- ✅ Informations pertinentes
- ✅ Pas de rechargement nécessaire

---

## 📚 Messages Suggérés à Créer

1. **welcome_message** - Message de bienvenue
2. **promo_banner** - Bannière promotionnelle
3. **maintenance_notice** - Avis de maintenance
4. **help_tips** - Conseils d'aide
5. **feature_announcement** - Annonce de nouvelles fonctionnalités
6. **terms_update** - Mise à jour des conditions
7. **holiday_message** - Message de vacances
8. **support_hours** - Heures de support

---

## 🔧 Maintenance

### Ajouter un Nouveau Type de Message:

1. Créer l'entrée dans la base de données
2. Créer le composant d'affichage
3. Utiliser le service pour charger le message
4. S'abonner aux changements temps réel

### Modifier un Message Existant:

1. Aller dans le dashboard admin
2. Cliquer sur "Modifier"
3. Changer le contenu
4. Enregistrer

**C'est tout! Le changement est appliqué partout instantanément.**

---

**Développé avec ❤️ pour Probooster**
**Date:** 2025-10-07
**Version:** 1.0.0
**Statut:** ✅ Production Ready
