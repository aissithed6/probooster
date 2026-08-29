'use client'

/**
 * Icônes partagées du dashboard (wrapper lucide-react).
 * Utilisé par OrdersTab, OffersTab, Header et Sidebar.
 */
import {
  AlertTriangle,
  Bell,
  CreditCard,
  Heart,
  LayoutDashboard,
  Package,
  PackageOpen,
  Printer,
  RefreshCw,
  Settings,
  ShoppingCart,
  Star,
  Trash2,
  User,
  X
} from 'lucide-react'

export const Icons = {
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4L18 20.5 12 17l-6 3.5 1.25-6.8L2.5 9.3l6.6-1.04L12 2z" />
    </svg>
  ),
  layoutDashboard: LayoutDashboard,
  heart: Heart,
  bell: Bell,
  settings: Settings,
  package: Package,
  packageOpen: PackageOpen,
  printer: Printer,
  refreshCw: RefreshCw,
  shoppingCart: ShoppingCart,
  star: Star,
  user: User,
  x: X,
  creditCard: CreditCard,
  paypal: Bell,
  alertTriangle: AlertTriangle,
  trash2: Trash2
}

export default Icons
