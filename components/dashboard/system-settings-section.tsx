"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { 
  Settings, 
  Shield, 
  RefreshCw, 
  Package, 
  Activity,
  Key,
  Eye,
  Download,
  Upload,
  Trash2,
  Globe,
  Mail,
  MessageCircle,
  Share2,
  Smartphone,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useAuth } from '@/contexts/AuthContext'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'

type SystemPreferences = {
  language: 'fr' | 'en' | 'es' | 'de'
  timezone: 'africa_cotonou' | 'europe_paris' | 'america_new_york' | 'asia_tokyo'
  currency: 'xof' | 'eur' | 'usd' | 'gbp'
  theme: 'light' | 'dark' | 'auto'
  animations: boolean
  compactMode: boolean
  twoFactorAuth: boolean
  biometricLogin: boolean
  publicProfile: boolean
  purchaseHistory: boolean
  geolocation: boolean
  autoBackup: boolean
  realtimeSync: boolean
  offlineSync: boolean
  smartCache: boolean
  preload: boolean
  compression: boolean
  webhooksEnabled: boolean
  webhookUrl: string
}

function normalizePreferences(value: unknown): SystemPreferences {
  const raw = (value && typeof value === 'object') ? (value as any) : {}

  const asBool = (v: any, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)
  const asString = (v: any, fallback: string) => (typeof v === 'string' ? v : fallback)
  const asEnum = <T extends string>(v: any, allowed: readonly T[], fallback: T): T => {
    return allowed.includes(v as T) ? (v as T) : fallback
  }

  return {
    language: asEnum(raw.language, ['fr', 'en', 'es', 'de'] as const, 'fr'),
    timezone: asEnum(raw.timezone, ['africa_cotonou', 'europe_paris', 'america_new_york', 'asia_tokyo'] as const, 'africa_cotonou'),
    currency: asEnum(raw.currency, ['xof', 'eur', 'usd', 'gbp'] as const, 'xof'),
    theme: asEnum(raw.theme, ['light', 'dark', 'auto'] as const, 'light'),
    animations: asBool(raw.animations, true),
    compactMode: asBool(raw.compactMode, false),
    twoFactorAuth: asBool(raw.twoFactorAuth, false),
    biometricLogin: asBool(raw.biometricLogin, false),
    publicProfile: asBool(raw.publicProfile, true),
    purchaseHistory: asBool(raw.purchaseHistory, true),
    geolocation: asBool(raw.geolocation, false),
    autoBackup: asBool(raw.autoBackup, true),
    realtimeSync: asBool(raw.realtimeSync, true),
    offlineSync: asBool(raw.offlineSync, true),
    smartCache: asBool(raw.smartCache, true),
    preload: asBool(raw.preload, true),
    compression: asBool(raw.compression, false),
    webhooksEnabled: asBool(raw.webhooksEnabled, false),
    webhookUrl: asString(raw.webhookUrl, '')
  }
}

function isSameSystemPrefs(a: Pick<SystemPreferences, 'language' | 'timezone' | 'currency' | 'theme'>, b: Pick<SystemPreferences, 'language' | 'timezone' | 'currency' | 'theme'>): boolean {
  return a.language === b.language && a.timezone === b.timezone && a.currency === b.currency && a.theme === b.theme
}

