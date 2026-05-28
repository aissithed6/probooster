"use client"

import { useEffect, useState } from "react"
import { Settings, Bell, Volume2, Smartphone, Globe, Shield, Moon, Sun, Palette, Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"

export default function HeaderSettings() {
  const { systemPrefs, setTheme, setLanguage } = useUserPreferences()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'fr',
    notifications: {
      push: true,
      email: true,
      sms: false,
      sound: true,
      vibration: true
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reducedMotion: false
    }
  })

  // Garder l'UI locale synchronisée avec les préférences centralisées.
  // (Le provider s'occupe de persister dans Supabase + appliquer au DOM.)
  useEffect(() => {
    setSettings((prev) => ({ ...prev, theme: systemPrefs.theme, language: systemPrefs.language }))
  }, [systemPrefs.language, systemPrefs.theme])

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

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const handleGeneralSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = () => {
    try {
      safeLocalStorage.setItem('userSettings', JSON.stringify(settings))

      // Thème/langue centralisés
      setTheme(settings.theme as any)
      setLanguage(settings.language as any)
      
      alert('✅ Paramètres sauvegardés avec succès !')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      alert('❌ Erreur lors de la sauvegarde des paramètres')
    }
  }

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      language: 'fr',
      notifications: {
        push: true,
        email: true,
        sms: false,
        sound: true,
        vibration: true
      },
      privacy: {
        dataSharing: false,
        analytics: true,
        marketing: false
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false
      }
    }
    
    setSettings(defaultSettings)
    safeLocalStorage.setItem('userSettings', JSON.stringify(defaultSettings))
    setTheme(defaultSettings.theme as any)
    setLanguage(defaultSettings.language as any)
    alert('🔄 Paramètres réinitialisés aux valeurs par défaut')
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Settings Button */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
          >
            <Settings className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-[#ff6600]" />
              <span>Paramètres</span>
            </DialogTitle>
            <DialogDescription>
              Personnalisez votre expérience Probooster selon vos préférences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Paramètres généraux */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span>Paramètres généraux</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thème</label>
                    <Select value={settings.theme} onValueChange={(value) => handleGeneralSettingChange('theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center space-x-2">
                            <Sun className="h-4 w-4" />
                            <span>Clair</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center space-x-2">
                            <Moon className="h-4 w-4" />
                            <span>Sombre</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="auto">
                          <div className="flex items-center space-x-2">
                            <Palette className="h-4 w-4" />
                            <span>Automatique</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Langue</label>
                    <Select value={settings.language} onValueChange={(value) => handleGeneralSettingChange('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paramètres de notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Notifications push</span>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Notifications email</span>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Notifications SMS</span>
                    </div>
                    <Switch
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'sms', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Alertes sonores</span>
                    </div>
                    <Switch
                      checked={settings.notifications.sound}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'sound', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Vibrations</span>
                    </div>
                    <Switch
                      checked={settings.notifications.vibration}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'vibration', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paramètres de confidentialité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Confidentialité et sécurité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Partage de données</span>
                    </div>
                    <Switch
                      checked={settings.privacy.dataSharing}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'dataSharing', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Analytics</span>
                    </div>
                    <Switch
                      checked={settings.privacy.analytics}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'analytics', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Marketing</span>
                    </div>
                    <Switch
                      checked={settings.privacy.marketing}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'marketing', checked)}
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-800">
                    🔒 Vos données personnelles sont protégées et ne seront jamais vendues à des tiers.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Paramètres d'accessibilité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                  <span>Accessibilité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Palette className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Contraste élevé</span>
                    </div>
                    <Switch
                      checked={settings.accessibility.highContrast}
                      onCheckedChange={(checked) => handleSettingChange('accessibility', 'highContrast', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Palette className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Texte agrandi</span>
                    </div>
                    <Switch
                      checked={settings.accessibility.largeText}
                      onCheckedChange={(checked) => handleSettingChange('accessibility', 'largeText', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Mouvement réduit</span>
                    </div>
                    <Switch
                      checked={settings.accessibility.reducedMotion}
                      onCheckedChange={(checked) => handleSettingChange('accessibility', 'reducedMotion', checked)}
                    />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-purple-800">
                    ♿ Ces paramètres améliorent l'accessibilité pour tous les utilisateurs.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetSettings}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              
              <Button onClick={saveSettings} className="bg-[#ff6600] hover:bg-[#e55a00]">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


