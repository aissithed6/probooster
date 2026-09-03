"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Video, Plus, Edit2, Trash2, X, Save, Youtube, Search, Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface VideoTutorial {
  id: string
  title: string
  description: string
  youtube_url: string
  youtube_id: string
  category: string
  duration: string
  order_index: number
  created_at: string
}

interface VideoTutorialsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const extractYoutubeId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/\n]+\/?\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  return url.match(regex)?.[1] ?? null
}

const categories = ["Debutant", "Intermediaire", "Avance", "Vendeur", "Client"]

export function VideoTutorialsModal({ open, onOpenChange }: VideoTutorialsModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [videos, setVideos] = useState<VideoTutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoTutorial | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtube_url: "",
    category: "Debutant",
    duration: ""
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadVideos()
      checkAdmin()
    }
  }, [open])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsAdmin(false)
      return
    }
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    setIsAdmin(data?.role === "super_admin" || data?.role === "admin")
  }

  const loadVideos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("video_tutorials")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true })
      if (error) {
        setVideos([])
        return
      }
      setVideos(data || [])
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddVideo = async () => {
    if (!formData.title || !formData.youtube_url) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" })
      return
    }
    const youtubeId = extractYoutubeId(formData.youtube_url)
    if (!youtubeId) {
      toast({ title: "URL YouTube invalide", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from("video_tutorials").insert({
        title: formData.title,
        description: formData.description,
        youtube_url: formData.youtube_url,
        youtube_id: youtubeId,
        category: formData.category,
        duration: formData.duration,
        order_index: videos.length
      })
      if (error) throw error
      toast({ title: "Vidéo ajoutée avec succès !" })
      setShowAddForm(false)
      setFormData({ title: "", description: "", youtube_url: "", category: "Debutant", duration: "" })
      loadVideos()
    } catch (error) {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEditVideo = async () => {
    if (!editingVideo || !formData.title || !formData.youtube_url) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" })
      return
    }
    const youtubeId = extractYoutubeId(formData.youtube_url)
    if (!youtubeId) {
      toast({ title: "URL YouTube invalide", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from("video_tutorials")
        .update({
          title: formData.title,
          description: formData.description,
          youtube_url: formData.youtube_url,
          youtube_id: youtubeId,
          category: formData.category,
          duration: formData.duration
        })
        .eq("id", editingVideo.id)
      if (error) throw error
      toast({ title: "Vidéo modifiée avec succès !" })
      setEditingVideo(null)
      setShowAddForm(false)
      setFormData({ title: "", description: "", youtube_url: "", category: "Debutant", duration: "" })
      loadVideos()
    } catch (error) {
      toast({ title: "Erreur lors de la modification", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVideo = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Voulez-vous vraiment supprimer cette vidéo ?")) return
    try {
      const { error } = await supabase.from("video_tutorials").delete().eq("id", videoId)
      if (error) throw error
      toast({ title: "Vidéo supprimée avec succès !" })
      if (selectedVideo?.id === videoId) setSelectedVideo(null)
      loadVideos()
    } catch (error) {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" })
    }
  }

  const handleVideoClick = (video: VideoTutorial) => {
    setSelectedVideo(video)
  }

  const handleClose = () => {
    setSelectedVideo(null)
    onOpenChange(false)
  }

  const handleAddNew = () => {
    setEditingVideo(null)
    setFormData({ title: "", description: "", youtube_url: "", category: "Debutant", duration: "" })
    setShowAddForm(true)
  }

  const filteredVideos = searchQuery
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos

  const categoryFilteredVideos =
    selectedCategory === "all"
      ? filteredVideos
            : filteredVideos.filter((v) => v.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-red-500 to-pink-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Video className="h-7 w-7" />
            Vidéos Tutoriels
          </h2>
          <p className="text-red-100 mt-1">Apprenez avec nos vidéos YouTube</p>
        </div>

        {!selectedVideo ? (
          <>
            <div className="px-6 py-4 border-t flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une vidéo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button onClick={handleAddNew} className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : categoryFilteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Youtube className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-600">Aucune vidéo disponible</p>
                  <p className="text-sm text-gray-500">
                    {searchQuery || selectedCategory !== "all"
                      ? "Aucun résultat pour cette recherche"
                      : "Les vidéos tutoriels seront bientôt disponibles"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {categoryFilteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className="cursor-pointer p-4 hover:bg-gray-50 transition-colors group"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="flex gap-4">
                        <div className="relative w-48 h-28 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {video.youtube_id && (
                            <iframe
                              src={"https://www.youtube.com/embed/" + video.youtube_id}
                              width="192"
                              height="112"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={video.title}
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg group-hover:text-red-600 transition-colors line-clamp-1">
                            {video.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {video.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{video.category}</span>
                            {video.duration && (
                              <span className="text-xs text-gray-500">{video.duration}</span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-start gap-1">
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation()
                              setEditingVideo(video)
                              setFormData({ title: video.title, description: video.description, youtube_url: video.youtube_url, category: video.category, duration: video.duration })
                              setShowAddForm(true)
                            }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => handleDeleteVideo(video.id, e)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                                </div>
              )}
            </div>

            {showAddForm && isAdmin && (
              <div className="border-t p-6 bg-gray-50">
                <div className="max-w-2xl mx-auto">
                  <h3 className="font-semibold text-lg mb-4">
                    {editingVideo ? "Modifier la vidéo" : "Ajouter une vidéo"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Titre *</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Titre de la vidéo"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description de la vidéo"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">URL YouTube *</label>
                      <Input
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Catégorie</label>
                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Durée</label>
                        <Input
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          placeholder="ex: 5:30"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>Annuler</Button>
                      <Button
                        onClick={editingVideo ? handleEditVideo : handleAddVideo}
                        disabled={saving}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingVideo ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {editingVideo ? "Mettre à jour" : "Ajouter"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedVideo.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={"https://www.youtube.com/embed/" + selectedVideo.youtube_id}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedVideo.title}
              />
            </div>
            <p className="text-gray-700 mb-4">{selectedVideo.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{selectedVideo.category}</span>
              {selectedVideo.duration && (
                <span className="text-sm text-gray-500">Durée: {selectedVideo.duration}</span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}