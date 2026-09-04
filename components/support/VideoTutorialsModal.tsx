"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Video, X, Youtube, Search, Loader2, Maximize2, Minimize2
} from "lucide-react"

interface VideoTutorial {
  id: string
  title: string
  description: string
  youtube_url: string
  youtube_id: string
  category: string
  duration: string
  position: number
  is_active: boolean
  created_at: string
}

interface VideoTutorialsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categories = [
  { id: "general", name: "Général" },
  { id: "products", name: "Produits" },
  { id: "orders", name: "Commandes" },
  { id: "account", name: "Compte" },
  { id: "payments", name: "Paiements" },
]

const CATEGORY_NAME: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]))

export function VideoTutorialsModal({ open, onOpenChange }: VideoTutorialsModalProps) {
  const [videos, setVideos] = useState<VideoTutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (open) {
      loadVideos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/support/videos")
      const json = await res.json()
      if (!res.ok || json.error) {
        setVideos([])
        return
      }
      setVideos(json.data?.items || [])
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (video: VideoTutorial) => {
    setExpanded(false)
    setSelectedVideo(video)
  }

  const handleClose = () => {
    setExpanded(false)
    setSelectedVideo(null)
    onOpenChange(false)
  }

  const backToList = () => {
    setExpanded(false)
    setSelectedVideo(null)
  }

  const filteredVideos = searchQuery
    ? videos.filter(
        (v) =>
          (v.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos

  const categoryFilteredVideos =
    selectedCategory === "all"
      ? filteredVideos
      : filteredVideos.filter((v) => v.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={(expanded ? "max-w-[92vw] " : "max-w-5xl ") + "max-h-[90vh] overflow-hidden flex flex-col p-0"}>
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
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                        <div className="relative w-64 h-36 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {video.youtube_id && (
                            <iframe
                              src={"https://www.youtube.com/embed/" + video.youtube_id}
                              width="256"
                              height="144"
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
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {CATEGORY_NAME[video.category] ?? video.category}
                            </span>
                            {video.duration && (
                              <span className="text-xs text-gray-500">{video.duration}</span>
                            )}
                          </div>
                        </div>
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedVideo.title}</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
                  {expanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                  {expanded ? "Réduire" : "Agrandir"}
                </Button>
                <Button variant="ghost" size="sm" onClick={backToList}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className={expanded ? "w-full aspect-video max-h-[72vh] bg-black rounded-lg mb-4 overflow-hidden" : "aspect-video bg-black rounded-lg mb-4 overflow-hidden"}>
              <iframe
                src={"https://www.youtube.com/embed/" + selectedVideo.youtube_id}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedVideo.title}
              />
            </div>
            <p className="text-gray-700 mb-4">{selectedVideo.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                {CATEGORY_NAME[selectedVideo.category] ?? selectedVideo.category}
              </span>
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