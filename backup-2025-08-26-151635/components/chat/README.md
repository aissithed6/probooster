# Système de Chat Global - Guide d'utilisation

## Vue d'ensemble

Ce système de chat global permet la synchronisation des conversations entre tous les endroits de l'application :
- Dashboard principal
- Cartes produit
- Modals de fiche produit
- Chat global du produit
- Boutons de chat dans l'interface

## Composants principaux

### 1. GlobalChatSystem
Le composant principal qui affiche le bouton flottant et le modal du chat global.

```tsx
import { GlobalChatSystem } from '@/components/chat'

// Dans votre composant principal
<GlobalChatSystem />
```

### 2. GlobalChatTrigger
Bouton de chat réutilisable qui déclenche une conversation.

```tsx
import { GlobalChatTrigger } from '@/components/chat'

<GlobalChatTrigger
  sellerId="seller-123"
  sellerName="TechStore"
  sellerAvatar="/avatars/seller.jpg"
  product={productData}
>
  Contacter le vendeur
</GlobalChatTrigger>
```

### 3. Variantes de boutons

#### ProductGlobalChatTrigger
Pour les cartes produit avec style adapté.

#### ModalGlobalChatTrigger
Pour les modals avec style orange.

#### ListGlobalChatTrigger
Pour les listes avec style ghost.

## Intégration dans le dashboard

### Étape 1 : Ajouter le provider
Dans votre layout principal :

```tsx
import { ChatProvider } from '@/lib/chat-context'

export default function RootLayout({ children }) {
  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  )
}
```

### Étape 2 : Ajouter le système de chat
Dans votre dashboard :

```tsx
import { GlobalChatSystem } from '@/components/chat'

export default function Dashboard() {
  return (
    <div>
      {/* Votre contenu existant */}
      
      {/* Système de chat global */}
      <GlobalChatSystem />
    </div>
  )
}
```

### Étape 3 : Remplacer les boutons de chat existants
Remplacez vos boutons de chat actuels par les nouveaux composants :

```tsx
// Avant
<Button onClick={handleChat}>Chat</Button>

// Après
<GlobalChatTrigger
  sellerId={seller.id}
  sellerName={seller.name}
  sellerAvatar={seller.avatar}
  product={product}
>
  Chat
</GlobalChatTrigger>
```

## Fonctionnalités

### ✅ Synchronisation globale
- Toutes les conversations sont synchronisées
- Messages accessibles depuis n'importe où
- Historique préservé

### ✅ Référencement des produits
- Ajout automatique des produits au chat
- Bouton "Acheter" intégré
- Affichage des prix en F CFA et points

### ✅ Gestion avancée des messages
- Sélection multiple de messages
- Actions en lot (marquer comme lu, important, urgent, etc.)
- Transfert de messages entre vendeurs
- Archivage et suppression

### ✅ Interface moderne
- Design responsive
- Support des emojis
- Pièces jointes (images et documents)
- Indicateurs de statut des messages

## Structure des données

### ChatMessage
```typescript
interface ChatMessage {
  id: string
  type: 'text' | 'product' | 'image' | 'document'
  content: string
  sender: 'user' | 'seller'
  timestamp: string
  product?: any
  imageUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
}
```

### ChatSession
```typescript
interface ChatSession {
  id: string
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
  isActive: boolean
}
```

## Exemples d'utilisation

### Dans une carte produit
```tsx
<Card>
  <CardContent>
    <img src={product.image} alt={product.name} />
    <h3>{product.name}</h3>
    <p>{product.price} F CFA</p>
    
    <ProductGlobalChatTrigger
      sellerId={product.sellerId}
      sellerName={product.sellerName}
      product={product}
    />
  </CardContent>
</Card>
```

### Dans un modal
```tsx
<Dialog>
  <DialogContent>
    <h2>Fiche produit</h2>
    {/* Contenu du produit */}
    
    <ModalGlobalChatTrigger
      sellerId={product.sellerId}
      sellerName={product.sellerName}
      product={product}
    />
  </DialogContent>
</Dialog>
```

## Personnalisation

### Styles
Tous les composants utilisent Tailwind CSS et peuvent être personnalisés via les props `className`.

### Thèmes
Le système s'adapte automatiquement aux couleurs de votre application (orange-600 par défaut).

### Traductions
Les textes sont en français par défaut et peuvent être facilement modifiés dans les composants.

## Support

Pour toute question ou problème, consultez :
1. Les types TypeScript dans `lib/chat-context.tsx`
2. Les composants d'exemple dans `ChatDemo.tsx`
3. La documentation des composants UI Shadcn
