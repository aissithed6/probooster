"use client"

import { useState, useEffect } from "react"
import { Globe, Check, ChevronDown, Languages, Translate, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"

export default function HeaderLanguage() {
  const { systemPrefs, setLanguage } = useUserPreferences()
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("fr")
  const [selectedRegion, setSelectedRegion] = useState("CI")
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Fonction utilitaire pour localStorage sécurisé
  const safeLocalStorage = {
    getItem: (key: string, defaultValue: string = '') => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || defaultValue
      }
      return defaultValue
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    }
  }

  // Initialisation
  useEffect(() => {
    setIsClient(true)
    loadLanguageSettings()
  }, [])

  useEffect(() => {
    setSelectedLanguage(systemPrefs.language)
  }, [systemPrefs.language])

  const loadLanguageSettings = () => {
    try {
      const savedLanguage = safeLocalStorage.getItem('selectedLanguage', 'fr')
      const savedRegion = safeLocalStorage.getItem('selectedRegion', 'CI')
      const savedAutoTranslate = safeLocalStorage.getItem('autoTranslate', 'false')
      
      setSelectedLanguage(systemPrefs.language)
      setSelectedRegion(savedRegion)
      setAutoTranslate(savedAutoTranslate === 'true')
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de langue:', error)
    }
  }

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    safeLocalStorage.setItem('selectedLanguage', language)

    // La langue est centralisée via UserPreferencesProvider (profil + DOM).
    setLanguage(language as any)

    const event = new CustomEvent('languageChanged', { detail: { language, region: selectedRegion } })
    window.dispatchEvent(event)
  }

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    safeLocalStorage.setItem('selectedRegion', region)
    
    // Sauvegarder la préférence
    const event = new CustomEvent('regionChanged', { detail: { language: selectedLanguage, region } })
    window.dispatchEvent(event)
  }

  const handleAutoTranslateChange = (enabled: boolean) => {
    setAutoTranslate(enabled)
    safeLocalStorage.setItem('autoTranslate', enabled.toString())
    
    if (enabled) {
      alert('🌐 Traduction automatique activée ! Les contenus seront traduits automatiquement.')
    }
  }

  const languages = [
    {
      code: "fr",
      name: "Français",
      nativeName: "Français",
      flag: "🇫🇷",
      region: "France",
      description: "Langue officielle de la France et de nombreux pays africains"
    },
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
      region: "United States",
      description: "Langue internationale par excellence"
    },
    {
      code: "es",
      name: "Español",
      nativeName: "Español",
      flag: "🇪🇸",
      region: "España",
      description: "Langue parlée dans de nombreux pays hispanophones"
    },
    {
      code: "de",
      name: "Deutsch",
      nativeName: "Deutsch",
      flag: "🇩🇪",
      region: "Deutschland",
      description: "Langue officielle de l'Allemagne et de l'Autriche"
    },
    {
      code: "it",
      name: "Italiano",
      nativeName: "Italiano",
      flag: "🇮🇹",
      region: "Italia",
      description: "Langue de la culture et de l'art italien"
    },
    {
      code: "pt",
      name: "Português",
      nativeName: "Português",
      flag: "🇵🇹",
      region: "Portugal",
      description: "Langue parlée au Portugal et au Brésil"
    },
    {
      code: "ar",
      name: "العربية",
      nativeName: "العربية",
      flag: "🇸🇦",
      region: "العربية",
      description: "Langue sémitique parlée dans le monde arabe"
    },
    {
      code: "zh",
      name: "中文",
      nativeName: "中文",
      flag: "🇨🇳",
      region: "中国",
      description: "Langue la plus parlée au monde"
    },
    {
      code: "ja",
      name: "日本語",
      nativeName: "日本語",
      flag: "🇯🇵",
      region: "日本",
      description: "Langue officielle du Japon"
    },
    {
      code: "ko",
      name: "한국어",
      nativeName: "한국어",
      flag: "🇰🇷",
      region: "대한민국",
      description: "Langue officielle de la Corée du Sud"
    }
  ]

  const regions = [
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "F CFA", timezone: "GMT+0" },
    { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", timezone: "GMT+1" },
    { code: "US", name: "États-Unis", flag: "🇺🇸", currency: "USD", timezone: "GMT-5" },
    { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", timezone: "GMT-5" },
    { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", currency: "GBP", timezone: "GMT+0" },
    { code: "DE", name: "Allemagne", flag: "🇩🇪", currency: "EUR", timezone: "GMT+1" },
    { code: "ES", name: "Espagne", flag: "🇪🇸", currency: "EUR", timezone: "GMT+1" },
    { code: "IT", name: "Italie", flag: "🇮🇹", currency: "EUR", timezone: "GMT+1" },
    { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "F CFA", timezone: "GMT+0" },
    { code: "ML", name: "Mali", flag: "🇲🇱", currency: "F CFA", timezone: "GMT+0" },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "F CFA", timezone: "GMT+0" },
    { code: "NE", name: "Niger", flag: "🇳🇪", currency: "F CFA", timezone: "GMT+1" },
    { code: "TD", name: "Tchad", flag: "🇹🇩", currency: "F CFA", timezone: "GMT+1" },
    { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "F CFA", timezone: "GMT+1" },
    { code: "CF", name: "République centrafricaine", flag: "🇨🇫", currency: "F CFA", timezone: "GMT+1" },
    { code: "CG", name: "République du Congo", flag: "🇨🇬", currency: "F CFA", timezone: "GMT+1" },
    { code: "GA", name: "Gabon", flag: "🇬🇦", currency: "F CFA", timezone: "GMT+1" },
    { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶", currency: "F CFA", timezone: "GMT+1" }
  ]

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage)
  const currentRegion = regions.find(region => region.code === selectedRegion)

  const getLanguageFlag = (code: string) => {
    const language = languages.find(lang => lang.code === code)
    return language ? language.flag : "🌐"
  }

  const getLanguageName = (code: string) => {
    const language = languages.find(lang => lang.code === code)
    return language ? language.name : "Inconnu"
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full">
          <Globe className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <Globe className="h-5 w-5 group-hover:scale-110 transition-all duration-300" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Paramètres de langue</DialogTitle>
            <DialogDescription>
              Choisissez votre langue et votre région
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 p-6 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Globe className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Langue et Région</h2>
                  <p className="text-white/80 text-sm">
                    Personnalisez votre expérience selon vos préférences
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {currentLanguage?.flag} {currentLanguage?.name}
                  </div>
                  <div className="text-sm text-white/80">
                    {currentRegion?.flag} {currentRegion?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration actuelle */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Langue actuelle */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Languages className="h-5 w-5" />
                    <span>Langue actuelle</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{currentLanguage?.flag}</div>
                    <div>
                      <div className="font-semibold text-lg">{currentLanguage?.name}</div>
                      <div className="text-sm text-gray-600">{currentLanguage?.nativeName}</div>
                      <div className="text-xs text-gray-500">{currentLanguage?.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Région actuelle */}
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Settings className="h-5 w-5" />
                    <span>Région actuelle</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{currentRegion?.flag}</div>
                    <div>
                      <div className="font-semibold text-lg">{currentRegion?.name}</div>
                      <div className="text-sm text-gray-600">{currentRegion?.currency}</div>
                      <div className="text-xs text-gray-500">{currentRegion?.timezone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sélection de la langue */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Languages className="h-5 w-5 text-blue-600" />
              <span>Choisir une langue</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {languages.map((language) => (
                <Card 
                  key={language.code}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedLanguage === language.code 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{language.flag}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{language.name}</div>
                        <div className="text-sm text-gray-600">{language.nativeName}</div>
                        <div className="text-xs text-gray-500">{language.region}</div>
                      </div>
                      {selectedLanguage === language.code && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sélection de la région */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <span>Choisir une région</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions.map((region) => (
                <Card 
                  key={region.code}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedRegion === region.code 
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleRegionChange(region.code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{region.flag}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{region.name}</div>
                        <div className="text-sm text-gray-600">{region.currency}</div>
                        <div className="text-xs text-gray-500">{region.timezone}</div>
                      </div>
                      {selectedRegion === region.code && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Options avancées */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Translate className="h-5 w-5 text-purple-600" />
              <span>Options avancées</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Translate className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-semibold">Traduction automatique</div>
                    <div className="text-sm text-gray-600">
                      Traduire automatiquement le contenu non disponible dans votre langue
                    </div>
                  </div>
                </div>
                <Switch
                  checked={autoTranslate}
                  onCheckedChange={handleAutoTranslateChange}
                />
              </div>
              
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>💡 Conseil :</strong> Choisir la langue de votre région peut améliorer l'expérience 
                avec des devises et formats locaux appropriés.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between p-6">
            <Button variant="outline" onClick={() => setShowLanguageModal(false)}>
              Fermer
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedLanguage('fr')
                  setSelectedRegion('CI')
                  handleLanguageChange('fr')
                  handleRegionChange('CI')
                }}
              >
                <Globe className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              
              <Button 
                onClick={() => setShowLanguageModal(false)}
                className="bg-[#ff6600] hover:bg-[#e55a00]"
              >
                <Check className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


