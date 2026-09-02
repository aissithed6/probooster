"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Copy, CheckCircle, Globe, Lock, Zap } from "lucide-react"

interface ApiDocumentationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const apiEndpoints = [
  { category: "Authentification", path: "/api/auth/login", method: "POST", description: "Connexion utilisateur" },
  { category: "Authentification", path: "/api/auth/register", method: "POST", description: "Inscription utilisateur" },
  { category: "Produits", path: "/api/public/products", method: "GET", description: "Liste des produits" },
  { category: "Produits", path: "/api/public/products/popular", method: "GET", description: "Produits populaires" },
  { category: "Commandes", path: "/api/client/orders", method: "POST", description: "Creer une commande" },
  { category: "Commandes", path: "/api/client/orders", method: "GET", description: "Liste des commandes" }
]

const categories = ["Authentification", "Produits", "Commandes"]
const methodColors: Record<string, string> = { GET: "bg-green-100 text-green-700", POST: "bg-blue-100 text-blue-700" }

export function ApiDocumentationModal({ open, onOpenChange }: ApiDocumentationModalProps) {
  const [activeCategory, setActiveCategory] = useState("Authentification")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const filteredEndpoints = apiEndpoints.filter(e => e.category === activeCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-500 to-indigo-600">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Code className="h-7 w-7" />
            Documentation API
          </DialogTitle>
          <p className="text-purple-100 mt-1">Guide complet pour integrer l&apos;API Probooster</p>
        </DialogHeader>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r bg-gray-50 p-3">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} orientation="vertical" className="w-full">
              <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1">
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="w-full justify-start px-3 py-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {filteredEndpoints.map((endpoint, index) => (
                <div key={index} className="border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[endpoint.method]}`}>{endpoint.method}</span>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => copyToClipboard(endpoint.path, index)}>
                      {copiedIndex === index ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-gray-600">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
