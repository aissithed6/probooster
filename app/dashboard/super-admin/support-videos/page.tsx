"use client"

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Edit, Trash2, Save, X, Play, Search, CheckCircle } from 'lucide-react'

interface SupportVideo {
  id: string
  title: string
  description: string
  youtube_url: string
  youtube_id: string
  category: string
  duration: string
  is_active: boolean
  position: number
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { id: 'general', name: 'Général' },
  { id: 'products', name: 'Produits' },
  { id: 'orders', name: 'Commandes' },
  { id: 'account', name: 'Compte' },
  { id: 'payments', name: 'Paiements' },
]

export default function SupportVideosAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [videos, setVideos] = useState<SupportVideo[]>([])
  const [filteredVideos, setFilteredVideos] = useState<SupportVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingVideo, setEditingVideo] = useState<SupportVideo | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    youtube_id: '',
    category: 'general',
    duration: '',
    is_active: true,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = userRow?.role

      if (role !== 'super_admin' && role !== 'admin') {
        toast({
          title: 'Accès refusé',
          description: 'Vous devez être administrateur pour accéder à cette page.',
          variant: 'destructive',
        })
        router.push('/')
        return
      }

      loadVideos()
    }

    checkAuth()
    }, [supabase, router, toast])

  const loadVideos = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/super-admin/support-videos')
      const json = await response.json()
      
      if (json.error) {
        toast({
          title: 'Erreur',
          description: json.error,
          variant: 'destructive',
        })
        return
      }

      setVideos(json.data.items || [])
      setFilteredVideos(json.data.items || [])
    } catch (error) {
      console.error('Erreur lors du chargement des vidéos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...videos]
    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.youtube_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(video => video.category === categoryFilter)
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(video => 
        statusFilter === 'active' ? video.is_active : !video.is_active
      )
    }
    setFilteredVideos(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [searchQuery, categoryFilter, statusFilter, videos])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/super-admin/support-videos', {
        method: editingVideo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(editingVideo ? { id: editingVideo.id } : {})
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Échec')

      toast({ title: 'Succès', description: editingVideo ? 'Vidéo mise à jour' : 'Vidéo ajoutée' })
      setShowDialog(false)
      setEditingVideo(null)
      setFormData({ title: '', description: '', youtube_url: '', youtube_id: '', category: 'general', duration: '', is_active: true })
      loadVideos()
    } catch (error) {
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Échec', variant: 'destructive' })
    }
  }

  const handleEdit = (video: SupportVideo) => {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      description: video.description,
      youtube_url: video.youtube_url,
      youtube_id: video.youtube_id,
      category: video.category,
      duration: video.duration,
      is_active: video.is_active,
    })
    setShowDialog(true)
  }

  const handleDelete = async (video: SupportVideo) => {
    if (!confirm(`Supprimer "${video.title}" ?`)) return
    try {
      const response = await fetch('/api/super-admin/support-videos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: video.id }) })
      if (!response.ok) throw new Error('Échec')
      toast({ title: 'Succès', description: 'Vidéo supprimée' })
      setVideos(videos.filter(v => v.id !== video.id))
    } catch {
      toast({ title: 'Erreur', description: 'Échec de la suppression', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (video: SupportVideo) => {
    try {
      await fetch('/api/super-admin/support-videos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: video.id, is_active: !video.is_active }) })
      setVideos(videos.map(v => v.id === video.id ? { ...v, is_active: !v.is_active } : v))
    } catch {}
  }

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^/\n]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : ''
  }

  const handleYoutubeUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, youtube_url: url, youtube_id: extractYoutubeId(url) }))
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              🎬 Vidéos Tutoriels
            </h1>
            <p className="text-gray-500 mt-1">
              Gérez les vidéos YouTube affichées dans le Centre de Ressources de la page Support.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingVideo(null)
              setFormData({ title: '', description: '', youtube_url: '', youtube_id: '', category: 'general', duration: '', is_active: true })
              setShowDialog(true)
            }}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter une vidéo
          </Button>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre ou ID YouTube..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
                <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="inactive">Inactives</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des vidéos */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500 text-lg">Aucune vidéo trouvée</p>
              <p className="text-gray-400 text-sm mt-1">
                {videos.length === 0
                  ? 'Ajoutez votre première vidéo tutoriel pour la rendre visible sur la page Support.'
                  : 'Aucune vidéo ne correspond à vos filtres.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <Card key={video.id} className={`overflow-hidden ${!video.is_active ? 'opacity-60' : ''}`}>
                <div className="relative aspect-video bg-black group">
                  {video.youtube_id ? (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3"
                        >
                          <Play className="w-6 h-6 fill-current" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Play className="w-10 h-10" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {CATEGORIES.find((c) => c.id === video.category)?.name || video.category}
                  </span>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </span>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{video.title}</h3>
                    <Switch
                      checked={video.is_active}
                      onCheckedChange={() => handleToggleActive(video)}
                    />
                  </div>
                  {video.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className={`text-xs flex items-center gap-1 ${video.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-3 h-3" />
                      {video.is_active ? 'Visible' : 'Masquée'}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(video)} title="Modifier">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(video)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog d'ajout/édition */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
              </DialogTitle>
              <DialogDescription>
                Collez l'URL YouTube de la vidéo. L'ID sera extrait automatiquement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube_url">URL YouTube *</Label>
                <Input
                  id="youtube_url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.youtube_url}
                  onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                />
                {formData.youtube_id && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    ID détecté : {formData.youtube_id}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  placeholder="Titre de la vidéo"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description de la vidéo"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée</Label>
                  <Input
                    id="duration"
                    placeholder="ex: 5:32"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>
              {formData.youtube_id && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${formData.youtube_id}`}
                    title="Aperçu"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Visible sur la page Support</p>
                  <p className="text-xs text-gray-500">Désactivée, la vidéo reste en brouillon.</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  <X className="w-4 h-4 mr-2" /> Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={!formData.title || !formData.youtube_id}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingVideo ? 'Enregistrer' : 'Ajouter la vidéo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

