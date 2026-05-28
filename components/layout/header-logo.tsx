"use client"

import Link from "next/link"
import Image from "next/image"

export default function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image 
        src="/images/logo.png" 
        alt="Probooster Logo" 
        width={120} 
        height={40} 
        className="h-10 w-auto"
        style={{ width: 'auto', height: '40px' }}
        priority
      />
    </Link>
  )
}


