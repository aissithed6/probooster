"use client"

import { useState, useEffect } from "react"
import { Sun, Moon, Monitor, Palette, Eye, EyeOff, Contrast, Zap, Sparkles, Settings, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export default function HeaderTheme() {
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "auto">("auto")
  const [accentColor, setAccentColor] = useState("orange")
  const [fontSize, setFontSize] = useState(16)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
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
    loadThemeSettings()
  }, [])

  const loadThemeSettings = () => {
    try {
      const savedTheme = safeLocalStorage.getItem('theme', 'auto')
      const savedAccentColor = safeLocalStorage.getItem('accentColor', 'orange')
      const savedFontSize = safeLocalStorage.getItem('fontSize', '16')
      const savedReducedMotion = safeLocalStorage.getItem('reducedMotion', 'false')
      const savedHighContrast = safeLocalStorage.getItem('highContrast', 'false')
      
      setCurrentTheme(savedTheme as "light" | "dark" | "auto")
      setAccentColor(savedAccentColor)
      setFontSize(parseInt(savedFontSize))
      setReducedMotion(savedReducedMotion === 'true')
      setHighContrast(savedHighContrast === 'true')
      
      applyTheme(savedTheme as "light" | "dark" | "auto")
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de thème:', error)
    }
  }

  const applyTheme = (theme: "light" | "dark" | "auto") => {
    const root = document.documentElement
    
    if (theme === "auto") {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === "dark")
    }
    
    // Sauvegarder dans localStorage
    safeLocalStorage.setItem('theme', theme)
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('themeChanged', { detail: { theme } })
    window.dispatchEvent(event)
  }

  const handleThemeChange = (theme: "light" | "dark" | "auto") => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    safeLocalStorage.setItem('accentColor', color)
    
    // Appliquer la couleur d'accent
    const root = document.documentElement
    root.style.setProperty('--accent-color', getAccentColorValue(color))
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('accentColorChanged', { detail: { color } })
    window.dispatchEvent(event)
  }

  const handleFontSizeChange = (size: number[]) => {
    const newSize = size[0]
    setFontSize(newSize)
    safeLocalStorage.setItem('fontSize', newSize.toString())
    
    // Appliquer la taille de police
    document.documentElement.style.fontSize = `${newSize}px`
  }

  const handleReducedMotionChange = (enabled: boolean) => {
    setReducedMotion(enabled)
    safeLocalStorage.setItem('reducedMotion', enabled.toString())
    
    // Appliquer la réduction de mouvement
    if (enabled) {
      document.documentElement.style.setProperty('--reduced-motion', 'reduce')
    } else {
      document.documentElement.style.removeProperty('--reduced-motion')
    }
  }

  const handleHighContrastChange = (enabled: boolean) => {
    setHighContrast(enabled)
    safeLocalStorage.setItem('highContrast', enabled.toString())
    
    // Appliquer le contraste élevé
    document.documentElement.classList.toggle('high-contrast', enabled)
  }

  const getAccentColorValue = (color: string) => {
    switch (color) {
      case 'orange':
        return '#ff6600'
      case 'blue':
        return '#3b82f6'
      case 'green':
        return '#10b981'
      case 'purple':
        return '#8b5cf6'
      case 'pink':
        return '#ec4899'
      case 'red':
        return '#ef4444'
      case 'yellow':
        return '#f59e0b'
      case 'teal':
        return '#14b8a6'
      default:
        return '#ff6600'
    }
  }

  const getAccentColorName = (color: string) => {
    switch (color) {
      case 'orange':
        return 'Orange'
      case 'blue':
        return 'Bleu'
      case 'green':
        return 'Vert'
      case 'purple':
        return 'Violet'
      case 'pink':
        return 'Rose'
      case 'red':
        return 'Rouge'
      case 'yellow':
        return 'Jaune'
      case 'teal':
        return 'Bleu-vert'
      default:
        return 'Orange'
    }
  }

  const themes = [
    {
      id: "light",
      name: "Clair",
      description: "Thème clair parfait pour la journée",
      icon: Sun,
      color: "yellow",
      preview: "bg-white text-gray-900 border-gray-200"
    },
    {
      id: "dark",
      name: "Sombre",
      description: "Thème sombre pour les yeux sensibles",
      icon: Moon,
      color: "blue",
      preview: "bg-gray-900 text-white border-gray-700"
    },
    {
      id: "auto",
      name: "Automatique",
      description: "Suit vos préférences système",
      icon: Monitor,
      color: "purple",
      preview: "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 border-blue-200"
    }
  ]

  const accentColors = [
    { id: "orange", name: "Orange", color: "#ff6600", preview: "bg-orange-500" },
    { id: "blue", name: "Bleu", color: "#3b82f6", preview: "bg-blue-500" },
    { id: "green", name: "Vert", color: "#10b981", preview: "bg-green-500" },
    { id: "purple", name: "Violet", color: "#8b5cf6", preview: "bg-purple-500" },
    { id: "pink", name: "Rose", color: "#ec4899", preview: "bg-pink-500" },
    { id: "red", name: "Rouge", color: "#ef4444", preview: "bg-red-500" },
    { id: "yellow", name: "Jaune", color: "#f59e0b", preview: "bg-yellow-500" },
    { id: "teal", name: "Bleu-vert", color: "#14b8a6", preview: "bg-teal-500" }
  ]

  const currentThemeData = themes.find(theme => theme.id === currentTheme)
  const currentAccentColorData = accentColors.find(color => color.id === accentColor)

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full">
          <Palette className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Dialog open={showThemeModal} onOpenChange={setShowThemeModal}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <Palette className="h-5 w-5 group-hover:scale-110 transition-all duration-300" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Paramètres de thème</DialogTitle>
            <DialogDescription>
              Personnalisez l'apparence de votre interface
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-6 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Palette className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Personnalisation</h2>
                  <p className="text-white/80 text-sm">
                    Adaptez l'interface à vos préférences visuelles
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {currentThemeData?.icon && <currentThemeData.icon className="h-5 w-5 inline mr-2" />}
                    {currentThemeData?.name}
                  </div>
                  <div className="text-sm text-white/80">
                    {currentAccentColorData?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration actuelle */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thème actuel */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Monitor className="h-5 w-5" />
                    <span>Thème actuel</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className={`w-16 h-16 rounded-lg border-2 ${currentThemeData?.preview} flex items-center justify-center`}>
                      {currentThemeData?.icon && <currentThemeData.icon className="h-8 w-8" />}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{currentThemeData?.name}</div>
                      <div className="text-sm text-gray-600">{currentThemeData?.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Couleur d'accent actuelle */}
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Sparkles className="h-5 w-5" />
                    <span>Couleur d'accent</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className={`w-16 h-16 rounded-lg ${currentAccentColorData?.preview} flex items-center justify-center`}>
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{currentAccentColorData?.name}</div>
                      <div className="text-sm text-gray-600">Couleur principale</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sélection du thème */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <span>Choisir un thème</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <Card 
                  key={theme.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    currentTheme === theme.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleThemeChange(theme.id as "light" | "dark" | "auto")}
                >
                  <CardContent className="p-4">
                    <div className={`w-full h-24 rounded-lg border-2 ${theme.preview} flex items-center justify-center mb-3`}>
                      <theme.icon className="h-12 w-12" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{theme.name}</div>
                      <div className="text-sm text-gray-600">{theme.description}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sélection de la couleur d'accent */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span>Choisir une couleur d'accent</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {accentColors.map((color) => (
                <Card 
                  key={color.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    accentColor === color.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleAccentColorChange(color.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-16 h-16 rounded-full ${color.preview} mx-auto mb-3 flex items-center justify-center`}>
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="font-semibold">{color.name}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Paramètres avancés */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <span>Paramètres avancés</span>
            </h3>
            
            <div className="space-y-6">
              {/* Taille de police */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-semibold">Taille de police</div>
                      <div className="text-sm text-gray-600">
                        Ajustez la taille du texte pour une meilleure lisibilité
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {fontSize}px
                  </Badge>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={handleFontSizeChange}
                  max={24}
                  min={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>12px</span>
                  <span>18px</span>
                  <span>24px</span>
                </div>
              </div>

              {/* Réduction de mouvement */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold">Réduction de mouvement</div>
                    <div className="text-sm text-gray-600">
                      Désactive les animations pour les utilisateurs sensibles
                    </div>
                  </div>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={handleReducedMotionChange}
                />
              </div>

              {/* Contraste élevé */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <Contrast className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold">Contraste élevé</div>
                    <div className="text-sm text-gray-600">
                      Améliore la lisibilité avec des contrastes plus marqués
                    </div>
                  </div>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={handleHighContrastChange}
                />
              </div>
            </div>
          </div>

          {/* Aperçu en temps réel */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <span>Aperçu en temps réel</span>
            </h3>
            
            <div className={`p-6 rounded-lg border-2 transition-all duration-300 ${
              currentTheme === 'dark' 
                ? 'bg-gray-900 text-white border-gray-700' 
                : 'bg-white text-gray-900 border-gray-200'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${currentAccentColorData?.preview}`}></div>
                  <span className="font-semibold">Exemple de titre</span>
                </div>
                <p className="text-sm opacity-80">
                  Ceci est un exemple de texte qui montre comment votre sélection de thème et de couleur 
                  affectera l'apparence de l'interface.
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-[var(--accent-color)] hover:opacity-80">
                    Bouton principal
                  </Button>
                  <Button size="sm" variant="outline">
                    Bouton secondaire
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between p-6">
            <Button variant="outline" onClick={() => setShowThemeModal(false)}>
              Fermer
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setCurrentTheme('auto')
                  setAccentColor('orange')
                  setFontSize(16)
                  setReducedMotion(false)
                  setHighContrast(false)
                  handleThemeChange('auto')
                  handleAccentColorChange('orange')
                  handleFontSizeChange([16])
                  handleReducedMotionChange(false)
                  handleHighContrastChange(false)
                }}
              >
                <Palette className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              
              <Button 
                onClick={() => setShowThemeModal(false)}
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


