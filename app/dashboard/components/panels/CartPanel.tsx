'use client'

import Image from 'next/image'
import { X, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EditableMessagesBanner } from '@/components/messages/EditableMessagesBanner'
import type { CartItem } from '@/app/dashboard/types'

interface CartPanelProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
}

/**
 * Panneau latéral du panier (dashboard).
 */
export function CartPanel({ isOpen, onClose, items }: CartPanelProps) {
  if (!isOpen) return null

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white px-4 py-4 sm:px-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-gray-700" />
                    Panier
                  </h2>
                  <div className="ml-3 flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                      <span className="sr-only">Fermer le panneau</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-4 sm:px-6">
                <EditableMessagesBanner location="cart" />
              </div>

              {items.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <ShoppingCart className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Panier vide</h3>
                  <p className="mt-1 text-sm text-gray-500">Ajoute des produits pour les voir ici.</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-180px)]">
                  <ul className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <li key={item.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                            <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.quantity} × {item.price.toFixed(2)}
                            </p>
                          </div>

                          <div className="text-sm font-medium text-gray-900">
                            {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-base font-semibold text-gray-900">{total.toFixed(2)}</span>
              </div>
              <div className="mt-3">
                <Button className="w-full" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
