"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function HeaderSearch() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Logique de recherche - peut être étendue selon les besoins
      console.log('Recherche:', searchQuery)
      
      // Ici vous pouvez ajouter la logique de recherche réelle
      // Par exemple, rediriger vers une page de résultats
      if (typeof window !== 'undefined') {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
      }
    }
  }

  return (
    <div className="flex-1 max-w-xl mx-6">
      <div className="relative">
        <Input
          type="search"
          placeholder="Rechercher des produits..."
          className="w-full pl-4 pr-12 py-3 rounded-full bg-white text-black border-0 focus:ring-2 focus:ring-[#ff6600] text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#ff6600] hover:bg-[#e55a00] rounded-full h-10 w-10"
          onClick={handleSearch}
        >
          <Search className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  )
}


