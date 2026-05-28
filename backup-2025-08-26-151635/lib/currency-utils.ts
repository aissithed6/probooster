import { APP_CONFIG } from './config'

// Constantes pour les devises et points
export const CURRENCY_CONFIG = {
  DEFAULT_CURRENCY: APP_CONFIG.currency.default,
  POINTS_MULTIPLIER: APP_CONFIG.currency.pointsMultiplier,
  POINTS_CURRENCY: APP_CONFIG.currency.pointsCurrency,
  LOCALE: APP_CONFIG.currency.locale
} as const

// Fonction de formatage des prix en FCFA
export const formatPrice = (price: number, currency: string = CURRENCY_CONFIG.DEFAULT_CURRENCY): string => {
  if (price === 0) return `Gratuit`
  
  return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price) + ` ${currency}`
}

// Fonction de conversion en points Probooster
export const convertToPoints = (price: number): number => {
  return Math.round(price * CURRENCY_CONFIG.POINTS_MULTIPLIER)
}

// Fonction de formatage des points
export const formatPoints = (points: number): string => {
  return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE).format(points) + ` ${CURRENCY_CONFIG.POINTS_CURRENCY}`
}

// Fonction de formatage des prix avec points
export const formatPriceWithPoints = (price: number): string => {
  const points = convertToPoints(price)
  return `${formatPrice(price)} (${formatPoints(points)})`
}

// Fonction de formatage des montants de commande
export const formatOrderAmount = (amount: number): string => {
  return formatPriceWithPoints(amount)
}

// Fonction de formatage des revenus
export const formatRevenue = (revenue: number): string => {
  return formatPriceWithPoints(revenue)
}

// Fonction de formatage des coûts de livraison
export const formatShippingCost = (cost: number): string => {
  if (cost === 0) return 'Gratuit'
  return formatPrice(cost)
}

// Fonction de formatage des montants minimums
export const formatMinAmount = (amount: number): string => {
  return `${formatPrice(amount)} minimum`
}

// Fonction de formatage des montants maximums
export const formatMaxAmount = (amount: number): string => {
  return `${formatPrice(amount)} maximum`
}

// Fonction de formatage des prix par unité (ex: par km)
export const formatPricePerUnit = (price: number, unit: string): string => {
  return `${formatPrice(price)}/${unit}`
}

// Fonction de calcul des paiements en plusieurs fois
export const calculateInstallmentPayment = (totalPrice: number, months: number): number => {
  return Math.round(totalPrice / months)
}

// Fonction de formatage des paiements en plusieurs fois
export const formatInstallmentPayment = (totalPrice: number, months: number): string => {
  const monthlyAmount = calculateInstallmentPayment(totalPrice, months)
  return `${formatPrice(monthlyAmount)}/mois`
}

// Fonction de formatage des pourcentages de réduction
export const formatDiscountPercentage = (originalPrice: number, salePrice: number): string => {
  const discount = Math.round((1 - salePrice / originalPrice) * 100)
  return `-${discount}%`
}

// Fonction de validation des montants
export const validateAmount = (amount: number): boolean => {
  return amount >= 0 && amount <= 999999999
}

// Fonction de formatage des statistiques financières
export const formatFinancialStats = (value: number, label: string): {
  mainValue: string
  secondaryValue: string
  label: string
} => {
  return {
    mainValue: formatPrice(value),
    secondaryValue: formatPoints(convertToPoints(value)),
    label
  }
}

// Fonction de formatage des prix de vente avec promotion
export const formatSalePrice = (originalPrice: number, salePrice: number): {
  salePriceFormatted: string
  originalPriceFormatted: string
  discountPercentage: string
  points: string
} => {
  return {
    salePriceFormatted: formatPrice(salePrice),
    originalPriceFormatted: formatPrice(originalPrice),
    discountPercentage: formatDiscountPercentage(originalPrice, salePrice),
    points: formatPoints(convertToPoints(salePrice))
  }
}

// Fonction de calcul des frais de paiement différé
export const calculateDeferredPaymentFees = (
  principal: number,
  rate: number,
  type: 'percentage' | 'fixed',
  period: 'day' | 'month' | 'quarter',
  periods: number,
  method: 'simple' | 'compound'
): number => {
  if (type === 'fixed') {
    return rate * periods
  }
  
  if (method === 'simple') {
    return (principal * rate * periods) / 100
  } else {
    // Intérêts composés
    const multiplier = Math.pow(1 + (rate / 100), periods)
    return principal * (multiplier - 1)
  }
}

// Fonction de formatage des frais de paiement différé
export const formatDeferredPaymentFees = (
  principal: number,
  rate: number,
  type: 'percentage' | 'fixed',
  period: 'day' | 'month' | 'quarter',
  periods: number,
  method: 'simple' | 'compound'
): {
  fees: string
  totalAmount: string
  feesPoints: string
  totalPoints: string
  breakdown: string
} => {
  const fees = calculateDeferredPaymentFees(principal, rate, type, period, periods, method)
  const totalAmount = principal + fees
  
  const periodLabel = period === 'day' ? 'jour(s)' : period === 'month' ? 'mois' : 'trimestre(s)'
  const rateLabel = type === 'percentage' ? `${rate}%` : formatPrice(rate)
  
  let breakdown = ''
  if (type === 'percentage') {
    if (method === 'simple') {
      breakdown = `Intérêts simples: ${principal} × ${rate}% × ${periods} ${periodLabel}`
    } else {
      breakdown = `Intérêts composés: ${principal} × (1 + ${rate}%)^${periods} - ${principal}`
    }
  } else {
    breakdown = `Frais fixes: ${formatPrice(rate)} × ${periods} ${periodLabel}`
  }
  
  return {
    fees: formatPrice(fees),
    totalAmount: formatPrice(totalAmount),
    feesPoints: formatPoints(convertToPoints(fees)),
    totalPoints: formatPoints(convertToPoints(totalAmount)),
    breakdown
  }
}

// Fonction de simulation des paiements différés
export const simulateDeferredPayments = (
  principal: number,
  rate: number,
  type: 'percentage' | 'fixed',
  period: 'day' | 'month' | 'quarter',
  maxPeriods: number,
  method: 'simple' | 'compound'
): Array<{
  period: number
  fees: number
  totalAmount: number
  feesFormatted: string
  totalFormatted: string
  feesPoints: string
  totalPoints: string
}> => {
  const simulations = []
  
  for (let i = 1; i <= maxPeriods; i++) {
    const fees = calculateDeferredPaymentFees(principal, rate, type, period, i, method)
    const totalAmount = principal + fees
    
    simulations.push({
      period: i,
      fees,
      totalAmount,
      feesFormatted: formatPrice(fees),
      totalFormatted: formatPrice(totalAmount),
      feesPoints: formatPoints(convertToPoints(fees)),
      totalPoints: formatPoints(convertToPoints(totalAmount))
    })
  }
  
  return simulations
}
