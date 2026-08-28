'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ShoppingBag, X, Check } from 'lucide-react'

interface CartAddedDetail {
  product?: {
    id?: string | number
    name?: string
    price?: number
    image?: string
  }
  quantityAdded?: number
  cartCount?: number
}

interface CartAddedToast {
  id: string
  product: NonNullable<CartAddedDetail['product']>
  quantityAdded: number
  cartCount: number
  leaving: boolean
}

const MAX_VISIBLE_TOASTS = 3
const AUTO_DISMISS_MS = 5000

/**
 * Notification moderne d'ajout au panier, affichée globalement.
 * Écoute l'événement `probooster:cart-added` émis par CartService.addToCart :
 * fonctionne depuis n'importe quel point d'entrée (carte produit, fiche produit,
 * modals, chat...).
 */
export function CartAddedNotification() {
  const [toasts, setToasts] = useState<CartAddedToast[]>([])
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      delete timersRef.current[id]
    }, 300)
    timersRef.current[id] = timer
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<CartAddedDetail>).detail ?? {}
      const product = detail.product ?? { name: 'Produit' }
      const id = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      setToasts((prev) => [
        ...prev.slice(Math.max(0, prev.length - (MAX_VISIBLE_TOASTS - 1))),
        {
          id,
          product,
          quantityAdded: Number(detail.quantityAdded ?? 1) || 1,
          cartCount: Number(detail.cartCount ?? 0) || 0,
          leaving: false
        }
      ])

      timersRef.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    }

    window.addEventListener('probooster:cart-added', handler)
    return () => {
      window.removeEventListener('probooster:cart-added', handler)
      Object.values(timersRef.current).forEach(clearTimeout)
      timersRef.current = {}
    }
  }, [dismiss])

  const openCart = () => {
    try {
      window.dispatchEvent(new CustomEvent('openCartModal'))
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-3 w-[calc(100vw-3rem)] max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const count = toast.cartCount
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-xl border border-green-200 bg-white shadow-2xl transform transition-all duration-300 ease-out ${
              toast.leaving ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Image produit + badge quantité */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  {toast.product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toast.product.image}
                      alt={toast.product.name ?? 'Produit'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#ff6600] text-white text-[11px] font-bold flex items-center justify-center shadow">
                    +{toast.quantityAdded}
                  </span>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                    <p className="text-sm font-semibold text-gray-900">Ajouté au panier</p>
                  </div>
                  <p className="text-sm text-gray-700 font-medium truncate mt-0.5">{toast.product.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      <ShoppingBag className="w-3 h-3" />
                      {count} article{count > 1 ? 's' : ''} dans le panier
                    </span>
                    {typeof toast.product.price === 'number' && toast.product.price > 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {toast.product.price.toLocaleString('fr-FR')} F CFA
                      </span>
                    )}
                  </div>
                </div>

                {/* Fermer */}
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Fermer la notification"
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={openCart}
                  className="flex-1 h-8 rounded-lg bg-[#ff6600] hover:bg-[#e55a00] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Voir le panier
                </button>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="flex-1 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                >
                  Continuer mes achats
                </button>
              </div>
            </div>

            {/* Barre de progression auto-dismiss */}
            <div className="h-1 bg-gray-100">
              <div
                className="h-full bg-green-500"
                style={{ animation: `cartToastProgress ${AUTO_DISMISS_MS}ms linear forwards` }}
              />
            </div>

          </div>
        )
      })}

      <style jsx global>{`
        @keyframes cartToastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
