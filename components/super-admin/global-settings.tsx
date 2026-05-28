"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, Globe, Lock, Mail, Smartphone, FileText, Shield, Cookie, 
  Image, Upload, Download, Trash2, Edit, Plus, Eye, EyeOff, 
  CreditCard, Building2, Phone, MapPin, Calendar, Clock, 
  AlertTriangle, CheckCircle, XCircle, Info, Zap, Palette,
  Languages, DollarSign, Euro, Coins, CreditCard as CreditCardIcon,
  QrCode, Smartphone as MobileIcon, Monitor, Globe as WebIcon, Bell
} from 'lucide-react'
import { useNotifications } from '@/components/ui/modern-notification'
import { getClientAccessToken, supabase } from '@/lib/supabase'

// Interfaces pour la configuration globale
interface SiteConfig {
  name: string
  tagline: string
  description: string
  logo: string
  favicon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  currency: string
  language: string
  timezone: string
  dateFormat: string
  timeFormat: string
}

interface ContactInfo {
  email: string
  phone: string
  whatsapp: string
  address: string
  city: string
  country: string
  postalCode: string
  coordinates: {
    lat: number
    lng: number
  }
}

interface PaymentMethod {
  id: string
  name: string
  type: 'mobile_money' | 'bank_card' | 'bank_transfer' | 'crypto' | 'cash' | 'other'
  provider: string
  logo: string
  isActive: boolean
  fees: {
    percentage: number
    fixed: number
    currency: string
  }
  limits: {
    min: number
    max: number
    currency: string
  }
  countries: string[]
  description: string
  instructions: string
  apiKeys: {
    publicKey: string
    secretKey: string
    webhookUrl: string
  }
}

interface SecurityConfig {
  twoFactorAuth: boolean
  googleAuth: boolean
  facebookAuth: boolean
  appleAuth: boolean
  xAuth: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
  ipWhitelist: string[]
  geoRestrictions: string[]
}

interface NotificationConfig {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  orderUpdates: boolean
  securityAlerts: boolean
  newsletter: boolean
}

interface IntegrationConfig {
  googleAnalytics: {
    enabled: boolean
    trackingId: string
  }
  googleAdsense?: {
    enabled: boolean
    publisherId: string
    adClientId: string
    adSlots: string
  }
  facebookPixel: {
    enabled: boolean
    pixelId: string
  }
  seo?: {
    title: string
    description: string
    keywords: string
    ogTitle: string
    ogDescription: string
    ogImage: string
  }
  sitemap?: {
    autoGenerate: boolean
    url: string
  }
  robots?: {
    content: string
  }
  verification?: {
    google: string
    bing: string
  }
  stripe: {
    enabled: boolean
    publishableKey: string
    secretKey: string
    publicKey: string
  }
  paypal: {
    enabled: boolean
    clientId: string
    secret: string
    mode: 'sandbox' | 'live'
  }
  feexpay?: {
    enabled: boolean
    apiKey: string
    secretKey: string
  }
  twilio: {
    enabled: boolean
    accountSid: string
    authToken: string
    phoneNumber: string
  }
  customScripts?: {
    header: string
    body: string
    css: string
  }
  chatWidget?: {
    enabled: boolean
    code: string
  }
}

type PrivacyPolicyRule = {
  locked: boolean
  forceValue: boolean | null
}

type PrivacyPolicyConfig = {
  profilePublic: PrivacyPolicyRule
  sharePurchaseHistory: PrivacyPolicyRule
  shareStats: PrivacyPolicyRule
  analyticsEnabled: PrivacyPolicyRule
  personalizedRecommendations: PrivacyPolicyRule
}

