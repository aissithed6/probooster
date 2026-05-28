"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  User
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNotifications } from "@/components/ui/modern-notification"
import {
  SuperAdminDeliveryRecord,
  SuperAdminDeliveryService,
  SuperAdminDeliveryStatus
} from "@/lib/services/super-admin-delivery-service"
import { SuperAdminOrderService } from "@/lib/services/super-admin-order-service"

interface OrderChoice {
  id: string
  label: string
  customerId: string | null
  vendorId: string | null
}

const DELIVERY_STATUS_CONFIG: Record<SuperAdminDeliveryStatus, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  confirmed: { label: "Confirmée", tone: "border-blue-200 bg-blue-50 text-blue-700" },
  preparing: { label: "En préparation", tone: "border-purple-200 bg-purple-50 text-purple-700" },
  in_transit: { label: "En cours", tone: "border-blue-200 bg-blue-50 text-blue-700" },
  out_for_delivery: { label: "En livraison", tone: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  delivered: { label: "Livrée", tone: "border-green-200 bg-green-50 text-green-700" },
  failed: { label: "Échouée", tone: "border-red-200 bg-red-50 text-red-700" },
  cancelled: { label: "Annulée", tone: "border-gray-200 bg-gray-50 text-gray-700" },
  returned: { label: "Retournée", tone: "border-amber-200 bg-amber-50 text-amber-700" },
  exception: { label: "Exception", tone: "border-rose-200 bg-rose-50 text-rose-700" }
}

/**
 * Formatte une date ISO en texte lisible pour l'interface.
 */
function formatDate(value?: string | null): string {
  if (!value) return "Non spécifié"
  
  const date = new Date(value)
  if (isNaN(date.getTime())) return "Date invalide"
  
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
}

/**
 * Calcule le libellé lisible d'une progression de livraison.
 */
function formatProgressLabel(progress: number): string {
  if (progress >= 100) return "Livraison terminée"
  if (progress >= 75) return "Quasi livré"
  if (progress >= 50) return "Mi-parcours"
  if (progress >= 25) return "Démarré"
  return "Planifié"
}

/**
 * Section de gestion complète des livraisons côté super administrateur.
 */
export default function DeliveryManagement(): JSX.Element {
  const { addNotification } = useNotifications()
  const [deliveries, setDeliveries] = useState<SuperAdminDeliveryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [orderFilter, setOrderFilter] = useState<string>("all")

  const [selectedDelivery, setSelectedDelivery] = useState<SuperAdminDeliveryRecord | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [orderChoices, setOrderChoices] = useState<OrderChoice[]>([])

  const [newDeliveryForm, setNewDeliveryForm] = useState({
    orderId: "",
    customerId: "",
    status: "pending" as SuperAdminDeliveryStatus,
    priority: "medium",
    eta: "",
    trackingNumber: "",
    driverName: "",
    driverPhone: "",
    driverVehicle: ""
  })

  // Fonctions de gestion des données...
  
  // Rendu du composant
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des livraisons</h2>
          <p className="text-sm text-gray-600">
            Supervisez, configurez et suivez en temps réel toutes les livraisons de la marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => void loadDeliveries()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualiser
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle livraison
          </Button>
        </div>
      </div>

      {/* Le reste du contenu du composant... */}
      
    </div>
  )
  
  // Fonctions utilitaires et gestionnaires d'événements...
  async function loadDeliveries() {
    // Implémentation de la fonction de chargement...
  }
}
