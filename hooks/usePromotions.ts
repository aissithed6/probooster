/**
 * Hook pour gérer l'application automatique des promotions
 * Utilisé dans le panier et le checkout
 */

import { useState, useEffect } from 'react'
import { PromotionManager, type Promotion } from '@/lib/services/marketing-service'

export interface AppliedPromotion {
  promotion: Promotion
  discountAmount: number
  originalAmount: number
  finalAmount: number
}

export function usePromotions(userId: string | undefined) {
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)

  // Charger les promotions actives
  useEffect(() => {
    loadActivePromotions()
  }, [])

  const loadActivePromotions = async () => {
    setLoading(true)
    try {
      const promotions = await PromotionManager.getActivePromotions()
      setActivePromotions(promotions)
    } catch (error) {
      console.error('Erreur chargement promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calcule la réduction pour un produit
   */
  const calculateDiscount = (
    promotion: Promotion,
    productPrice: number,
    quantity: number = 1
  ): number => {
    const totalPrice = productPrice * quantity

    if (promotion.discount_type === 'percentage') {
      let discount = (totalPrice * promotion.discount_value) / 100
      
      // Appliquer la réduction maximale si définie
      if (promotion.max_discount && discount > promotion.max_discount) {
        discount = promotion.max_discount
      }
      
      return discount
    } else if (promotion.discount_type === 'fixed') {
      return Math.min(promotion.discount_value, totalPrice)
    } else if (promotion.discount_type === 'free_shipping') {
      return 0 // La livraison gratuite sera gérée séparément
    }

    return 0
  }

  /**
   * Trouve les promotions applicables à un produit
   */
  const findApplicablePromotions = async (
    productId: string,
    productPrice: number,
    quantity: number = 1
  ): Promise<Promotion[]> => {
    if (!userId) return []

    const totalPrice = productPrice * quantity
    const applicable: Promotion[] = []

    for (const promotion of activePromotions) {
      // Vérifier le montant minimum
      if (promotion.min_order_amount && totalPrice < promotion.min_order_amount) {
        continue
      }

      // Vérifier si le produit est applicable
      if (promotion.applicable_products.length > 0) {
        if (!promotion.applicable_products.includes(productId)) {
          continue
        }
      }

      // Vérifier l'applicabilité complète
      const isApplicable = await PromotionManager.isPromotionApplicable(
        promotion.id,
        productId,
        userId
      )

      if (isApplicable) {
        applicable.push(promotion)
      }
    }

    return applicable
  }

  /**
   * Applique automatiquement la meilleure promotion
   */
  const applyBestPromotion = async (
    productId: string,
    productPrice: number,
    quantity: number = 1
  ): Promise<AppliedPromotion | null> => {
    const applicablePromotions = await findApplicablePromotions(
      productId,
      productPrice,
      quantity
    )

    if (applicablePromotions.length === 0) return null

    // Trouver la promotion qui donne la plus grande réduction
    let bestPromotion: Promotion | null = null
    let maxDiscount = 0

    for (const promotion of applicablePromotions) {
      const discount = calculateDiscount(promotion, productPrice, quantity)
      if (discount > maxDiscount) {
        maxDiscount = discount
        bestPromotion = promotion
      }
    }

    if (!bestPromotion) return null

    const originalAmount = productPrice * quantity
    const finalAmount = originalAmount - maxDiscount

    return {
      promotion: bestPromotion,
      discountAmount: maxDiscount,
      originalAmount,
      finalAmount
    }
  }

  /**
   * Applique une promotion par code
   */
  const applyPromotionCode = async (
    code: string,
    productId: string,
    productPrice: number,
    quantity: number = 1
  ): Promise<AppliedPromotion | null> => {
    if (!userId) return null

    try {
      const promotion = await PromotionManager.getPromotionByCode(code)
      
      if (!promotion) {
        throw new Error('Code promo invalide')
      }

      // Vérifier l'applicabilité
      const isApplicable = await PromotionManager.isPromotionApplicable(
        promotion.id,
        productId,
        userId
      )

      if (!isApplicable) {
        throw new Error('Cette promotion n\'est pas applicable à ce produit')
      }

      const originalAmount = productPrice * quantity
      const discountAmount = calculateDiscount(promotion, productPrice, quantity)
      const finalAmount = originalAmount - discountAmount

      return {
        promotion,
        discountAmount,
        originalAmount,
        finalAmount
      }
    } catch (error) {
      console.error('Erreur application code promo:', error)
      throw error
    }
  }

  /**
   * Enregistre l'utilisation d'une promotion
   */
  const recordPromotionUsage = async (
    promotionId: string,
    productId: string,
    discountAmount: number,
    originalAmount: number,
    finalAmount: number,
    orderId?: string
  ): Promise<boolean> => {
    if (!userId) return false

    try {
      const usage = await PromotionManager.recordUsage({
        promotion_id: promotionId,
        user_id: userId,
        order_id: orderId || null,
        product_id: productId,
        discount_amount: discountAmount,
        original_amount: originalAmount,
        final_amount: finalAmount
      })

      return usage !== null
    } catch (error) {
      console.error('Erreur enregistrement utilisation:', error)
      return false
    }
  }

  /**
   * Applique les promotions à un panier complet
   */
  const applyPromotionsToCart = async (
    cartItems: Array<{
      productId: string
      productPrice: number
      quantity: number
    }>
  ): Promise<{
    items: Array<{
      productId: string
      originalPrice: number
      finalPrice: number
      appliedPromotion: AppliedPromotion | null
    }>
    totalOriginal: number
    totalDiscount: number
    totalFinal: number
  }> => {
    const results = []
    let totalOriginal = 0
    let totalDiscount = 0

    for (const item of cartItems) {
      const appliedPromotion = await applyBestPromotion(
        item.productId,
        item.productPrice,
        item.quantity
      )

      const originalPrice = item.productPrice * item.quantity
      const finalPrice = appliedPromotion 
        ? appliedPromotion.finalAmount 
        : originalPrice

      results.push({
        productId: item.productId,
        originalPrice,
        finalPrice,
        appliedPromotion
      })

      totalOriginal += originalPrice
      totalDiscount += appliedPromotion ? appliedPromotion.discountAmount : 0
    }

    return {
      items: results,
      totalOriginal,
      totalDiscount,
      totalFinal: totalOriginal - totalDiscount
    }
  }

  return {
    activePromotions,
    loading,
    loadActivePromotions,
    findApplicablePromotions,
    applyBestPromotion,
    applyPromotionCode,
    recordPromotionUsage,
    applyPromotionsToCart,
    calculateDiscount
  }
}
