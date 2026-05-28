"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, Home } from "lucide-react"

export default function HeaderSimple() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#ff6600] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Probooster</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-[#ff6600] transition-colors">
              Accueil
            </Link>
            <Link href="/seller-dashboard" className="text-gray-600 hover:text-[#ff6600] transition-colors">
              Tableau de Bord
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-[#ff6600] transition-colors">
              Produits
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/auth/login">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <Button className="bg-[#ff6600] hover:bg-[#e55a00] text-white" asChild>
              <Link href="/seller-dashboard">
                Tableau de Bord Vendeur
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
