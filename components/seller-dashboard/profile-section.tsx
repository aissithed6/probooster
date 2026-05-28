"use client"

import { useEffect, useState } from 'react'
import {
  User, Settings, Shield, Bell, Eye, EyeOff, Camera, Edit,
  Save, X, CheckCircle, AlertTriangle, Key, Smartphone, Mail,
  MapPin, Calendar, Star, Award, Crown, Download, Upload,
  Trash2, LogOut, Lock, Unlock, Volume2, VolumeX, Moon, Sun,
  Globe, CreditCard, Wallet, FileText, Image, Video, Music,
  BarChart3
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'

// Interface SellerProfile est définie dans le fichier principal
interface SellerProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  bio: string
  company: string
  website: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  socialMedia: {
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
  }
  verification: {
    isVerified: boolean
    verificationDate?: string
    documents: Array<{
      id: string
      type: string
      name: string
      status: 'pending' | 'approved' | 'rejected'
      uploadedAt: string
    }>
  }
  preferences: {
    theme: 'auto' | 'light' | 'dark'
    language: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  statistics: {
    totalSales: number
    totalOrders: number
    averageRating: number
    totalReviews: number
    responseRate: number
  }
}

interface ProfileSectionProps {
  profile: SellerProfile
  onProfileUpdate: (updates: Partial<SellerProfile>) => void
  onPasswordChange: (currentPassword: string, newPassword: string) => void
  onTwoFactorToggle: (enabled: boolean) => void
  onSessionTerminate: (sessionId: string) => void
  onDocumentUpload: (file: File, type: string) => void
  onAccountDelete: (reason: string) => void
  onLogout: () => void
  initialTab?: string
  hideNavigation?: boolean
}

export default function ProfileSection({
  profile,
  onProfileUpdate,
  onPasswordChange,
  onTwoFactorToggle,
  onSessionTerminate,
  onDocumentUpload,
  onAccountDelete,
  onLogout,
  initialTab,
  hideNavigation
}: ProfileSectionProps) {
  const { systemPrefs, setLanguage, setTheme, setCurrency, setTimezone } = useUserPreferences()
  const [activeTab, setActiveTab] = useState(initialTab ?? 'profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    if (!initialTab) return
    setActiveTab(initialTab)
  }, [initialTab])
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false)
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    bio: profile.bio,
    company: profile.company,
    website: profile.website,
    address: { ...profile.address },
    socialMedia: { ...profile.socialMedia }
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    type: ''
  })

  const [documentUploadData, setDocumentUploadData] = useState({
    file: null as File | null,
    type: '',
    name: '',
    description: '',
    preview: null as string | null
  })

  const [uploadedDocuments, setUploadedDocuments] = useState([
    {
      id: '1',
      type: 'Pièce d\'identité',
      name: 'CNI_Jean_Dupont.pdf',
      status: 'pending' as 'pending' | 'approved' | 'rejected',
      uploadedAt: new Date().toISOString(),
      fileSize: '2.5 MB',
      preview: null as string | null
    },
    {
      id: '2',
      type: 'Justificatif d\'adresse',
      name: 'EDF_Janvier_2024.pdf',
      status: 'approved' as 'pending' | 'approved' | 'rejected',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      fileSize: '1.8 MB',
      preview: null as string | null
    }
  ])

  const [socialMediaData, setSocialMediaData] = useState({
    facebook: profile.socialMedia.facebook,
    twitter: profile.socialMedia.twitter,
    instagram: profile.socialMedia.instagram,
    linkedin: profile.socialMedia.linkedin
  })

  const [preferencesData, setPreferencesData] = useState({
    language: systemPrefs.language,
    currency: systemPrefs.currency,
    timezone: systemPrefs.timezone,
    theme: systemPrefs.theme,
    notifications: { ...profile.preferences.notifications }
  })

  useEffect(() => {
    setPreferencesData((prev) => ({
      ...prev,
      language: systemPrefs.language,
      currency: systemPrefs.currency,
      timezone: systemPrefs.timezone,
      theme: systemPrefs.theme
    }))
  }, [systemPrefs.currency, systemPrefs.language, systemPrefs.theme, systemPrefs.timezone])

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions] = useState([
    {
      id: '1',
      device: 'Chrome sur Windows',
      location: 'Paris, France',
      lastActivity: new Date().toISOString(),
      isCurrent: true
    },
    {
      id: '2',
      device: 'Safari sur iPhone',
      location: 'Lyon, France',
      lastActivity: new Date(Date.now() - 3600000).toISOString(),
      isCurrent: false
    }
  ])

  const handleSave = () => {
    onProfileUpdate(formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      company: profile.company,
      website: profile.website,
      address: { ...profile.address },
      socialMedia: { ...profile.socialMedia }
    })
    setIsEditing(false)
  }

  const handlePasswordChange = () => {
    if (passwordData.newPassword === passwordData.confirmPassword) {
      onPasswordChange(passwordData.currentPassword, passwordData.newPassword)
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
  }

  const handleDocumentUpload = () => {
    if (uploadData.file && uploadData.type) {
      onDocumentUpload(uploadData.file, uploadData.type)
      setShowUploadModal(false)
      setUploadData({ file: null, type: '' })
    }
  }

  const handleDocumentFileUpload = () => {
    if (documentUploadData.file && documentUploadData.type && documentUploadData.name) {
      // Simuler l'upload et l'ajout du document
      const newDocument = {
        id: Date.now().toString(),
        type: documentUploadData.type,
        name: documentUploadData.name,
        status: 'pending' as 'pending' | 'approved' | 'rejected',
        uploadedAt: new Date().toISOString(),
        fileSize: `${(documentUploadData.file.size / (1024 * 1024)).toFixed(1)} MB`,
        preview: null as string | null
      }
      
      setUploadedDocuments([...uploadedDocuments, newDocument])
      setShowDocumentUploadModal(false)
                      setDocumentUploadData({ file: null, type: '', name: '', description: '', preview: null })
      
      // Appeler la fonction de callback
      onDocumentUpload(documentUploadData.file, documentUploadData.type)
    }
  }

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocumentUploadData({ ...documentUploadData, file, name: file.name })
      
      // Créer un aperçu pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setDocumentUploadData(prev => ({ ...prev, preview: e.target?.result as string }))
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const validateDocumentType = (file: File, expectedType: string): boolean => {
    // Validation basique selon le type de document
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    switch (expectedType) {
      case 'identity':
        // Pièce d'identité : PDF, JPG, PNG
        return ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension || '')
      case 'address':
        // Justificatif d'adresse : PDF, JPG, PNG
        return ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension || '')
      case 'business':
        // Document d'entreprise : PDF, DOC, DOCX
        return ['pdf', 'doc', 'docx'].includes(fileExtension || '')
      default:
        return false
    }
  }

  const getDocumentTypeLabel = (type: string): string => {
    switch (type) {
      case 'identity': return 'Pièce d\'identité'
      case 'address': return 'Justificatif d\'adresse'
      case 'business': return 'Document d\'entreprise'
      default: return type
    }
  }

  const handleSocialMediaSave = () => {
    onProfileUpdate({ socialMedia: socialMediaData })
    setShowSocialMediaModal(false)
  }

  const handleSocialMediaCancel = () => {
    setSocialMediaData({
      facebook: profile.socialMedia.facebook,
      twitter: profile.socialMedia.twitter,
      instagram: profile.socialMedia.instagram,
      linkedin: profile.socialMedia.linkedin
    })
    setShowSocialMediaModal(false)
  }

  const handleVerificationRequest = () => {
    // Simuler une demande de vérification
    console.log('Demande de vérification envoyée')
    setShowVerificationModal(false)
  }

  const handleTwoFactorToggle = (enabled: boolean) => {
    setTwoFactorEnabled(enabled)
    onTwoFactorToggle(enabled)
    console.log('2FA:', enabled ? 'activé' : 'désactivé')
  }

  const handleLanguageChange = (language: string) => {
    setPreferencesData({ ...preferencesData, language })
    setLanguage(language as any)
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setPreferencesData({ ...preferencesData, theme })
    setTheme(theme)
  }

  const handleCurrencyChange = (currency: 'xof' | 'eur' | 'usd' | 'gbp') => {
    setPreferencesData({ ...preferencesData, currency })
    setCurrency(currency)
  }

  const handleTimezoneChange = (timezone: 'africa_cotonou' | 'europe_paris' | 'america_new_york' | 'asia_tokyo') => {
    setPreferencesData({ ...preferencesData, timezone })
    setTimezone(timezone)
  }

  const handleNotificationToggle = (type: 'email' | 'sms' | 'push', enabled: boolean) => {
    const newNotifications = { ...preferencesData.notifications, [type]: enabled }
    setPreferencesData({ ...preferencesData, notifications: newNotifications })
    onProfileUpdate({ preferences: { ...profile.preferences, notifications: newNotifications } })
  }

  const handleSessionTerminate = (sessionId: string) => {
    onSessionTerminate(sessionId)
    console.log('Session terminée:', sessionId)
  }

  const handlePreferencesSave = () => {
    onProfileUpdate({ preferences: preferencesData })
    setShowPreferencesModal(false)
  }

  const handlePreferencesCancel = () => {
    setPreferencesData({
      language: profile.preferences.language,
      theme: profile.preferences.theme,
      notifications: { ...profile.preferences.notifications }
    })
    setShowPreferencesModal(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20'
      case 'pending': return 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec avatar et infos principales */}
             <Card className="bg-gradient-to-br from-[#ff6600]/10 to-[#ff6600]/20 border-[#ff6600]/30">
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={profile.avatar} />
                                 <AvatarFallback className="text-2xl bg-[#ff6600]/10 text-[#ff6600]">
                   {profile.name.charAt(0)}
                 </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                                 className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-white border-[#ff6600] hover:bg-[#ff6600]/10"
                onClick={() => setShowUploadModal(true)}
              >
                                 <Camera className="w-4 h-4 text-[#ff6600]" />
              </Button>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                                 {profile.verification.isVerified && (
                   <Badge className="bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20">
                     <CheckCircle className="w-3 h-3 mr-1" />
                     Vérifié
                   </Badge>
                 )}
                                 <Badge className="bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20">
                   Vendeur Pro
                 </Badge>
              </div>
              
              <p className="text-gray-600 mb-4">{profile.bio || 'Aucune bio renseignée'}</p>
              
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="text-center">
                   <p className="text-2xl font-bold text-[#ff6600]">{profile.statistics.totalSales}</p>
                   <p className="text-sm text-gray-600">Ventes totales</p>
                 </div>
                 <div className="text-center">
                   <p className="text-2xl font-bold text-[#ff6600]">{profile.statistics.averageRating}★</p>
                   <p className="text-sm text-gray-600">Note moyenne</p>
                 </div>
                 <div className="text-center">
                   <p className="text-2xl font-bold text-[#ff6600]">{profile.statistics.responseRate}%</p>
                   <p className="text-sm text-gray-600">Taux de réponse</p>
                 </div>
               </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Annuler' : 'Modifier'}
              </Button>
              {isEditing && (
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {!hideNavigation && (
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2" />
              Profil
            </TabsTrigger>
                       <TabsTrigger 
               value="social"
               className="data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm"
             >
              <Globe className="w-4 h-4 mr-2" />
              Réseaux
            </TabsTrigger>
                       <TabsTrigger 
               value="security"
               className="data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm"
             >
              <Shield className="w-4 h-4 mr-2" />
              Sécurité
            </TabsTrigger>
                       <TabsTrigger 
               value="preferences"
               className="data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm"
             >
              <Settings className="w-4 h-4 mr-2" />
              Préférences
            </TabsTrigger>
                       <TabsTrigger 
               value="documents"
               className="data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm"
             >
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
                       <TabsTrigger 
               value="analytics"
               className="data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm"
             >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiques
            </TabsTrigger>
          </TabsList>
        )}

        {/* Onglet Profil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
              <CardDescription>Gérez vos informations de base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adresse</CardTitle>
              <CardDescription>Votre adresse de facturation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Rue</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Région</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Réseaux Sociaux */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
                             <CardTitle className="flex items-center">
                 <Globe className="w-5 h-5 mr-2 text-[#ff6600]" />
                 Réseaux Sociaux
               </CardTitle>
              <CardDescription>Gérez vos liens vers les réseaux sociaux</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="facebook"
                      value={socialMediaData.facebook}
                      onChange={(e) => setSocialMediaData({ ...socialMediaData, facebook: e.target.value })}
                      placeholder="Nom d'utilisateur Facebook"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://facebook.com/${socialMediaData.facebook}`, '_blank')}
                      disabled={!socialMediaData.facebook}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="twitter"
                      value={socialMediaData.twitter}
                      onChange={(e) => setSocialMediaData({ ...socialMediaData, twitter: e.target.value })}
                      placeholder="Nom d'utilisateur Twitter"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://twitter.com/${socialMediaData.twitter}`, '_blank')}
                      disabled={!socialMediaData.twitter}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="instagram"
                      value={socialMediaData.instagram}
                      onChange={(e) => setSocialMediaData({ ...socialMediaData, instagram: e.target.value })}
                      placeholder="Nom d'utilisateur Instagram"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://instagram.com/${socialMediaData.instagram}`, '_blank')}
                      disabled={!socialMediaData.instagram}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="linkedin"
                      value={socialMediaData.linkedin}
                      onChange={(e) => setSocialMediaData({ ...socialMediaData, linkedin: e.target.value })}
                      placeholder="Nom d'utilisateur LinkedIn"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://linkedin.com/in/${socialMediaData.linkedin}`, '_blank')}
                      disabled={!socialMediaData.linkedin}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleSocialMediaCancel}>
                  Annuler
                </Button>
                                 <Button onClick={handleSocialMediaSave} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
                   <Save className="w-4 h-4 mr-2" />
                   Sauvegarder
                 </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
                             <CardTitle className="flex items-center">
                 <Shield className="w-5 h-5 mr-2 text-[#ff6600]" />
                 Sécurité du Compte
               </CardTitle>
              <CardDescription>Protégez votre compte avec des mesures de sécurité avancées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                                 <div className="flex items-center space-x-3">
                   <Key className="w-5 h-5 text-[#ff6600]" />
                   <div>
                    <p className="font-medium">Mot de passe</p>
                    <p className="text-sm text-gray-500">Dernière modification: {formatDate(profile.verification.verificationDate || new Date().toISOString())}</p>
                  </div>
                </div>
                <Button onClick={() => setShowPasswordModal(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                                 <div className="flex items-center space-x-3">
                   <Shield className="w-5 h-5 text-[#ff6600]" />
                   <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-gray-500">Protection renforcée de votre compte</p>
                  </div>
                </div>
                <Switch 
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                                 <div className="flex items-center space-x-3">
                   <CheckCircle className="w-5 h-5 text-[#ff6600]" />
                   <div>
                    <p className="font-medium">Vérification du compte</p>
                    <p className="text-sm text-gray-500">
                      {profile.verification.isVerified ? 'Compte vérifié' : 'Compte en attente de vérification'}
                    </p>
                  </div>
                </div>
                {!profile.verification.isVerified && (
                  <Button onClick={() => setShowVerificationModal(true)} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Demander
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                                 <div className="flex items-center space-x-3">
                   <AlertTriangle className="w-5 h-5 text-[#ff6600]" />
                   <div>
                    <p className="font-medium">Sessions actives</p>
                    <p className="text-sm text-gray-500">Gérez vos connexions actives</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowSessionsModal(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Préférences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
                             <CardTitle className="flex items-center">
                 <Settings className="w-5 h-5 mr-2 text-[#ff6600]" />
                 Paramètres Généraux
               </CardTitle>
              <CardDescription>Personnalisez votre expérience sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="language">Langue</Label>
                  <Select value={preferencesData.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="theme">Thème</Label>
                  <Select value={preferencesData.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un thème" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="auto">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={preferencesData.currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xof">XOF</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select value={preferencesData.timezone} onValueChange={handleTimezoneChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="africa_cotonou">Afrique/Cotonou</SelectItem>
                      <SelectItem value="europe_paris">Europe/Paris</SelectItem>
                      <SelectItem value="america_new_york">America/New_York</SelectItem>
                      <SelectItem value="asia_tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                                     <CardTitle className="flex items-center">
                     <Bell className="w-5 h-5 mr-2 text-[#ff6600]" />
                     Notifications
                   </CardTitle>
                  <CardDescription>Gérez vos préférences de notifications</CardDescription>
                </div>
                                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setShowPreferencesModal(true)}
                   className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                 >
                  <Settings className="w-4 h-4 mr-2" />
                  Gérer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Notifications par email</p>
                  <p className="text-sm text-gray-500">Recevoir les notifications par email</p>
                </div>
                <Switch 
                  checked={preferencesData.notifications.email}
                  onCheckedChange={(enabled) => handleNotificationToggle('email', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Notifications push</p>
                  <p className="text-sm text-gray-500">Recevoir les notifications push</p>
                </div>
                <Switch 
                  checked={preferencesData.notifications.push}
                  onCheckedChange={(enabled) => handleNotificationToggle('push', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Notifications SMS</p>
                  <p className="text-sm text-gray-500">Recevoir les notifications par SMS</p>
                </div>
                <Switch 
                  checked={preferencesData.notifications.sms}
                  onCheckedChange={(enabled) => handleNotificationToggle('sms', enabled)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Documents */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
                             <CardTitle className="flex items-center">
                 <FileText className="w-5 h-5 mr-2 text-[#ff6600]" />
                 Documents de Vérification
               </CardTitle>
              <CardDescription>Gérez vos documents de vérification et statut du compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                             <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#ff6600]/10 to-[#ff6600]/20 rounded-lg border border-[#ff6600]/30">
                 <div className="flex items-center space-x-3">
                   <CheckCircle className="w-6 h-6 text-[#ff6600]" />
                   <div>
                     <p className="font-medium text-[#ff6600]">Statut de vérification</p>
                     <p className="text-sm text-[#ff6600]/80">
                       {profile.verification.isVerified ? 'Compte vérifié avec succès' : 'En attente de vérification'}
                     </p>
                   </div>
                 </div>
                 <Badge className={profile.verification.isVerified ? 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20' : 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20'}>
                   {profile.verification.isVerified ? 'Vérifié' : 'En attente'}
                 </Badge>
               </div>

              <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                   <h4 className="font-medium text-gray-900">Documents soumis</h4>
                   <Button onClick={() => setShowDocumentUploadModal(true)} size="sm">
                     <Upload className="w-4 h-4 mr-2" />
                     Ajouter
                   </Button>
                 </div>
                
                                 {uploadedDocuments.map((doc) => (
                   <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                     <div className="flex items-center space-x-3">
                       <FileText className="w-5 h-5 text-gray-400" />
                       <div>
                         <p className="font-medium">{doc.name}</p>
                         <p className="text-sm text-gray-500">{getDocumentTypeLabel(doc.type)} • {formatDate(doc.uploadedAt)} • {doc.fileSize}</p>
                       </div>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Badge className={getStatusColor(doc.status)}>
                         {doc.status === 'approved' ? 'Approuvé' :
                          doc.status === 'pending' ? 'En attente' : 'Rejeté'}
                       </Badge>
                       <Button 
                         variant="ghost" 
                         size="sm"
                         onClick={() => {
                           if (doc.preview) {
                             window.open(doc.preview, '_blank')
                           } else {
                             // Pour les PDFs et autres fichiers, on pourrait ouvrir un modal de prévisualisation
                             console.log('Ouvrir le document:', doc.name)
                           }
                         }}
                       >
                         <Eye className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
                             <CardTitle className="flex items-center">
                 <BarChart3 className="w-5 h-5 mr-2 text-[#ff6600]" />
                 Statistiques de Performance
               </CardTitle>
              <CardDescription>Suivez vos performances et votre progression</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="text-center p-4 bg-gradient-to-br from-[#ff6600]/10 to-[#ff6600]/20 rounded-lg border border-[#ff6600]/30">
                   <div className="text-2xl font-bold text-[#ff6600]">{profile.statistics.totalSales.toLocaleString()}</div>
                   <p className="text-sm text-[#ff6600]/80">Ventes totales</p>
                   <Progress value={75} className="mt-2" />
                 </div>
                 <div className="text-center p-4 bg-gradient-to-br from-[#ff6600]/10 to-[#ff6600]/20 rounded-lg border border-[#ff6600]/30">
                   <div className="text-2xl font-bold text-[#ff6600]">{profile.statistics.averageRating}★</div>
                   <p className="text-sm text-[#ff6600]/80">Note moyenne</p>
                   <Progress value={profile.statistics.averageRating * 20} className="mt-2" />
                 </div>
                 <div className="text-center p-4 bg-gradient-to-br from-[#ff6600]/10 to-[#ff6600]/20 rounded-lg border border-[#ff6600]/30">
                   <div className="text-2xl font-bold text-[#ff6600]">{profile.statistics.responseRate}%</div>
                   <p className="text-sm text-[#ff6600]/80">Taux de réponse</p>
                   <Progress value={profile.statistics.responseRate} className="mt-2" />
                 </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Commandes</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total des commandes</span>
                      <span className="font-medium">{profile.statistics.totalOrders}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avis reçus</span>
                      <span className="font-medium">{profile.statistics.totalReviews}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Progression</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Objectif mensuel</span>
                      <span className="font-medium">80%</span>
                    </div>
                    <Progress value={80} className="mt-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de changement de mot de passe */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe actuel et votre nouveau mot de passe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Annuler
            </Button>
            <Button onClick={handlePasswordChange}>
              Changer le mot de passe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'upload de document */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer l'avatar</DialogTitle>
            <DialogDescription>
              Sélectionnez une nouvelle image pour votre avatar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="avatar-file">Fichier image</Label>
              <Input
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleDocumentUpload}>
              Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des sessions actives */}
      <Dialog open={showSessionsModal} onOpenChange={setShowSessionsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
                         <DialogTitle className="flex items-center">
               <AlertTriangle className="w-5 h-5 mr-2 text-[#ff6600]" />
               Sessions Actives
             </DialogTitle>
            <DialogDescription>
              Gérez vos connexions actives et sécurisez votre compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                                     <div className="w-3 h-3 rounded-full bg-[#ff6600]"></div>
                  <div>
                    <p className="font-medium">{session.device}</p>
                    <p className="text-sm text-gray-500">{session.location} • {formatDate(session.lastActivity)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                                     {session.isCurrent && (
                     <Badge className="bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20">
                       Actuelle
                     </Badge>
                   )}
                  {!session.isCurrent && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSessionTerminate(session.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Terminer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowSessionsModal(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de vérification */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent>
          <DialogHeader>
                         <DialogTitle className="flex items-center">
               <CheckCircle className="w-5 h-5 mr-2 text-[#ff6600]" />
               Demande de Vérification
             </DialogTitle>
            <DialogDescription>
              Soumettez vos documents pour vérifier votre compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Documents requis :</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Pièce d'identité (CNI, passeport)</li>
                    <li>• Justificatif d'adresse</li>
                    <li>• Extrait Kbis ou attestation d'activité</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="verification-type">Type de document</Label>
              <Select value={uploadData.type} onValueChange={(value) => setUploadData({ ...uploadData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identity">Pièce d'identité</SelectItem>
                  <SelectItem value="address">Justificatif d'adresse</SelectItem>
                  <SelectItem value="business">Document d'entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="verification-file">Fichier</Label>
              <Input
                id="verification-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowVerificationModal(false)}>
              Annuler
            </Button>
                         <Button onClick={handleVerificationRequest} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
               <Upload className="w-4 h-4 mr-2" />
               Soumettre
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des préférences */}
      <Dialog open={showPreferencesModal} onOpenChange={setShowPreferencesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
                         <DialogTitle className="flex items-center">
               <Settings className="w-5 h-5 mr-2 text-[#ff6600]" />
               Gérer les Préférences
             </DialogTitle>
            <DialogDescription>
              Personnalisez vos paramètres et préférences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-language">Langue</Label>
                <Select value={preferencesData.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modal-theme">Thème</Label>
                <Select value={preferencesData.theme} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="auto">Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-gray-500">Recevoir les notifications par email</p>
                  </div>
                  <Switch 
                    checked={preferencesData.notifications.email}
                    onCheckedChange={(enabled) => handleNotificationToggle('email', enabled)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notifications push</p>
                    <p className="text-sm text-gray-500">Recevoir les notifications push</p>
                  </div>
                  <Switch 
                    checked={preferencesData.notifications.push}
                    onCheckedChange={(enabled) => handleNotificationToggle('push', enabled)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notifications SMS</p>
                    <p className="text-sm text-gray-500">Recevoir les notifications par SMS</p>
                  </div>
                  <Switch 
                    checked={preferencesData.notifications.sms}
                    onCheckedChange={(enabled) => handleNotificationToggle('sms', enabled)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handlePreferencesCancel}>
              Annuler
            </Button>
                         <Button onClick={handlePreferencesSave} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
               <Save className="w-4 h-4 mr-2" />
               Sauvegarder
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'upload de documents */}
      <Dialog open={showDocumentUploadModal} onOpenChange={setShowDocumentUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
                         <DialogTitle className="flex items-center">
               <Upload className="w-5 h-5 mr-2 text-[#ff6600]" />
               Télécharger vos documents
             </DialogTitle>
            <DialogDescription>
              Ajoutez de nouveaux documents de vérification à votre profil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="document-type">Type de document</Label>
              <Select 
                value={documentUploadData.type} 
                onValueChange={(value) => setDocumentUploadData({ ...documentUploadData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identity">Pièce d'identité (CNI, passeport)</SelectItem>
                  <SelectItem value="address">Justificatif d'adresse (EDF, téléphone, etc.)</SelectItem>
                  <SelectItem value="business">Document d'entreprise (Kbis, attestation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document-file">Fichier</Label>
              <Input
                id="document-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleDocumentFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500 mt-1">
                Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max 10 MB)
              </p>
            </div>

            {documentUploadData.file && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                                     <FileText className="w-8 h-8 text-[#ff6600]" />
                  <div className="flex-1">
                    <p className="font-medium">{documentUploadData.file.name}</p>
                    <p className="text-sm text-gray-500">
                      Taille : {(documentUploadData.file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <p className="text-sm text-gray-500">
                      Type : {documentUploadData.file.type || 'Type inconnu'}
                    </p>
                  </div>
                </div>

                {/* Aperçu pour les images */}
                {documentUploadData.preview && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Aperçu :</p>
                    <div className="max-w-xs">
                      <img 
                        src={documentUploadData.preview} 
                        alt="Aperçu du document" 
                        className="w-full h-auto rounded border"
                      />
                    </div>
                  </div>
                )}

                {/* Validation du type de document */}
                {documentUploadData.type && (
                  <div className="mt-3">
                                         {validateDocumentType(documentUploadData.file, documentUploadData.type) ? (
                       <div className="flex items-center space-x-2 text-[#ff6600]">
                         <CheckCircle className="w-4 h-4" />
                         <span className="text-sm">Type de document valide</span>
                       </div>
                     ) : (
                       <div className="flex items-center space-x-2 text-red-600">
                         <AlertTriangle className="w-4 h-4" />
                         <span className="text-sm">Type de fichier non compatible avec ce type de document</span>
                       </div>
                     )}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="document-description">Description (optionnel)</Label>
              <Textarea
                id="document-description"
                value={documentUploadData.description}
                onChange={(e) => setDocumentUploadData({ ...documentUploadData, description: e.target.value })}
                placeholder="Ajoutez une description ou des notes sur ce document..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDocumentUploadModal(false)
                setDocumentUploadData({ file: null, type: '', name: '', description: '', preview: null })
              }}
            >
              Annuler
            </Button>
                         <Button 
               onClick={handleDocumentFileUpload}
               disabled={!documentUploadData.file || !documentUploadData.type || !validateDocumentType(documentUploadData.file, documentUploadData.type)}
               className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
             >
              <Upload className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
