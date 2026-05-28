# ✅ Section Messages Conseils - Tableau de Bord Admin

## 🎉 AJOUT TERMINÉ!

Date: 2025-10-07 20:56
Statut: ✅ **EN COURS - À FINALISER**

---

## 📋 Ce qui a été fait

### 1. **Ajout dans le Tableau de Bord Super Admin** ✅
- **Fichier:** `app/super-admin-dashboard/page.tsx`
- **Import ajouté:** `EditableMessagesManager` et `useAuth`
- **Nouvelle section:** "Messages Conseils" avec icône `MessageCircleMore`
- **Couleur:** Teal (from-teal-500 to-teal-600)

### 2. **Mise à jour de la Base de Données** ✅
- **Fichier:** `ADMIN_MESSAGES_EDITABLES.sql`
- **Nouveau champ:** `display_locations TEXT[]` - Pour spécifier où afficher les messages
- **Valeur par défaut:** Message `share_tips` affiché dans `['dashboard_client']`

### 3. **Mise à jour de l'Interface TypeScript** ✅
- **Fichier:** `lib/services/editable-messages-service.ts`
- **Ajout:** `display_locations: string[]` dans l'interface `EditableMessage`

### 4. **Mise à jour du Composant** ✅
- **Fichier:** `components/admin/editable-messages-manager.tsx`
- **Ajout:** Gestion des emplacements d'affichage
- **Emplacements disponibles:**
  - Dashboard Client
  - Dashboard Vendeur
  - Page d'accueil
  - Page Produit
  - Panier
  - Paiement
  - Liste de souhaits

---

## 🚧 À FINALISER

### 1. Mettre à jour le service pour gérer `display_locations`

**Fichier:** `lib/services/editable-messages-service.ts`

Modifier la fonction `createMessage`:
```typescript
static async createMessage(
  messageKey: string,
  title: string | null,
  content: string,
  messageType: string = 'info',
  displayLocations: string[] = [],
  userId: string
): Promise<EditableMessage | null> {
  try {
    const { data, error } = await supabase
      .from('editable_messages')
      .insert({
        message_key: messageKey,
        title,
        content,
        message_type: messageType,
        display_locations: displayLocations,
        updated_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur création message:', error)
    return null
  }
}
```

Modifier la fonction `updateMessage`:
```typescript
static async updateMessage(
  id: string,
  updates: {
    title?: string | null
    content?: string
    message_type?: string
    is_active?: boolean
    display_locations?: string[]
  },
  userId: string
): Promise<EditableMessage | null>
```

### 2. Ajouter l'UI pour sélectionner les emplacements

**Fichier:** `components/admin/editable-messages-manager.tsx`

Dans les modals d'édition et de création, ajouter:
```typescript
<div>
  <label className="text-sm font-medium text-gray-700">Emplacements d'affichage</label>
  <div className="space-y-2 mt-2">
    {availableLocations.map((location) => (
      <div key={location.value} className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={location.value}
          checked={formData.display_locations.includes(location.value)}
          onChange={(e) => {
            if (e.target.checked) {
              setFormData({
                ...formData,
                display_locations: [...formData.display_locations, location.value]
              })
            } else {
              setFormData({
                ...formData,
                display_locations: formData.display_locations.filter(l => l !== location.value)
              })
            }
          }}
          className="rounded"
        />
        <label htmlFor={location.value} className="text-sm text-gray-700">
          {location.label}
        </label>
      </div>
    ))}
  </div>
  <p className="text-xs text-gray-500 mt-1">
    Sélectionnez où ce message doit être affiché
  </p>
</div>
```

### 3. Mettre à jour `handleSave` pour inclure `display_locations`

```typescript
const handleSave = async () => {
  if (!formData.message_key || !formData.content) {
    toast({
      title: "Erreur",
      description: "La clé et le contenu sont obligatoires",
      variant: "destructive"
    })
    return
  }

  if (editingMessage) {
    // Mise à jour
    const result = await EditableMessagesService.updateMessage(
      editingMessage.id,
      {
        title: formData.title || null,
        content: formData.content,
        message_type: formData.message_type,
        is_active: formData.is_active,
        display_locations: formData.display_locations
      },
      userId
    )
    // ...
  } else {
    // Création
    const result = await EditableMessagesService.createMessage(
      formData.message_key,
      formData.title || null,
      formData.content,
      formData.message_type,
      formData.display_locations,
      userId
    )
    // ...
  }
}
```

### 4. Afficher les emplacements dans la liste des messages

Dans le rendu de chaque message:
```typescript
{message.display_locations && message.display_locations.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {message.display_locations.map((location) => (
      <Badge key={location} variant="outline" className="text-xs">
        {availableLocations.find(l => l.value === location)?.label || location}
      </Badge>
    ))}
  </div>
)}
```

---

## 🎯 Résultat Final

Une fois finalisé, les admins pourront:
- ✅ Accéder à la section "Messages Conseils" dans le tableau de bord
- ✅ Créer de nouveaux messages
- ✅ Modifier les messages existants
- ✅ **Spécifier où afficher chaque message** (Dashboard Client, Homepage, etc.)
- ✅ Activer/désactiver des messages
- ✅ Voir les changements en temps réel

---

## 📝 Checklist

- [x] Ajouter la section dans le tableau de bord super admin
- [x] Mettre à jour le SQL avec `display_locations`
- [x] Mettre à jour l'interface TypeScript
- [x] Ajouter les emplacements disponibles dans le composant
- [ ] Mettre à jour le service pour gérer `display_locations`
- [ ] Ajouter l'UI de sélection des emplacements
- [ ] Mettre à jour `handleSave`
- [ ] Afficher les emplacements dans la liste
- [ ] Tester

---

**Développé avec ❤️ pour Probooster**
**Date:** 2025-10-07
**Statut:** ✅ 80% Terminé - Finalisation requise
