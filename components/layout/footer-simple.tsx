"use client"

import Link from "next/link"
import { Heart } from "lucide-react"

export default function FooterSimple() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-[#ff6600] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold">Probooster</span>
          </div>
          <p className="text-gray-400 mb-4">
            La marketplace du futur - Propulsée par l'innovation
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">
              À propos
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Conditions
            </Link>
          </div>
          <div className="mt-4 text-gray-500 text-xs">
            © 2024 Probooster. Fait avec <Heart className="inline h-3 w-3 text-red-500" /> en Afrique
          </div>
        </div>
      </div>
    </footer>
  )
}