export default function GlobalSettings() {
  // États pour la configuration
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [globalSettingsBase, setGlobalSettingsBase] = useState<Record<string, any>>({})

  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    name: 'Marketplace Innovante',
    tagline: 'Votre marketplace de confiance',
    description: 'Une plateforme innovante pour connecter acheteurs et vendeurs',
    logo: '/images/logo.png',
    favicon: '/favicon.ico',
    primaryColor: '#ff6600',
    secondaryColor: '#535455',
    accentColor: '#3b82f6',
    currency: 'XOF',
    language: 'fr',
    timezone: 'Africa/Abidjan',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  })

  const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicyConfig>({
    profilePublic: { locked: false, forceValue: null },
    sharePurchaseHistory: { locked: false, forceValue: null },
    shareStats: { locked: false, forceValue: null },
    analyticsEnabled: { locked: false, forceValue: null },
    personalizedRecommendations: { locked: false, forceValue: null }
  })

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'contact@marketplace-innovante.com',
    phone: '+225 27 22 49 28 90',
    whatsapp: '+225 27 22 49 28 90',
    address: '123 Avenue des Champs, Plateau',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    postalCode: '00225',
    coordinates: { lat: 5.3600, lng: -4.0083 }
  })

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      name: 'Mobile Money (Moov)',
      type: 'mobile_money',
      provider: 'Moov Money',
      logo: '/images/payment/moov.png',
      isActive: true,
      fees: { percentage: 1.5, fixed: 0, currency: 'XOF' },
      limits: { min: 100, max: 500000, currency: 'XOF' },
      countries: ['CI', 'BF', 'ML', 'NE', 'TG'],
      description: 'Paiement via Mobile Money Moov',
      instructions: 'Entrez votre numéro Moov et confirmez le paiement',
      apiKeys: { publicKey: '', secretKey: '', webhookUrl: '' }
    },
    {
      id: '2',
      name: 'Mobile Money (MTN)',
      type: 'mobile_money',
      provider: 'MTN Mobile Money',
      logo: '/images/payment/mtn.png',
      isActive: true,
      fees: { percentage: 1.8, fixed: 0, currency: 'XOF' },
      limits: { min: 100, max: 1000000, currency: 'XOF' },
      countries: ['CI', 'GH', 'UG', 'RW', 'ZM'],
      description: 'Paiement via Mobile Money MTN',
      instructions: 'Entrez votre numéro MTN et confirmez le paiement',
      apiKeys: { publicKey: '', secretKey: '', webhookUrl: '' }
    },
    {
      id: '3',
      name: 'Cartes Bancaires',
      type: 'bank_card',
      provider: 'FeexPay',
      logo: '/images/payment/cards.png',
      isActive: true,
      fees: { percentage: 2.9, fixed: 100, currency: 'XOF' },
      limits: { min: 500, max: 5000000, currency: 'XOF' },
      countries: ['CI', 'FR', 'US', 'GB', 'DE'],
      description: 'Paiement par carte Visa, Mastercard, American Express',
      instructions: 'Saisissez vos informations de carte bancaire',
      apiKeys: { publicKey: '', secretKey: '', webhookUrl: '' }
    }
  ])

  const emptyPaymentMethod = useRef<PaymentMethod>({
    id: '',
    name: '',
    type: 'mobile_money',
    provider: '',
    logo: '',
    isActive: true,
    fees: { percentage: 0, fixed: 0, currency: 'XOF' },
    limits: { min: 0, max: 0, currency: 'XOF' },
    countries: ['BJ'],
    description: '',
    instructions: '',
    apiKeys: { publicKey: '', secretKey: '', webhookUrl: '' }
  })

  const [paymentMethodDraft, setPaymentMethodDraft] = useState<PaymentMethod>(emptyPaymentMethod.current)

  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    twoFactorAuth: true,
    googleAuth: true,
    facebookAuth: false,
    appleAuth: false,
    xAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true
    },
    ipWhitelist: [],
    geoRestrictions: []
  })

  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    orderUpdates: true,
    securityAlerts: true,
    newsletter: false
  })

  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>({
    googleAnalytics: { enabled: true, trackingId: 'G-XXXXXXXXXX' },
    googleAdsense: { 
      enabled: false, 
      publisherId: 'ca-pub-XXXXXXXXXXXXXXXX', 
      adClientId: 'ca-pub-XXXXXXXXXXXXXXXX',
      adSlots: ''
    },
    facebookPixel: { enabled: false, pixelId: '123456789012345' },
    seo: {
      title: 'Marketplace Innovante - Votre plateforme e-commerce de confiance',
      description: 'Découvrez notre marketplace innovante. Achetez et vendez en toute sécurité avec des milliers de produits et services.',
      keywords: 'marketplace, e-commerce, achat, vente, produits, services, Côte d\'Ivoire',
      ogTitle: 'Marketplace Innovante - Plateforme e-commerce',
      ogDescription: 'La marketplace de référence en Côte d\'Ivoire. Découvrez des milliers de produits et services.',
      ogImage: 'https://marketplace-innovante.com/og-image.jpg'
    },
    sitemap: {
      autoGenerate: true,
      url: 'https://marketplace-innovante.com/sitemap.xml'
    },
    robots: {
      content: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /checkout/
Disallow: /account/

Sitemap: https://marketplace-innovante.com/sitemap.xml`
    },
    verification: {
      google: '',
      bing: ''
    },
    stripe: { enabled: false, publishableKey: '', secretKey: '', publicKey: 'pk_live_...' },
    paypal: { enabled: false, clientId: '', secret: '', mode: 'sandbox' },
    feexpay: { enabled: true, apiKey: '', secretKey: '' },
    twilio: { enabled: false, accountSid: '', authToken: '', phoneNumber: '' },
    customScripts: {
      header: '<!-- Scripts personnalisés dans le <head> -->',
      body: '<!-- Scripts personnalisés avant </body> -->',
      css: '/* Styles CSS personnalisés */'
    },
    chatWidget: {
      enabled: false,
      code: ''
    }
  })

  // États pour les modals et actions
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const loadedSnapshotRef = useRef<{
    globalSettingsBase: Record<string, any>
    siteConfig: SiteConfig
    contactInfo: ContactInfo
    paymentMethods: PaymentMethod[]
    securityConfig: SecurityConfig
    notificationConfig: NotificationConfig
    integrationConfig: IntegrationConfig
    privacyPolicy: PrivacyPolicyConfig
  } | null>(null)

  // Log de débogage pour le mode édition
  useEffect(() => {
    console.log('Mode édition changé:', isEditing)
  }, [isEditing])
  const [activeTab, setActiveTab] = useState('general')

  /**
   * Exécute un fetch vers les endpoints Super Admin en injectant explicitement le token Supabase.
   */
  const fetchSuperAdmin = async (path: string, init?: RequestInit) => {
    let accessToken = getClientAccessToken()

    if (!accessToken) {
      try {
        const { data } = await supabase.auth.getSession()
        accessToken = data?.session?.access_token ?? null
      } catch {
        accessToken = null
      }
    }

    if (!accessToken) {
      throw new Error('Session Supabase manquante ou expirée. Veuillez vous reconnecter.')
    }

    const headers = new Headers(init?.headers ?? {})
    headers.set('Authorization', `Bearer ${accessToken}`)

    return fetch(path, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store'
    })
  }

  /**
   * Normalise un objet potentiellement incomplet en SiteConfig valide.
   */
  const normalizeSiteConfig = (raw: unknown, fallback: SiteConfig): SiteConfig => {
    const obj = raw && typeof raw === 'object' ? (raw as any) : {}
    return {
      name: typeof obj.name === 'string' ? obj.name : fallback.name,
      tagline: typeof obj.tagline === 'string' ? obj.tagline : fallback.tagline,
      description: typeof obj.description === 'string' ? obj.description : fallback.description,
      logo: typeof obj.logo === 'string' ? obj.logo : fallback.logo,
      favicon: typeof obj.favicon === 'string' ? obj.favicon : fallback.favicon,
      primaryColor: typeof obj.primaryColor === 'string' ? obj.primaryColor : fallback.primaryColor,
      secondaryColor: typeof obj.secondaryColor === 'string' ? obj.secondaryColor : fallback.secondaryColor,
      accentColor: typeof obj.accentColor === 'string' ? obj.accentColor : fallback.accentColor,
      currency: typeof obj.currency === 'string' ? obj.currency : fallback.currency,
      language: typeof obj.language === 'string' ? obj.language : fallback.language,
      timezone: typeof obj.timezone === 'string' ? obj.timezone : fallback.timezone,
      dateFormat: typeof obj.dateFormat === 'string' ? obj.dateFormat : fallback.dateFormat,
      timeFormat: typeof obj.timeFormat === 'string' ? obj.timeFormat : fallback.timeFormat
    }
  }

  /**
   * Normalise un objet potentiellement incomplet en ContactInfo valide.
   */
  const normalizeContactInfo = (raw: unknown, fallback: ContactInfo): ContactInfo => {
    const obj = raw && typeof raw === 'object' ? (raw as any) : {}
    const coords = obj.coordinates && typeof obj.coordinates === 'object' ? (obj.coordinates as any) : {}
    const lat = typeof coords.lat === 'number' ? coords.lat : Number(coords.lat)
    const lng = typeof coords.lng === 'number' ? coords.lng : Number(coords.lng)
    return {
      email: typeof obj.email === 'string' ? obj.email : fallback.email,
      phone: typeof obj.phone === 'string' ? obj.phone : fallback.phone,
      whatsapp: typeof obj.whatsapp === 'string' ? obj.whatsapp : fallback.whatsapp,
      address: typeof obj.address === 'string' ? obj.address : fallback.address,
      city: typeof obj.city === 'string' ? obj.city : fallback.city,
      country: typeof obj.country === 'string' ? obj.country : fallback.country,
      postalCode: typeof obj.postalCode === 'string' ? obj.postalCode : fallback.postalCode,
      coordinates: {
        lat: Number.isFinite(lat) ? lat : fallback.coordinates.lat,
        lng: Number.isFinite(lng) ? lng : fallback.coordinates.lng
      }
    }
  }

  const normalizePrivacyPolicyRule = (raw: any, fallback: PrivacyPolicyRule): PrivacyPolicyRule => {
    const obj = raw && typeof raw === 'object' ? raw : {}
    const force = obj.forceValue
    const normalizedForce =
      force === null || force === undefined
        ? null
        : (typeof force === 'boolean' ? force : (force === 1 || force === '1' || force === 'true'))
    return {
      locked: obj.locked === true,
      forceValue: normalizedForce
    }
  }

  const normalizePrivacyPolicy = (raw: unknown, fallback: PrivacyPolicyConfig): PrivacyPolicyConfig => {
    const obj = raw && typeof raw === 'object' ? (raw as any) : {}
    return {
      profilePublic: normalizePrivacyPolicyRule(obj.profilePublic, fallback.profilePublic),
      sharePurchaseHistory: normalizePrivacyPolicyRule(obj.sharePurchaseHistory, fallback.sharePurchaseHistory),
      shareStats: normalizePrivacyPolicyRule(obj.shareStats, fallback.shareStats),
      analyticsEnabled: normalizePrivacyPolicyRule(obj.analyticsEnabled, fallback.analyticsEnabled),
      personalizedRecommendations: normalizePrivacyPolicyRule(obj.personalizedRecommendations, fallback.personalizedRecommendations)
    }
  }

  /**
   * Charge la configuration globale depuis Supabase (super_admin_settings.scope = global).
   */
  const loadGlobalSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const resp = await fetchSuperAdmin('/api/super-admin/settings?scopes=global', { method: 'GET' })
      const json = resp.ok ? await resp.json().catch(() => ({})) : {}

      if (!resp.ok) {
        throw new Error((json as any)?.error ?? 'Impossible de charger la configuration globale.')
      }

      const data = (json as any)?.data
      const record = Array.isArray(data) ? data.find((row: any) => row?.scope === 'global') : null
      const settings = (record?.settings && typeof record.settings === 'object') ? record.settings : {}

      const nextSiteConfig = normalizeSiteConfig((settings as any)?.siteConfig, siteConfig)
      const nextContactInfo = normalizeContactInfo((settings as any)?.contactInfo, contactInfo)

      const nextPaymentMethods = Array.isArray((settings as any)?.paymentMethods)
        ? ((settings as any).paymentMethods as any[]).filter(Boolean)
        : paymentMethods

      const nextSecurityConfig = ((settings as any)?.securityConfig && typeof (settings as any).securityConfig === 'object')
        ? ({ ...securityConfig, ...(settings as any).securityConfig } as SecurityConfig)
        : securityConfig

      const nextNotificationConfig = ((settings as any)?.notificationConfig && typeof (settings as any).notificationConfig === 'object')
        ? ({ ...notificationConfig, ...(settings as any).notificationConfig } as NotificationConfig)
        : notificationConfig

      const nextIntegrationConfig = ((settings as any)?.integrationConfig && typeof (settings as any).integrationConfig === 'object')
        ? ({ ...integrationConfig, ...(settings as any).integrationConfig } as IntegrationConfig)
        : integrationConfig

      const nextPrivacyPolicy = normalizePrivacyPolicy((settings as any)?.privacyPolicy, privacyPolicy)

      setGlobalSettingsBase(settings)
      setSiteConfig(nextSiteConfig)
      setContactInfo(nextContactInfo)
      setPaymentMethods(nextPaymentMethods as PaymentMethod[])
      setSecurityConfig(nextSecurityConfig)
      setNotificationConfig(nextNotificationConfig)
      setIntegrationConfig(nextIntegrationConfig)
      setPrivacyPolicy(nextPrivacyPolicy)

      loadedSnapshotRef.current = {
        globalSettingsBase: settings,
        siteConfig: nextSiteConfig,
        contactInfo: nextContactInfo,
        paymentMethods: nextPaymentMethods as PaymentMethod[],
        securityConfig: nextSecurityConfig,
        notificationConfig: nextNotificationConfig,
        integrationConfig: nextIntegrationConfig,
        privacyPolicy: nextPrivacyPolicy
      }
    } catch (error) {
      console.error('Erreur chargement global settings:', error)
      addNotification({
        type: 'error',
        title: 'Configuration globale',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsLoadingSettings(false)
    }
  }

  useEffect(() => {
    void loadGlobalSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Références pour les inputs de fichiers
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Fonctions utilitaires pour les mises à jour d'état
  const updateIntegrationConfig = <K extends keyof IntegrationConfig>(
    key: K,
    updates: Partial<IntegrationConfig[K]>
  ) => {
    setIntegrationConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates
      }
    }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSiteConfig(prev => ({
          ...prev,
          logo: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSiteConfig(prev => ({
          ...prev,
          favicon: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addPaymentMethod = () => {
    setSelectedPaymentMethod(null)
    setPaymentMethodDraft({ ...emptyPaymentMethod.current, id: '' })
    setShowPaymentModal(true)
  }

  const editPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    setPaymentMethodDraft({ ...method })
    setShowPaymentModal(true)
  }

  /**
   * Génère un identifiant stable côté client pour une méthode de paiement.
   */
  const createPaymentMethodId = () => {
    return `pm_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }

  /**
   * Crée ou met à jour la méthode de paiement dans l'état local.
   */
  const upsertPaymentMethod = () => {
    const trimmedName = (paymentMethodDraft.name ?? '').toString().trim()
    if (!trimmedName) {
      addNotification({
        type: 'error',
        title: 'Méthode de paiement',
        message: 'Le nom de la méthode est obligatoire.'
      })
      return
    }

    setPaymentMethods(prev => {
      const next = [...prev]
      const isEdit = Boolean(selectedPaymentMethod?.id)
      const id = isEdit ? (selectedPaymentMethod?.id as string) : (paymentMethodDraft.id || createPaymentMethodId())

      const nextMethod: PaymentMethod = {
        ...paymentMethodDraft,
        id,
        name: trimmedName,
        provider: (paymentMethodDraft.provider ?? '').toString().trim(),
        description: (paymentMethodDraft.description ?? '').toString().trim(),
        instructions: (paymentMethodDraft.instructions ?? '').toString().trim(),
        fees: {
          ...paymentMethodDraft.fees,
          percentage: Number(paymentMethodDraft.fees?.percentage ?? 0) || 0,
          fixed: Number(paymentMethodDraft.fees?.fixed ?? 0) || 0,
          currency: (paymentMethodDraft.fees?.currency ?? 'XOF').toString()
        },
        limits: {
          ...paymentMethodDraft.limits,
          min: Number(paymentMethodDraft.limits?.min ?? 0) || 0,
          max: Number(paymentMethodDraft.limits?.max ?? 0) || 0,
          currency: (paymentMethodDraft.limits?.currency ?? 'XOF').toString()
        },
        apiKeys: {
          publicKey: (paymentMethodDraft.apiKeys?.publicKey ?? '').toString(),
          secretKey: (paymentMethodDraft.apiKeys?.secretKey ?? '').toString(),
          webhookUrl: (paymentMethodDraft.apiKeys?.webhookUrl ?? '').toString()
        }
      }

      const idx = next.findIndex((m) => m.id === id)
      if (idx >= 0) next[idx] = nextMethod
      else next.unshift(nextMethod)
      return next
    })

    setShowPaymentModal(false)
    setSelectedPaymentMethod(null)
    addNotification({
      type: 'success',
      title: 'Méthode de paiement',
      message: selectedPaymentMethod ? 'Méthode modifiée.' : 'Méthode créée.'
    })
  }

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id))
  }

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(method => 
      method.id === id ? { ...method, isActive: !method.isActive } : method
    ))
  }

  const saveAllSettings = () => {
    void (async () => {
      try {
        setIsSavingSettings(true)

        const mergedSettings: Record<string, unknown> = {
          ...(globalSettingsBase ?? {}),
          siteConfig,
          contactInfo,
          paymentMethods,
          securityConfig,
          notificationConfig,
          integrationConfig,
          privacyPolicy
        }

        const resp = await fetchSuperAdmin('/api/super-admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: 'global',
            settings: {
              ...mergedSettings
            }
          })
        })

        const json = resp.ok ? await resp.json().catch(() => ({})) : await resp.json().catch(() => ({}))
        if (!resp.ok) {
          throw new Error((json as any)?.error ?? 'Impossible de sauvegarder la configuration.')
        }

        setGlobalSettingsBase(mergedSettings as Record<string, any>)
        loadedSnapshotRef.current = {
          globalSettingsBase: mergedSettings as Record<string, any>,
          siteConfig,
          contactInfo,
          paymentMethods,
          securityConfig,
          notificationConfig,
          integrationConfig,
          privacyPolicy
        }
        setIsEditing(false)

        addNotification({
          type: 'success',
          title: 'Configuration sauvegardée',
          message: 'Configuration sauvegardée avec succès !'
        })
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
        addNotification({
          type: 'error',
          title: 'Erreur de sauvegarde',
          message: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde. Veuillez réessayer.'
        })
      } finally {
        setIsSavingSettings(false)
      }
    })()
  }

  const cancelEditing = () => {
    try {
      const snap = loadedSnapshotRef.current
      if (snap) {
        setGlobalSettingsBase(snap.globalSettingsBase)
        setSiteConfig(snap.siteConfig)
        setContactInfo(snap.contactInfo)
        setPaymentMethods(snap.paymentMethods)
        setSecurityConfig(snap.securityConfig)
        setNotificationConfig(snap.notificationConfig)
        setIntegrationConfig(snap.integrationConfig)
        setPrivacyPolicy(snap.privacyPolicy)
      }
      setIsEditing(false)
      console.log('Mode édition annulé')
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      setIsEditing(false) // Forcer la fermeture en cas d'erreur
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions principales */}
      <div className="bg-gradient-to-r from-orange-50 to-gray-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuration Globale</h2>
            <p className="text-gray-600 mt-2">
              Paramètres système, sécurité, paiements et personnalisation de la marketplace
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={cancelEditing}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={saveAllSettings}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Indicateur de mode édition */}
      {isEditing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              Mode édition actif - Cliquez sur "Sauvegarder" pour enregistrer vos modifications
            </span>
          </div>
        </div>
      )}

      {/* Système d'onglets principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="branding">Marque</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
        </TabsList>

                {/* Onglet Configuration Générale */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Configuration Générale
                </CardTitle>
                <CardDescription>
                  Paramètres de base de la marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nom de la marketplace</Label>
                  <Input
                    id="siteName"
                    value={siteConfig.name}
                    onChange={(e) => setSiteConfig(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Nom de votre marketplace"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Slogan</Label>
                  <Input
                    id="tagline"
                    value={siteConfig.tagline}
                    onChange={(e) => setSiteConfig(prev => ({ ...prev, tagline: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Slogan de votre marketplace"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise par défaut</Label>
                  <Select 
                    value={siteConfig.currency} 
                    onValueChange={(value) => setSiteConfig(prev => ({ ...prev, currency: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="USD">Dollar US (USD)</SelectItem>
                      <SelectItem value="GBP">Livre Sterling (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue par défaut</Label>
                  <Select 
                    value={siteConfig.language} 
                    onValueChange={(value) => setSiteConfig(prev => ({ ...prev, language: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Paramètres Temporels
                </CardTitle>
                <CardDescription>
                  Configuration des fuseaux horaires et formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select 
                    value={siteConfig.timezone} 
                    onValueChange={(value) => setSiteConfig(prev => ({ ...prev, timezone: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Abidjan">Afrique/Abidjan (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (GMT+1/+2)</SelectItem>
                      <SelectItem value="America/New_York">Amérique/New York (GMT-5/-4)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asie/Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <Select 
                    value={siteConfig.dateFormat} 
                    onValueChange={(value) => setSiteConfig(prev => ({ ...prev, dateFormat: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Format d'heure</Label>
                  <Select 
                    value={siteConfig.timeFormat} 
                    onValueChange={(value) => setSiteConfig(prev => ({ ...prev, timeFormat: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 heures</SelectItem>
                      <SelectItem value="12h">12 heures (AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Marque et Identité */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-pink-600" />
                  Logo et Identité Visuelle
                </CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de votre marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo principal */}
                <div className="space-y-3">
                  <Label>Logo Principal</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                      {siteConfig.logo ? (
                        <img 
                          src={siteConfig.logo} 
                          alt="Logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => logoInputRef.current?.click()}
                        disabled={!isEditing}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Changer le logo
                      </Button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500">
                        PNG, JPG jusqu'à 2MB. Recommandé: 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-3">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                      {siteConfig.favicon ? (
                        <img 
                          src={siteConfig.favicon} 
                          alt="Favicon" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => faviconInputRef.current?.click()}
                        disabled={!isEditing}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Changer le favicon
                      </Button>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500">
                        ICO, PNG jusqu'à 100KB. Recommandé: 32x32px
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  Couleurs et Thème
                </CardTitle>
                <CardDescription>
                  Personnalisez la palette de couleurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Couleur principale</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={siteConfig.primaryColor}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      disabled={!isEditing}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={siteConfig.primaryColor}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="#ff6600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Couleur secondaire</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={siteConfig.secondaryColor}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      disabled={!isEditing}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={siteConfig.secondaryColor}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="#535455"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Couleur d'accent</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={siteConfig.accentColor}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                      disabled={!isEditing}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={siteConfig.accentColor}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Méthodes de Paiement */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Méthodes de Paiement
                  </CardTitle>
                  <CardDescription>
                    Configurez et gérez les moyens de paiement acceptés
                  </CardDescription>
                </div>
                <Button 
                  onClick={addPaymentMethod}
                  disabled={!isEditing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une méthode
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CreditCardIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{method.name}</h4>
                          <p className="text-sm text-gray-600">{method.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={method.isActive}
                          onCheckedChange={() => togglePaymentMethod(method.id)}
                          disabled={!isEditing}
                        />
                        <Badge variant={method.isActive ? 'default' : 'secondary'}>
                          {method.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Frais</Label>
                        <div className="text-sm">
                          <p>{method.fees.percentage}% + {method.fees.fixed} {method.fees.currency}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Limites</Label>
                        <div className="text-sm">
                          <p>{method.limits.min.toLocaleString()} - {method.limits.max.toLocaleString()} {method.limits.currency}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Pays supportés</Label>
                        <div className="text-sm">
                          <p>{method.countries.join(', ')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => editPaymentMethod(method)}
                        disabled={!isEditing}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => deletePaymentMethod(method.id)}
                        disabled={!isEditing}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Informations de Contact */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Coordonnées de l'Entreprise
                </CardTitle>
                <CardDescription>
                  Informations de contact principales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de contact</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="contact@votre-entreprise.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Téléphone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="+225 27 22 49 28 90"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={contactInfo.whatsapp}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="+225 27 22 49 28 90"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Adresse Physique
                </CardTitle>
                <CardDescription>
                  Localisation de votre entreprise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="123 Avenue des Champs, Plateau"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={contactInfo.city}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, city: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Abidjan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={contactInfo.postalCode}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="00225"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select 
                    value={contactInfo.country} 
                    onValueChange={(value) => setContactInfo(prev => ({ ...prev, country: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Sénégal">Sénégal</SelectItem>
                      <SelectItem value="Mali">Mali</SelectItem>
                      <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                      <SelectItem value="Bénin">Bénin</SelectItem>
                      <SelectItem value="Togo">Togo</SelectItem>
                      <SelectItem value="Niger">Niger</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-emerald-200 bg-emerald-50/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Politique de confidentialité
                </CardTitle>
                <CardDescription>
                  Verrouiller ou forcer les options de confidentialité pour les clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    { key: 'profilePublic', label: 'Profil public' },
                    { key: 'sharePurchaseHistory', label: 'Historique des achats' },
                    { key: 'shareStats', label: 'Statistiques de partage' },
                    { key: 'analyticsEnabled', label: 'Analytics' },
                    { key: 'personalizedRecommendations', label: 'Recommandations personnalisées' }
                  ] as const
                ).map((item) => {
                  const rule = (privacyPolicy as any)[item.key] as PrivacyPolicyRule
                  const forceValue = rule?.forceValue
                  const forceKey = forceValue === null ? 'inherit' : forceValue === true ? 'on' : 'off'

                  return (
                    <div key={item.key} className="rounded-lg border border-emerald-200 bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">{item.label}</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Lock</Label>
                            <Switch
                              checked={rule?.locked === true}
                              onCheckedChange={(checked) => {
                                setPrivacyPolicy((prev) => ({
                                  ...prev,
                                  [item.key]: { ...(prev as any)[item.key], locked: checked }
                                }))
                              }}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Force</Label>
                          <Select
                            value={forceKey}
                            onValueChange={(value) => {
                              const nextForce = value === 'inherit' ? null : value === 'on'
                              setPrivacyPolicy((prev) => ({
                                ...prev,
                                [item.key]: { ...(prev as any)[item.key], forceValue: nextForce }
                              }))
                            }}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inherit">Libre (client choisit)</SelectItem>
                              <SelectItem value="on">Forcer ON</SelectItem>
                              <SelectItem value="off">Forcer OFF</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {rule?.locked ? 'Le client ne peut pas modifier cette option.' : 'Le client peut modifier cette option.'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Sécurité & Authentification
                </CardTitle>
                <CardDescription>
                  Configuration des paramètres de sécurité de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Authentification 2FA</Label>
                    <p className="text-xs text-gray-600">Double authentification obligatoire</p>
                  </div>
                  <Switch
                    checked={securityConfig.twoFactorAuth}
                    onCheckedChange={(checked) => {
                      if (!isEditing) setIsEditing(true)
                      setSecurityConfig(prev => ({ ...prev, twoFactorAuth: checked }))
                    }}
                    disabled={false}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Connexion Google</Label>
                    <p className="text-xs text-gray-600">Autoriser la connexion via Google</p>
                  </div>
                  <Switch
                    checked={securityConfig.googleAuth}
                    onCheckedChange={(checked) => {
                      if (!isEditing) setIsEditing(true)
                      setSecurityConfig(prev => ({ ...prev, googleAuth: checked }))
                    }}
                    disabled={false}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Connexion Facebook</Label>
                    <p className="text-xs text-gray-600">Autoriser la connexion via Facebook</p>
                  </div>
                  <Switch
                    checked={securityConfig.facebookAuth}
                    onCheckedChange={(checked) => {
                      if (!isEditing) setIsEditing(true)
                      setSecurityConfig(prev => ({ ...prev, facebookAuth: checked }))
                    }}
                    disabled={false}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Connexion Apple</Label>
                    <p className="text-xs text-gray-600">Autoriser la connexion via Apple ID</p>
                  </div>
                  <Switch
                    checked={securityConfig.appleAuth}
                    onCheckedChange={(checked) => {
                      if (!isEditing) setIsEditing(true)
                      setSecurityConfig(prev => ({ ...prev, appleAuth: checked }))
                    }}
                    disabled={false}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Connexion X</Label>
                    <p className="text-xs text-gray-600">Autoriser la connexion via X (Twitter)</p>
                  </div>
                  <Switch
                    checked={securityConfig.xAuth}
                    onCheckedChange={(checked) => {
                      if (!isEditing) setIsEditing(true)
                      setSecurityConfig(prev => ({ ...prev, xAuth: checked }))
                    }}
                    disabled={false}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-orange-600" />
                  Politique des Mots de Passe
                </CardTitle>
                <CardDescription>
                  Exigences de sécurité des mots de passe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Longueur minimale</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={securityConfig.passwordPolicy.minLength}
                    onChange={(e) => setSecurityConfig(prev => ({
                      ...prev,
                      passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(e.target.value) }
                    }))}
                    disabled={!isEditing}
                    min="6"
                    max="20"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Exigences</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Majuscules requises</span>
                      <Switch
                        checked={securityConfig.passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) => setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked }
                        }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Chiffres requis</span>
                      <Switch
                        checked={securityConfig.passwordPolicy.requireNumbers}
                        onCheckedChange={(checked) => setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked }
                        }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Symboles requis</span>
                      <Switch
                        checked={securityConfig.passwordPolicy.requireSymbols}
                        onCheckedChange={(checked) => setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireSymbols: checked }
                        }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Configuration des Notifications
              </CardTitle>
              <CardDescription>
                Gérez les préférences de notification de votre marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notifications Système</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Notifications Email</Label>
                        <p className="text-xs text-gray-600">Alertes et mises à jour par email</p>
                      </div>
                      <Switch
                        checked={notificationConfig.emailNotifications}
                        onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, emailNotifications: checked }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Notifications SMS</Label>
                        <p className="text-xs text-gray-600">Alertes importantes par SMS</p>
                      </div>
                      <Switch
                        checked={notificationConfig.smsNotifications}
                        onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, smsNotifications: checked }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Notifications Push</Label>
                        <p className="text-xs text-gray-600">Alertes en temps réel</p>
                      </div>
                      <Switch
                        checked={notificationConfig.pushNotifications}
                        onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, pushNotifications: checked }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notifications Métier</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Mises à jour commandes</Label>
                        <p className="text-xs text-gray-600">Suivi des commandes</p>
                      </div>
                      <Switch
                        checked={notificationConfig.orderUpdates}
                        onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, orderUpdates: checked }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Alertes de sécurité</Label>
                        <p className="text-xs text-gray-600">Connexions suspectes</p>
                      </div>
                      <Switch
                        checked={notificationConfig.securityAlerts}
                        onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, securityAlerts: checked }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Newsletter</Label>
                        <p className="text-xs text-gray-600">Actualités et promotions</p>
                      </div>
                      <Switch
                        checked={notificationConfig.newsletter}
                        onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, newsletter: checked }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Intégrations */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analytics et Marketing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Analytics et Marketing
                </CardTitle>
                <CardDescription>
                  Intégrations pour le suivi et l'analyse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Google Analytics</Label>
                    <p className="text-xs text-gray-600">Suivi des performances du site</p>
                  </div>
                  <Switch
                    checked={integrationConfig.googleAnalytics.enabled}
                    onCheckedChange={(checked) => setIntegrationConfig(prev => ({
                      ...prev,
                      googleAnalytics: { ...prev.googleAnalytics, enabled: checked }
                    }))}
                    disabled={!isEditing}
                  />
                </div>
                {integrationConfig.googleAnalytics.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="gaTrackingId">ID de suivi Analytics</Label>
                    <Input
                      id="gaTrackingId"
                      value={integrationConfig.googleAnalytics.trackingId}
                      onChange={(e) => setIntegrationConfig(prev => ({
                        ...prev,
                        googleAnalytics: { ...prev.googleAnalytics, trackingId: e.target.value }
                      }))}
                      disabled={!isEditing}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Google AdSense</Label>
                    <p className="text-xs text-gray-600">Monétisation avec la publicité Google</p>
                  </div>
                  <Switch
                    checked={integrationConfig.googleAdsense?.enabled || false}
                    onCheckedChange={(checked) => updateIntegrationConfig('googleAdsense', { enabled: checked })}
                    disabled={!isEditing}
                  />
                </div>
                {integrationConfig.googleAdsense?.enabled && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="adsensePublisherId">Publisher ID AdSense</Label>
                      <Input
                        id="adsensePublisherId"
                        value={integrationConfig.googleAdsense?.publisherId || ''}
                        onChange={(e) => updateIntegrationConfig('googleAdsense', { publisherId: e.target.value })}
                        disabled={!isEditing}
                        placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adsenseAdClient">Ad Client ID</Label>
                      <Input
                        id="adsenseAdClient"
                        value={integrationConfig.googleAdsense?.adClientId || ''}
                        onChange={(e) => updateIntegrationConfig('googleAdsense', { adClientId: e.target.value })}
                        disabled={!isEditing}
                        placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adsenseAdSlots">Codes d'emplacements publicitaires</Label>
                      <Textarea
                        id="adsenseAdSlots"
                        value={integrationConfig.googleAdsense?.adSlots || ''}
                        onChange={(e) => updateIntegrationConfig('googleAdsense', { adSlots: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Entrez vos codes d'emplacements AdSense..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Facebook Pixel</Label>
                    <p className="text-xs text-gray-600">Suivi des conversions Facebook</p>
                  </div>
                  <Switch
                    checked={integrationConfig.facebookPixel.enabled}
                    onCheckedChange={(checked) => setIntegrationConfig(prev => ({
                      ...prev,
                      facebookPixel: { ...prev.facebookPixel, enabled: checked }
                    }))}
                    disabled={!isEditing}
                  />
                </div>
                {integrationConfig.facebookPixel.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="facebookPixelId">Pixel ID Facebook</Label>
                    <Input
                      id="facebookPixelId"
                      value={integrationConfig.facebookPixel.pixelId}
                      onChange={(e) => setIntegrationConfig(prev => ({
                        ...prev,
                        facebookPixel: { ...prev.facebookPixel, pixelId: e.target.value }
                      }))}
                      disabled={!isEditing}
                      placeholder="123456789012345"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO et Référencement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  SEO et Référencement
                </CardTitle>
                <CardDescription>
                  Optimisation pour les moteurs de recherche
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">Titre SEO principal</Label>
                    <Input
                      id="seoTitle"
                      value={integrationConfig.seo?.title || ''}
                      onChange={(e) => updateIntegrationConfig('seo', { title: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Titre principal de votre marketplace"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">Description SEO</Label>
                    <Textarea
                      id="seoDescription"
                      value={integrationConfig.seo?.description || ''}
                      onChange={(e) => updateIntegrationConfig('seo', { description: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Description de votre marketplace pour les moteurs de recherche"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seoKeywords">Mots-clés SEO</Label>
                    <Input
                      id="seoKeywords"
                      value={integrationConfig.seo?.keywords || ''}
                      onChange={(e) => updateIntegrationConfig('seo', { keywords: e.target.value })}
                      disabled={!isEditing}
                      placeholder="marketplace, e-commerce, achat, vente"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Open Graph et Social Media</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ogTitle">Titre Open Graph</Label>
                    <Input
                      id="ogTitle"
                      value={integrationConfig.seo?.ogTitle || ''}
                      onChange={(e) => updateIntegrationConfig('seo', { ogTitle: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Titre pour les réseaux sociaux"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ogDescription">Description Open Graph</Label>
                    <Textarea
                      id="ogDescription"
                      value={integrationConfig.seo?.ogDescription || ''}
                      onChange={(e) => updateIntegrationConfig('seo', { ogDescription: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Description pour les réseaux sociaux"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ogImage">Image Open Graph (URL)</Label>
                    <Input
                      id="ogImage"
                      value={integrationConfig.seo?.ogImage || ''}
                      onChange={(e) => updateIntegrationConfig('seo', { ogImage: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://votre-site.com/og-image.jpg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Robots.txt et Sitemap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WebIcon className="h-5 w-5 text-orange-600" />
                  Robots.txt et Sitemap
                </CardTitle>
                <CardDescription>
                  Configuration de l'indexation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Génération automatique du sitemap</Label>
                    <Switch
                      checked={integrationConfig.sitemap?.autoGenerate || false}
                                          onCheckedChange={(checked) => updateIntegrationConfig('sitemap', { autoGenerate: checked })}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sitemapUrl">URL du Sitemap</Label>
                    <Input
                      id="sitemapUrl"
                      value={integrationConfig.sitemap?.url || ''}
                      onChange={(e) => updateIntegrationConfig('sitemap', { url: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://votre-site.com/sitemap.xml"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="robotsTxt">Contenu du fichier robots.txt</Label>
                    <Textarea
                      id="robotsTxt"
                      value={integrationConfig.robots?.content || ''}
                      onChange={(e) => updateIntegrationConfig('robots', { content: e.target.value })}
                      disabled={!isEditing}
                      placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://votre-site.com/sitemap.xml`}
                      rows={6}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Vérification des moteurs de recherche</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="googleVerification">Google Search Console</Label>
                    <Input
                      id="googleVerification"
                      value={integrationConfig.verification?.google || ''}
                      onChange={(e) => updateIntegrationConfig('verification', { google: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Code de vérification Google"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bingVerification">Bing Webmaster Tools</Label>
                    <Input
                      id="bingVerification"
                      value={integrationConfig.verification?.bing || ''}
                      onChange={(e) => updateIntegrationConfig('verification', { bing: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Code de vérification Bing"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passerelles de Paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Passerelles de Paiement
                </CardTitle>
                <CardDescription>
                  Configuration des services de paiement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Stripe</Label>
                    <p className="text-xs text-gray-600">Paiements par carte bancaire</p>
                  </div>
                  <Switch
                    checked={integrationConfig.stripe.enabled}
                    onCheckedChange={(checked) => setIntegrationConfig(prev => ({
                      ...prev,
                      stripe: { ...prev.stripe, enabled: checked }
                    }))}
                    disabled={!isEditing}
                  />
                </div>
                {integrationConfig.stripe.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="stripePublicKey">Clé publique Stripe</Label>
                    <Input
                      id="stripePublicKey"
                      value={integrationConfig.stripe.publicKey}
                      onChange={(e) => setIntegrationConfig(prev => ({
                        ...prev,
                        stripe: { ...prev.stripe, publicKey: e.target.value }
                      }))}
                      disabled={!isEditing}
                      placeholder="pk_live_..."
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">PayPal</Label>
                    <p className="text-xs text-gray-600">Paiements internationaux</p>
                  </div>
                  <Switch
                    checked={integrationConfig.paypal.enabled}
                    onCheckedChange={(checked) => setIntegrationConfig(prev => ({
                      ...prev,
                      paypal: { ...prev.paypal, enabled: checked }
                    }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">FeexPay</Label>
                    <p className="text-xs text-gray-600">Paiements mobiles en Afrique</p>
                  </div>
                  <Switch
                    checked={integrationConfig.feexpay?.enabled || false}
                    onCheckedChange={(checked) => updateIntegrationConfig('feexpay', { enabled: checked })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Twilio</Label>
                    <p className="text-xs text-gray-600">Notifications SMS</p>
                  </div>
                  <Switch
                    checked={integrationConfig.twilio.enabled}
                    onCheckedChange={(checked) => setIntegrationConfig(prev => ({
                      ...prev,
                      twilio: { ...prev.twilio, enabled: checked }
                    }))}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scripts personnalisés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-indigo-600" />
                  Scripts Personnalisés
                </CardTitle>
                <CardDescription>
                  Codes JavaScript et CSS personnalisés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="headerScripts">Scripts dans &lt;head&gt;</Label>
                    <Textarea
                      id="headerScripts"
                      value={integrationConfig.customScripts?.header || ''}
                      onChange={(e) => updateIntegrationConfig('customScripts', { header: e.target.value })}
                      disabled={!isEditing}
                      placeholder="<!-- Scripts à inclure dans le <head> -->"
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bodyScripts">Scripts avant &lt;/body&gt;</Label>
                    <Textarea
                      id="bodyScripts"
                      value={integrationConfig.customScripts?.body || ''}
                      onChange={(e) => updateIntegrationConfig('customScripts', { body: e.target.value })}
                      disabled={!isEditing}
                      placeholder="<!-- Scripts à inclure avant </body> -->"
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customCss">CSS Personnalisé</Label>
                    <Textarea
                      id="customCss"
                      value={integrationConfig.customScripts?.css || ''}
                      onChange={(e) => updateIntegrationConfig('customScripts', { css: e.target.value })}
                      disabled={!isEditing}
                      placeholder="/* Styles CSS personnalisés */"
                      rows={4}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Chat et Support</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Widget de chat</Label>
                      <p className="text-xs text-gray-600">Intégration Intercom, Zendesk, etc.</p>
                    </div>
                    <Switch
                      checked={integrationConfig.chatWidget?.enabled || false}
                                          onCheckedChange={(checked) => updateIntegrationConfig('chatWidget', { enabled: checked })}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  {integrationConfig.chatWidget?.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="chatWidgetCode">Code du widget de chat</Label>
                      <Textarea
                        id="chatWidgetCode"
                        value={integrationConfig.chatWidget?.code || ''}
                        onChange={(e) => updateIntegrationConfig('chatWidget', { code: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Code d'intégration du widget de chat"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de configuration des méthodes de paiement */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {selectedPaymentMethod ? 'Modifier la méthode de paiement' : 'Nouvelle méthode de paiement'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de Base</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentName">Nom de la méthode</Label>
                    <Input
                      id="paymentName"
                      placeholder="Ex: Mobile Money (Moov)"
                      value={paymentMethodDraft.name}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Type de paiement</Label>
                    <Select
                      value={paymentMethodDraft.type}
                      onValueChange={(value) => setPaymentMethodDraft(prev => ({ ...prev, type: value as PaymentMethod['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="bank_card">Carte Bancaire</SelectItem>
                        <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                        <SelectItem value="crypto">Cryptomonnaie</SelectItem>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="provider">Fournisseur</Label>
                    <Input
                      id="provider"
                      placeholder="Ex: Moov Money, FeexPay, PayPal"
                      value={paymentMethodDraft.provider}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, provider: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Description de la méthode de paiement"
                      value={paymentMethodDraft.description}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration des frais et limites */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frais et Limites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feePercentage">Frais en pourcentage (%)</Label>
                    <Input
                      id="feePercentage"
                      type="number"
                      step="0.1"
                      placeholder="1.5"
                      value={String(paymentMethodDraft.fees?.percentage ?? 0)}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, fees: { ...prev.fees, percentage: Number(e.target.value) } }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="feeFixed">Frais fixes</Label>
                    <Input
                      id="feeFixed"
                      type="number"
                      placeholder="100"
                      value={String(paymentMethodDraft.fees?.fixed ?? 0)}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, fees: { ...prev.fees, fixed: Number(e.target.value) } }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="feeCurrency">Devise des frais</Label>
                    <Select
                      value={paymentMethodDraft.fees?.currency ?? 'XOF'}
                      onValueChange={(value) => setPaymentMethodDraft(prev => ({ ...prev, fees: { ...prev.fees, currency: value } }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="USD">Dollar US (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="limitMin">Limite minimale</Label>
                    <Input
                      id="limitMin"
                      type="number"
                      placeholder="100"
                      value={String(paymentMethodDraft.limits?.min ?? 0)}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, limits: { ...prev.limits, min: Number(e.target.value) } }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="limitMax">Limite maximale</Label>
                    <Input
                      id="limitMax"
                      type="number"
                      placeholder="1000000"
                      value={String(paymentMethodDraft.limits?.max ?? 0)}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, limits: { ...prev.limits, max: Number(e.target.value) } }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="limitCurrency">Devise des limites</Label>
                    <Select
                      value={paymentMethodDraft.limits?.currency ?? 'XOF'}
                      onValueChange={(value) => setPaymentMethodDraft(prev => ({ ...prev, limits: { ...prev.limits, currency: value } }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="USD">Dollar US (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions et configuration API */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions et API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions pour l'utilisateur</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Instructions détaillées pour utiliser cette méthode de paiement"
                      rows={3}
                      value={paymentMethodDraft.instructions}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, instructions: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="publicKey">Clé publique API</Label>
                      <Input
                        id="publicKey"
                        placeholder="Clé publique de l'API"
                        value={paymentMethodDraft.apiKeys?.publicKey ?? ''}
                        onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, publicKey: e.target.value } }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secretKey">Clé secrète API</Label>
                      <Input
                        id="secretKey"
                        type="password"
                        placeholder="Clé secrète de l'API"
                        value={paymentMethodDraft.apiKeys?.secretKey ?? ''}
                        onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, secretKey: e.target.value } }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">URL Webhook</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://votre-site.com/webhook/payment"
                      value={paymentMethodDraft.apiKeys?.webhookUrl ?? ''}
                      onChange={(e) => setPaymentMethodDraft(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, webhookUrl: e.target.value } }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Annuler
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={upsertPaymentMethod}
              disabled={!isEditing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {selectedPaymentMethod ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
