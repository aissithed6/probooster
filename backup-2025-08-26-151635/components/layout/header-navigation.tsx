"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Lock, Grid, Flame, Sparkles, Store, Headphones } from "lucide-react"

export default function HeaderNavigation() {
  const pathname = usePathname()

  return (
    <nav className="border-t border-gray-600 bg-gray-700">
      <div className="flex items-center justify-center space-x-12 py-4">
        <Link href="/" className={`flex flex-col items-center space-y-1 transition-colors group ${
          pathname === "/" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
        }`}>
          <Home className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
            pathname === "/" ? "text-[#ff6600]" : ""
          }`} style={{ animationDuration: '3s' }} />
          <span className="text-xs font-medium">Accueil</span>
        </Link>

        <Link href="/products" className={`flex flex-col items-center space-y-1 transition-colors group ${
          pathname === "/products" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
        }`}>
          <div className="relative">
            <Lock className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
              pathname === "/products" ? "text-[#ff6600]" : ""
            }`} style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-xs font-medium">Boutique</span>
        </Link>

        <Link href="/categories" className={`flex flex-col items-center space-y-1 transition-colors group ${
          pathname === "/categories" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
        }`}>
          <Grid className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
            pathname === "/categories" ? "text-[#ff6600]" : ""
          }`} style={{ animationDuration: '4s' }} />
          <span className="text-xs font-medium">Catégories</span>
        </Link>

        <Link href="/best-sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
          pathname === "/best-sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
        }`}>
          <Flame className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
            pathname === "/best-sellers" ? "text-[#ff6600]" : ""
          }`} style={{ animationDuration: '2.5s' }} />
          <span className="text-xs font-medium">Meilleures ventes</span>
        </Link>

        <Link href="/new-arrivals" className={`flex flex-col items-center space-y-1 transition-colors group ${
          pathname === "/new-arrivals" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
        }`}>
          <Sparkles className={`h-6 w-6 group-hover:animate-bounce transition-transform duration-200 ${
            pathname === "/new-arrivals" ? "text-[#ff6600]" : ""
          }`} style={{ animationDuration: '3s' }} />
          <span className="text-xs font-medium group-hover:translate-y-1 transition-transform duration-300">Nouveautés</span>
        </Link>

        <Link href="/sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
          pathname === "/sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
        }`}>
          <div className={`rounded-lg p-2 ${
            pathname === "/sellers" ? "bg-[#ff6600]/20" : "bg-gray-600"
          }`}>
            <Store className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 animate-bounce ${
              pathname === "/sellers" ? "text-[#ff6600]" : "text-[#ff6600]"
            }`} style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-xs font-medium">Vendeurs</span>
        </Link>

        <Link href="/support" className={`flex flex-col items-center space-y-1 transition-colors group ${
          pathname === "/support" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
        }`}>
          <Headphones className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
            pathname === "/support" ? "text-[#ff6600]" : ""
          }`} style={{ animationDuration: '3s' }} />
          <span className="text-xs font-medium">Support</span>
        </Link>
      </div>
    </nav>
  )
}


