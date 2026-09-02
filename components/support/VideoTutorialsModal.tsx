"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Video,
  Plus,
  Edit2,
  Trash2,
  Play,
  X,
  Save,
  Youtube,
  Search,
  Loader2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
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
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

const categories = ["Debutant", "Intermediaire", "Avance", "Vendeur", "Client"]

export function VideoTutorialsModal({ open, onOpenChange }: VideoTutorialsModalProps) {
  const { user } = useAuth()
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
    if (!user) return
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
        .order("order_index", { ascending: true })

      if (error) {
        setVideos([])
        setLoading(false)
        return
      }
      setVideos(data || [])
    } catch (error) {
      console.error("Erreur chargement videos:", error)
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

      toast({ title: "Video ajoutee avec succes!" })
      setShowAddForm(false)
      setFormData({ title: "", description: "", youtube_url: "", category: "Debutant", duration: "" })
      loadVideos()
    } catch (error) {
      console.error("Erreur ajout video:", error)
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

      toast({ title: "Video modifiee avec succes!" })
      setEditingVideo(null)
      setShowAddForm(false)
      setFormData({ title: "", description: "", youtube_url: "", category: "Debutant", duration: "" })
      loadVideos()
    } catch (error) {
      console.error("Erreur modification:", error)
      toast({ title: "Erreur lors de la modification", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette video ?")) return

    try {
      const { error } = await supabase.from("video_tutorials").delete().eq("id", videoId)
      if (error) throw error
      toast({ title: "Video supprimee avec succes!" })
      if (selectedVideo?.id === videoId) setSelectedVideo(null)
      loadVideos()
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast({ title: "Erreur lors de la suppression", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-red-500 to-pink-600">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Video className="h-7 w-7" />
            Videos Tutoriels
          </DialogTitle>
          <p className="text-red-100 mt-1">Apprenez avec nos videos YouTube</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <Youtube className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600">Aucune video disponible</p>
            <p className="text-sm text-gray-500">Les videos tutoriels seront bientot disponibles</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

