/**
 * EXEMPLE D'INTÉGRATION DU HOOK usePromotions DANS LE PANIER
 * 
 * Ce fichier montre comment intégrer l'application automatique des promotions
 * dans votre composant panier existant.
 */

import { useEffect, useState } from 'react'
import { usePromotions } from '@/hooks/usePromotions'
import { useAuth } from '@/contexts/AuthContext'

// Interface pour les items du panier
interface CartItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  image?: string
}

export default function CartWithPromotions() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [appliedPromotions, setAppliedPromotions] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Utiliser le hook promotions
  const {
    applyPromotionsToCart,
    applyPromotionCode,
    activePromotions,
    loading: promotionsLoading
  } = usePromotions(user?.id)

  // Appliquer les promotions quand le panier change
  useEffect(() => {
    if (cartItems.length > 0 && user?.id) {
      applyPromotionsAutomatically()
    }
  }, [cartItems, user?.id])

  /**
   * Applique automatiquement les promotions au panier
   */
  const applyPromotionsAutomatically = async () => {
    setLoading(true)
    try {
      // Convertir les items du panier au format attendu
      const cartData = cartItems.map(item => ({
        productId: item.productId,
        productPrice: item.price,
        quantity: item.quantity
      }))

      // Appliquer les promotions
      const result = await applyPromotionsToCart(cartData)
      setAppliedPromotions(result)

      console.log('Promotions appliquées:', result)
    } catch (error) {
      console.error('Erreur application promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Applique un code promo manuellement
   */
  const handleApplyPromoCode = async (code: string) => {
    if (cartItems.length === 0) return

    setLoading(true)
    try {
      // Appliquer le code au premier produit (ou à tous)
      const firstItem = cartItems[0]
      const result = await applyPromotionCode(
        code,
        firstItem.productId,
        firstItem.price,
        firstItem.quantity
      )

      if (result) {
        // Mettre à jour l'affichage
        console.log('Code promo appliqué:', result)
        // Recharger les promotions
        await applyPromotionsAutomatically()
      }
    } catch (error: any) {
      alert(error.message || 'Code promo invalide')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calcule le total du panier avec promotions
   */
  const calculateTotals = () => {
    if (!appliedPromotions) {
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      return {
        subtotal: total,
        discount: 0,
        total: total
      }
    }

    return {
      subtotal: appliedPromotions.totalOriginal,
      discount: appliedPromotions.totalDiscount,
      total: appliedPromotions.totalFinal
    }
  }

  const totals = calculateTotals()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mon Panier</h1>

      {/* Liste des produits */}
      <div className="space-y-4 mb-6">
        {cartItems.map((item, index) => {
          const appliedItem = appliedPromotions?.items[index]
          const hasPromotion = appliedItem?.appliedPromotion

          return (
            <div key={item.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {item.image && (
                    <img src={item.image} alt={item.productName} className="w-20 h-20 object-cover rounded" />
                  )}
                  <div>
                    <h3 className="font-semibold">{item.productName}</h3>
                    <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                    
                    {/* Afficher la promotion appliquée */}
                    {hasPromotion && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          🎉 {appliedItem.appliedPromotion.promotion.name}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          -{appliedItem.appliedPromotion.promotion.discount_value}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {hasPromotion ? (
                    <>
                      <p className="text-sm text-gray-500 line-through">
                        {appliedItem.originalPrice.toLocaleString()} FCFA
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {appliedItem.finalPrice.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-green-600">
                        Économie: {appliedItem.appliedPromotion.discountAmount.toLocaleString()} FCFA
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold">
                      {(item.price * item.quantity).toLocaleString()} FCFA
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Code Promo */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Code Promo</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Entrez votre code promo"
            className="flex-1 px-3 py-2 border rounded"
            id="promo-code-input"
          />
          <button
            onClick={() => {
              const input = document.getElementById('promo-code-input') as HTMLInputElement
              if (input.value) {
                handleApplyPromoCode(input.value)
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-[#ff6600] text-white rounded hover:bg-[#ff6600]/90 disabled:opacity-50"
          >
            {loading ? 'Application...' : 'Appliquer'}
          </button>
        </div>

        {/* Afficher les promotions disponibles */}
        {activePromotions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Promotions disponibles:</p>
            <div className="space-y-1">
              {activePromotions.slice(0, 3).map(promo => (
                <div key={promo.id} className="text-xs text-gray-500">
                  • {promo.name} - {promo.discount_value}% de réduction
                  {promo.code && ` (Code: ${promo.code})`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Résumé */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Résumé de la Commande</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Sous-total:</span>
            <span className="font-medium">{totals.subtotal.toLocaleString()} FCFA</span>
          </div>

          {totals.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="font-medium">Réduction:</span>
              <span className="font-bold">-{totals.discount.toLocaleString()} FCFA</span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-[#ff6600]">
              {totals.total.toLocaleString()} FCFA
            </span>
          </div>

          {totals.discount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <p className="text-sm text-green-800">
                🎉 Vous économisez <span className="font-bold">{totals.discount.toLocaleString()} FCFA</span> grâce aux promotions!
              </p>
            </div>
          )}
        </div>

        <button
          className="w-full mt-6 py-3 bg-[#ff6600] text-white rounded-lg font-semibold hover:bg-[#ff6600]/90"
          disabled={loading || cartItems.length === 0}
        >
          Passer la Commande
        </button>
      </div>
    </div>
  )
}

// ============================================
// EXEMPLE 2: Intégration Simple dans un Panier Existant
// ============================================

/**
 * Si vous avez déjà un composant panier, ajoutez simplement:
 */

/*
import { usePromotions } from '@/hooks/usePromotions'

// Dans votre composant:
const { applyBestPromotion } = usePromotions(user?.id)

// Pour chaque produit:
useEffect(() => {
  const checkPromotions = async () => {
    for (const item of cartItems) {
      const promo = await applyBestPromotion(
        item.productId,
        item.price,
        item.quantity
      )
      
      if (promo) {
        // Mettre à jour l'affichage
        console.log(`Promo appliquée: -${promo.discountAmount} FCFA`)
      }
    }
  }
  
  checkPromotions()
}, [cartItems])
*/

// ============================================
// EXEMPLE 3: Enregistrer l'Utilisation à la Commande
// ============================================

/**
 * Quand l'utilisateur valide sa commande:
 */

/*
import { usePromotions } from '@/hooks/usePromotions'

const { recordPromotionUsage } = usePromotions(user?.id)

const handleCheckout = async () => {
  // ... créer la commande
  
  // Enregistrer l'utilisation des promotions
  for (const item of appliedPromotions.items) {
    if (item.appliedPromotion) {
      await recordPromotionUsage(
        item.appliedPromotion.promotion.id,
        item.productId,
        item.appliedPromotion.discountAmount,
        item.appliedPromotion.originalAmount,
        item.appliedPromotion.finalAmount,
        orderId // ID de la commande créée
      )
    }
  }
  
  // ... continuer le processus de commande
}
*/

// ============================================
// FIN DES EXEMPLES
// ============================================
