// Configuration globale de l'application
export const APP_CONFIG = {
  // Configuration des devises
  currency: {
    default: 'FCFA',
    locale: 'fr-FR',
    pointsMultiplier: 0.1,
    pointsCurrency: 'points Probooster'
  },
  
  // Configuration de l'application
  app: {
    name: 'Marketplace Innovante',
    version: '1.0.0',
    description: 'Plateforme de marketplace moderne avec système de points'
  },
  
  // Configuration des produits
  products: {
    maxPrice: 999999999,
    minPrice: 0,
    maxStock: 999999,
    minStock: 0
  },
  
  // Configuration des livraisons
  shipping: {
    maxCost: 50000,
    minOrderAmount: 5000,
    maxWeight: 25,
    maxDistance: 1000
  },
  
  // Configuration des paiements
  payments: {
    installmentOptions: [3, 6, 12],
    maxInstallmentMonths: 24,
    minInstallmentAmount: 10000
  },
  
  // Configuration SEO
  seo: {
    maxTitleLength: 60,
    maxDescriptionLength: 160,
    maxKeywords: 10
  }
} as const

// Types pour la configuration
export type CurrencyConfig = typeof APP_CONFIG.currency
export type AppConfig = typeof APP_CONFIG.app
export type ProductsConfig = typeof APP_CONFIG.products
export type ShippingConfig = typeof APP_CONFIG.shipping
export type PaymentsConfig = typeof APP_CONFIG.payments
export type SeoConfig = typeof APP_CONFIG.seo
