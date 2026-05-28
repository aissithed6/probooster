from textwrap import dedent

content = dedent('''
"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Coins,
  Wallet,
  Settings,
  Share2,
  Bell,
  Download,
  Send,
  TrendingUp,
  ShoppingCart,
  Gift,
  User,
  MessageCircle,
  LogOut,
  HelpCircle,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  AlertCircle,
  Info,
  RefreshCw,
  Clock,
  Shield
} from 'lucide-react'

// ... (imports du dashboard vendeur)

''')

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Partie 1 écrite')