export default function SystemSettingsSection() {
  const { user, userProfile, updateProfile } = useAuth()
  const { systemPrefs, setLanguage, setCurrency, setTimezone, setTheme } = useUserPreferences()

  const initialPreferences = useMemo<SystemPreferences>(() => {
    return normalizePreferences(systemPrefs)
  }, [systemPrefs])

  const [prefs, setPrefs] = useState<SystemPreferences>(initialPreferences)
  const [activeTab, setActiveTab] = useState('general')
  const hasHydratedRef = useRef(false)
  const saveTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setPrefs(initialPreferences)
    hasHydratedRef.current = true
  }, [initialPreferences])

  // Sauvegarde automatique (debounce) des préférences utilisateur.
  useEffect(() => {
    if (!hasHydratedRef.current) return
    if (!user?.id) return

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      const existing = ((userProfile as any)?.preferences && typeof (userProfile as any).preferences === 'object')
        ? (userProfile as any).preferences
        : {}

      const existingSystem = normalizePreferences((existing as any)?.system)
      if (isSameSystemPrefs(existingSystem, prefs)) {
        return
      }

      const nextPreferences = { ...existing, system: prefs }
      void updateProfile({ preferences: nextPreferences } as any)
    }, 600)

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [prefs, updateProfile, user?.id, userProfile])

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques système */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-900">98.5%</div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-purple-600 mt-2">Système optimal</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Sécurité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-900">Élevée</div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">Tous les contrôles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Synchronisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-900">Actif</div>
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin-slow" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Dernière: 2 min</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Stockage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-900">2.4GB</div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-600 mt-2">Utilisé sur 10GB</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="data">Données & Sync</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Paramètres généraux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Paramètres Généraux</span>
              </CardTitle>
              <CardDescription>
                Configuration générale de votre compte et préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Langue et localisation */}
                <div className="space-y-4">
                  <h4 className="font-medium">Langue et Localisation</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="language">Langue</Label>
                      <Select
                        value={prefs.language}
                        onValueChange={(value) => {
                          const next = value as SystemPreferences['language']
                          setPrefs((prev) => ({ ...prev, language: next }))
                          setLanguage(next as any)
                        }}
                      >
                        <SelectTrigger className="w-40">
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
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <Select
                        value={prefs.timezone}
                        onValueChange={(value) => {
                          const next = value as SystemPreferences['timezone']
                          setPrefs((prev) => ({ ...prev, timezone: next }))
                          setTimezone(next as any)
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="africa_cotonou">Africa/Cotonou</SelectItem>
                          <SelectItem value="europe_paris">Europe/Paris</SelectItem>
                          <SelectItem value="america_new_york">America/New_York</SelectItem>
                          <SelectItem value="asia_tokyo">Asia/Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="currency">Devise</Label>
                      <Select
                        value={prefs.currency}
                        onValueChange={(value) => {
                          const next = value as SystemPreferences['currency']
                          setPrefs((prev) => ({ ...prev, currency: next }))
                          setCurrency(next as any)
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xof">XOF (FCFA)</SelectItem>
                          <SelectItem value="eur">EUR (Euro)</SelectItem>
                          <SelectItem value="usd">USD (Dollar)</SelectItem>
                          <SelectItem value="gbp">GBP (Livre)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Préférences d'affichage */}
                <div className="space-y-4">
                  <h4 className="font-medium">Préférences d'Affichage</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme">Thème</Label>
                      <Select
                        value={prefs.theme}
                        onValueChange={(value) => {
                          const next = value as SystemPreferences['theme']
                          setPrefs((prev) => ({ ...prev, theme: next }))
                          setTheme(next as any)
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Clair</SelectItem>
                          <SelectItem value="dark">Sombre</SelectItem>
                          <SelectItem value="auto">Automatique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animations</Label>
                        <p className="text-sm text-gray-500">Activer les animations fluides</p>
                      </div>
                      <Switch
                        checked={prefs.animations}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, animations: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mode haute densité</Label>
                        <p className="text-sm text-gray-500">Affichage compact</p>
                      </div>
                      <Switch
                        checked={prefs.compactMode}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, compactMode: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Sécurité et confidentialité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Sécurité et Confidentialité</span>
              </CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte et vos préférences de confidentialité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Authentification */}
                <div className="space-y-4">
                  <h4 className="font-medium">Authentification</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Authentification à deux facteurs</Label>
                        <p className="text-sm text-gray-500">Protection renforcée</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={prefs.twoFactorAuth}
                          onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, twoFactorAuth: checked }))}
                        />
                                                    <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    alert('Configuration de l\'authentification à deux facteurs !')
                                  }}
                                >
                                  <Key className="w-4 h-4 mr-2" />
                                  Configurer
                                </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Connexion biométrique</Label>
                        <p className="text-sm text-gray-500">Empreinte/visage</p>
                      </div>
                      <Switch
                        checked={prefs.biometricLogin}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, biometricLogin: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sessions actives</Label>
                        <p className="text-sm text-gray-500">3 appareils connectés</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          alert('Gestion des sessions actives !')
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Gérer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Confidentialité */}
                <div className="space-y-4">
                  <h4 className="font-medium">Confidentialité</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Profil public</Label>
                        <p className="text-sm text-gray-500">Visible par les vendeurs</p>
                      </div>
                      <Switch
                        checked={prefs.publicProfile}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, publicProfile: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Historique d'achat</Label>
                        <p className="text-sm text-gray-500">Analyses pour recommandations</p>
                      </div>
                      <Switch
                        checked={prefs.purchaseHistory}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, purchaseHistory: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Géolocalisation</Label>
                        <p className="text-sm text-gray-500">Offres locales</p>
                      </div>
                      <Switch
                        checked={prefs.geolocation}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, geolocation: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Données et synchronisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <span>Données et Synchronisation</span>
              </CardTitle>
              <CardDescription>
                Gérez vos données et les paramètres de synchronisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sauvegarde */}
                <div className="space-y-4">
                  <h4 className="font-medium">Sauvegarde et Restauration</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sauvegarde automatique</Label>
                        <p className="text-sm text-gray-500">Chaque jour à 02:00</p>
                      </div>
                      <Switch
                        checked={prefs.autoBackup}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, autoBackup: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dernière sauvegarde</Label>
                        <p className="text-sm text-gray-500">Aujourd'hui, 02:15</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          alert('Téléchargement de la sauvegarde en cours...')
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Restaurer données</Label>
                        <p className="text-sm text-gray-500">Depuis une sauvegarde</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          alert('Restauration des données en cours...')
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Restaurer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Synchronisation */}
                <div className="space-y-4">
                  <h4 className="font-medium">Synchronisation Multi-appareils</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sync temps réel</Label>
                        <p className="text-sm text-gray-500">Toutes les données</p>
                      </div>
                      <Switch
                        checked={prefs.realtimeSync}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, realtimeSync: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sync hors ligne</Label>
                        <p className="text-sm text-gray-500">Mode déconnecté</p>
                      </div>
                      <Switch
                        checked={prefs.offlineSync}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, offlineSync: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Appareils connectés</Label>
                        <p className="text-sm text-gray-500">3 sur 5 autorisés</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          alert('Gestion des appareils connectés !')
                        }}
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Gérer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance et optimisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>Performance et Optimisation</span>
              </CardTitle>
              <CardDescription>
                Optimisez les performances de votre application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Métriques de performance */}
                <div className="space-y-4">
                  <h4 className="font-medium">Métriques en Temps Réel</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vitesse de chargement</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">1.2s</div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Utilisation mémoire</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">45MB</div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Taux d'erreur</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">0.02%</div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimisations */}
                <div className="space-y-4">
                  <h4 className="font-medium">Optimisations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Cache intelligent</Label>
                        <p className="text-xs text-gray-500">Données fréquentes</p>
                      </div>
                      <Switch
                        checked={prefs.smartCache}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, smartCache: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Préchargement</Label>
                        <p className="text-xs text-gray-500">Images et données</p>
                      </div>
                      <Switch
                        checked={prefs.preload}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, preload: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compression</Label>
                        <p className="text-xs text-gray-500">Économie de bande</p>
                      </div>
                      <Switch
                        checked={prefs.compression}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, compression: checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="space-y-4">
                  <h4 className="font-medium">Actions Rapides</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => {
                        alert('Cache vidé avec succès !')
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Vider le cache
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => {
                        alert('Synchronisation forcée en cours...')
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Forcer la sync
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => {
                        alert('Analyse de performance en cours...')
                      }}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Analyser performance
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => {
                        alert('Scan de sécurité en cours...')
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Scan sécurité
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Intégrations et API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <span>Intégrations et API</span>
              </CardTitle>
              <CardDescription>
                Gérez vos intégrations avec des services tiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Services connectés */}
                <div className="space-y-4">
                  <h4 className="font-medium">Services Connectés</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Email</div>
                          <div className="text-sm text-gray-500">Notifications automatiques</div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connecté</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">WhatsApp</div>
                          <div className="text-sm text-gray-500">Chat avec vendeurs</div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connecté</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Share2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Réseaux Sociaux</div>
                          <div className="text-sm text-gray-500">Partage et promotions</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connecter</Button>
                    </div>
                  </div>
                </div>

                {/* Clés API */}
                <div className="space-y-4">
                  <h4 className="font-medium">Clés API et Webhooks</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Clé API personnelle</Label>
                      <div className="flex space-x-2">
                        <Input 
                          type="password" 
                          value="••••••••••••••••••••••••••••••••"
                          readOnly
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        value={prefs.webhookUrl}
                        onChange={(e) => setPrefs((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                        placeholder="https://votre-site.com/webhook"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Webhooks actifs</Label>
                        <p className="text-sm text-gray-500">Événements en temps réel</p>
                      </div>
                      <Switch
                        checked={prefs.webhooksEnabled}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, webhooksEnabled: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          {/* Actions système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Actions Système</span>
              </CardTitle>
              <CardDescription>
                Actions critiques et gestion du compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="p-4 h-auto flex-col space-y-2"
                  onClick={() => {
                    alert('Export des données en cours...')
                  }}
                >
                  <Download className="w-6 h-6 text-blue-600" />
                  <div className="text-center">
                    <div className="font-medium">Exporter les données</div>
                    <div className="text-sm text-gray-500">Télécharger toutes vos données</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="p-4 h-auto flex-col space-y-2"
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos préférences ?')) {
                      setPrefs(normalizePreferences({}))
                      alert('Préférences réinitialisées !')
                    }
                  }}
                >
                  <RefreshCw className="w-6 h-6 text-green-600" />
                  <div className="text-center">
                    <div className="font-medium">Réinitialiser préférences</div>
                    <div className="text-sm text-gray-500">Retour aux paramètres par défaut</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="p-4 h-auto flex-col space-y-2 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('ATTENTION : Cette action est irréversible. Êtes-vous absolument sûr de vouloir supprimer votre compte ?')) {
                      alert('Demande de suppression du compte envoyée à l\'administration.')
                    }
                  }}
                >
                  <Trash2 className="w-6 h-6 text-red-600" />
                  <div className="text-center">
                    <div className="font-medium text-red-600">Supprimer le compte</div>
                    <div className="text-sm text-gray-500">Action irréversible</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
