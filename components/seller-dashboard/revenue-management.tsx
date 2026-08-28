"use client"

import { useMemo, useState } from 'react'
import { useMoney } from '@/lib/hooks/use-money'
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, 
  Download, Calendar, BarChart, PieChart, LineChart, 
  ArrowUp, ArrowDown, Target, Award, Calculator, Receipt,
  Users, AlertTriangle
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import JSZip from 'jszip'

import { SellerRevenue } from './types'

interface RevenueManagementProps {
  revenue: SellerRevenue
  onPaymentRequest: (
    amount: number,
    payment: {
      paymentMethod: 'mobile_money' | 'bank_transfer'
      mobileNumber?: string
      bankDetails?: {
        bankName?: string
        accountNumber?: string
        accountName?: string
      }
    }
  ) => void
  withdrawableSummary?: {
    ordersCount: number
    amount: number
    remainingAmount: number
  }
  schedulableOrders?: Array<{
    id: string
    customerName?: string
    netRevenue?: number
  }>
}

export default function RevenueManagement({ 
  revenue, 
  onPaymentRequest,
  withdrawableSummary,
  schedulableOrders
}: RevenueManagementProps) {
  const [showAllVendorsModal, setShowAllVendorsModal] = useState(false)
  const [showPaymentScheduleModal, setShowPaymentScheduleModal] = useState(false)
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false)
  const [payoutPaymentMethod, setPayoutPaymentMethod] = useState<'mobile_money' | 'bank_transfer'>('mobile_money')
  const [payoutMobileNumber, setPayoutMobileNumber] = useState('')
  const [payoutBankName, setPayoutBankName] = useState('')
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('')
  const [payoutAccountName, setPayoutAccountName] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string
    customerName: string
    amount: number
    dueDate: string
    priority: string
    notificationMethod?: string
    reminderFrequency?: string
  } | null>(null)
  const [chartWindow, setChartWindow] = useState<'3m' | '6m' | '1y' | '2y'>('6m')
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null)

  const [paymentSchedules, setPaymentSchedules] = useState<
    Array<{
      id: string
      customerName: string
      amount: number
      dueDate: string
      priority: string
      notificationMethod?: string
      reminderFrequency?: string
    }>
  >([])

  const [isInvoicesZipLoading, setIsInvoicesZipLoading] = useState(false)

  const [scheduleReminderFrequency, setScheduleReminderFrequency] = useState('weekly')
  const [scheduleNotificationMethod, setScheduleNotificationMethod] = useState('email')
  const [scheduleDefaultDelayDays, setScheduleDefaultDelayDays] = useState('7')
  const [scheduleDefaultPriority, setScheduleDefaultPriority] = useState('normal')

  const handleConfirmPaymentRequest = async () => {
    try {
      setIsLoading(true)
      const amount = typeof withdrawableSummary?.amount === 'number' ? withdrawableSummary.amount : revenue.netRevenue

      if (payoutPaymentMethod === 'mobile_money' && !payoutMobileNumber.trim()) {
        throw new Error('Veuillez renseigner le numéro Mobile Money.')
      }

      if (
        payoutPaymentMethod === 'bank_transfer' &&
        (!payoutBankName.trim() || !payoutAccountNumber.trim() || !payoutAccountName.trim())
      ) {
        throw new Error('Veuillez renseigner les informations de virement bancaire.')
      }

      await Promise.resolve(
        onPaymentRequest(amount, {
          paymentMethod: payoutPaymentMethod,
          mobileNumber: payoutPaymentMethod === 'mobile_money' ? payoutMobileNumber.trim() : undefined,
          bankDetails:
            payoutPaymentMethod === 'bank_transfer'
              ? {
                  bankName: payoutBankName.trim(),
                  accountNumber: payoutAccountNumber.trim(),
                  accountName: payoutAccountName.trim()
                }
              : undefined
        })
      )
      showNotification('Demande envoyée au Super Admin pour validation.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'envoyer la demande de paiement."
      showNotification(message, 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  const [selectedScheduleOrderIds, setSelectedScheduleOrderIds] = useState<string[]>([])
  const [eligibleOrders, setEligibleOrders] = useState<
    Array<{ id: string; customerName?: string; netRevenue?: number }>
  >([])

  const [showInvoicesModal, setShowInvoicesModal] = useState(false)
  const [invoiceRows, setInvoiceRows] = useState<
    Array<{
      orderId: string
      orderNumber?: string
      customerName?: string
      amount?: number
      currency?: string
      createdAt?: string
      pdfUrl: string
    }>
  >([])

  const { formatMoney: formatCurrency } = useMoney()

  const handleDownloadAllInvoicesZip = async () => {
    try {
      setIsInvoicesZipLoading(true)

      const rows = Array.isArray(invoiceRows) ? invoiceRows : []
      if (rows.length === 0) {
        showNotification('Aucune facture PDF à télécharger.', 'warning')
        return
      }

      const zip = new JSZip()
      const dateLabel = new Date().toISOString().split('T')[0]
      const folder = zip.folder(`factures_${dateLabel}`)
      if (!folder) {
        throw new Error('Impossible de préparer le ZIP.')
      }

      const max = Math.min(rows.length, 50)
      for (let i = 0; i < max; i += 1) {
        const row = rows[i]
        const pdfUrl = String(row.pdfUrl ?? '').trim()
        const orderLabel = String(row.orderNumber ?? row.orderId ?? `commande_${i + 1}`).trim() || `commande_${i + 1}`
        if (!pdfUrl) continue

        const res = await fetch(pdfUrl, { method: 'GET' })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || `Téléchargement PDF impossible (${orderLabel}).`)
        }

        const arr = await res.arrayBuffer()
        folder.file(`facture_${orderLabel}.pdf`, arr)
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factures-${dateLabel}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showNotification('ZIP des factures téléchargé avec succès.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Téléchargement ZIP impossible.'
      showNotification(message, 'warning')
    } finally {
      setIsInvoicesZipLoading(false)
    }
  }

  const loadEligibleOrders = async () => {
    const res = await fetch('/api/finance/payment-schedules/eligible?mine=true', { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || 'Impossible de charger les commandes éligibles à la planification.')
    }
    const rows = (await res.json().catch(() => [])) as any[]
    const safe = Array.isArray(rows) ? rows : []
    setEligibleOrders(
      safe
        .map((r) => ({
          id: String((r as any)?.id ?? ''),
          customerName: (r as any)?.customerName,
          netRevenue: typeof (r as any)?.netRevenue === 'number' ? (r as any).netRevenue : Number((r as any)?.netRevenue ?? 0)
        }))
        .filter((x) => x.id.length > 0)
    )
  }

  const toggleScheduleOrder = (orderId: string) => {
    setSelectedScheduleOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1)
  }

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <ArrowUp className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-red-600" />
    )
  }

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-600' : 'text-red-600'
  }

  // Fonction pour afficher les notifications
  const showNotification = (message: string, type: 'success' | 'warning' | 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const mapPriorityValueToLabel = (value: string) => {
    const v = String(value ?? '').toLowerCase()
    if (v === 'low') return 'Basse'
    if (v === 'high') return 'Haute'
    if (v === 'urgent') return 'Urgente'
    if (v === 'normal') return 'Normale'
    return value
  }

  const loadPaymentSchedules = async () => {
    const res = await fetch('/api/finance/payment-schedules?mine=true', { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || 'Impossible de charger la planification des paiements.')
    }
    const rows = (await res.json().catch(() => [])) as any[]
    const safe = Array.isArray(rows) ? rows : []
    setPaymentSchedules(
      safe.map((r) => ({
        id: String(r?.id ?? ''),
        customerName: String(r?.customerName ?? 'Client'),
        amount: Number(r?.amount ?? 0),
        dueDate: String(r?.dueDate ?? ''),
        priority: String(r?.priority ?? 'Normale'),
        notificationMethod: r?.notificationMethod ? String(r.notificationMethod) : undefined,
        reminderFrequency: r?.reminderFrequency ? String(r.reminderFrequency) : undefined
      }))
    )
  }

  /**
   * Exporte le rapport de chiffre d'affaires au format CSV.
   * Utilise les données réelles reçues via l'API vendeur (pas de mocks).
   */
  const handleExportRevenueReport = () => {
    try {
      setIsLoading(true)

      const monthKeys = Array.isArray((revenue as any)?.monthKeys)
        ? (((revenue as any).monthKeys as any[])?.map((v) => String(v)) as string[])
        : []

      const monthlyRevenue = Array.isArray((revenue as any)?.monthlyRevenue)
        ? (((revenue as any).monthlyRevenue as any[])?.map((v) => Number(v ?? 0)) as number[])
        : []

      const monthlyLines: string[] = []
      const maxLen = Math.max(monthKeys.length, monthlyRevenue.length)
      for (let i = 0; i < maxLen; i++) {
        const key = monthKeys[i] ?? String(i + 1)
        const value = Number.isFinite(monthlyRevenue[i] as any) ? Number(monthlyRevenue[i]) : 0
        monthlyLines.push(`${key},${formatCurrency(value)}`)
      }

      const csvContent = [
        "Rapport Chiffre d'affaires",
        `Période,${new Date().toLocaleDateString('fr-FR')}`,
        `Chiffre d'affaires total,${formatCurrency(revenue.totalRevenue)}`,
        `Revenus nets,${formatCurrency(revenue.netRevenue)}`,
        `Commissions,${formatCurrency(revenue.totalCommissions)}`,
        '',
        'Évolution mensuelle',
        "Mois,Chiffre d'affaires",
        ...monthlyLines
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-chiffre-affaires-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showNotification("Rapport de chiffre d'affaires exporté avec succès (CSV)", 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export impossible.'
      showNotification(message, 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour générer les factures
  const handleGenerateInvoices = async () => {
    try {
      setIsLoading(true)

      const res = await fetch('/api/vendor/invoices/export?format=csv', { method: 'GET' })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Génération/export des factures impossible.')
      }

      const csvText = await res.text().catch(() => '')
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factures-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Charge une liste JSON (robuste) pour alimenter la modale PDF.
      const listRes = await fetch('/api/vendor/invoices/list', { method: 'GET' })
      if (!listRes.ok) {
        const text = await listRes.text().catch(() => '')
        throw new Error(text || 'Impossible de charger la liste des factures (PDF).')
      }

      const listJson = (await listRes.json().catch(() => [])) as any[]
      const safe = Array.isArray(listJson) ? listJson : []
      const parsedRows = safe
        .map((r) => ({
          orderId: String((r as any)?.orderId ?? ''),
          orderNumber: String((r as any)?.orderNumber ?? ''),
          customerName: String((r as any)?.customerName ?? ''),
          amount: Number((r as any)?.amount ?? 0),
          currency: String((r as any)?.currency ?? ''),
          createdAt: String((r as any)?.createdAt ?? ''),
          pdfUrl: String((r as any)?.pdfUrl ?? '')
        }))
        .filter((r) => r.orderId.length > 0 && r.pdfUrl.length > 0)

      setInvoiceRows(parsedRows)
      setShowInvoicesModal(true)

      showNotification('Factures exportées avec succès (CSV).', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Génération/export des factures impossible.'
      showNotification(message, 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour planifier les paiements
  const handleSchedulePayments = async () => {
    try {
      setIsLoading(true)
      await loadPaymentSchedules()
      await loadEligibleOrders()
      setShowPaymentScheduleModal(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger la planification.'
      showNotification(message, 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour confirmer la planification des paiements
  const handleConfirmPaymentSchedule = async () => {
    try {
      setIsLoading(true)

      const orderIds = Array.isArray(selectedScheduleOrderIds)
        ? selectedScheduleOrderIds.map((x) => String(x)).filter((x) => x.trim().length > 0)
        : []

      if (orderIds.length === 0) {
        showNotification('Sélectionnez au moins une commande à planifier.', 'warning')
        return
      }

      const delayDays = Math.max(1, Number(scheduleDefaultDelayDays || 7))
      const due = new Date()
      due.setDate(due.getDate() + delayDays)
      const dueDate = due.toISOString().split('T')[0]

      const payload = {
        orderIds,
        dueDate,
        priority: mapPriorityValueToLabel(scheduleDefaultPriority),
        notificationMethod: scheduleNotificationMethod,
        reminderFrequency: scheduleReminderFrequency
      }

      const res = await fetch('/api/finance/payment-schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Planification impossible.')
      }

      await loadPaymentSchedules()
      setSelectedScheduleOrderIds([])
      setShowPaymentScheduleModal(false)
      showNotification('Planification enregistrée avec succès.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Planification impossible.'
      showNotification(message, 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Exporte la planification des paiements (CSV) depuis la base via l'API.
   */
  const handleExportPaymentSchedule = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/finance/payment-schedules/export?mine=true&format=csv', {
        method: 'GET'
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || "Export impossible (planification des paiements).")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `planification-paiements-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showNotification('Planification des paiements exportée avec succès (CSV)', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export impossible.'
      showNotification(message, 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour ouvrir le modal de modification d'un paiement
  const handleEditPayment = (payment: {
    id: string
    customerName: string
    amount: number
    dueDate: string
    priority: string
    notificationMethod?: string
    reminderFrequency?: string
  }) => {
    setSelectedPayment(payment)
    setShowEditPaymentModal(true)
  }

  // Fonction pour sauvegarder les modifications d'un paiement
  const handleSavePaymentEdit = (updatedPayment: {
    id: string
    customerName: string
    amount: number
    dueDate: string
    priority: string
    notificationMethod?: string
    reminderFrequency?: string
  }) => {
    ;(async () => {
      try {
        setIsLoading(true)

        const payload = {
          dueDate: updatedPayment.dueDate,
          priority: updatedPayment.priority,
          notificationMethod: updatedPayment.notificationMethod,
          reminderFrequency: updatedPayment.reminderFrequency
        }

        const res = await fetch(`/api/finance/payment-schedules/${encodeURIComponent(updatedPayment.id)}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || 'Mise à jour impossible.')
        }

        const saved = await res.json().catch(() => null)
        if (saved) {
          const merged = {
            ...updatedPayment,
            dueDate: String((saved as any)?.dueDate ?? updatedPayment.dueDate),
            priority: String((saved as any)?.priority ?? updatedPayment.priority),
            notificationMethod: (saved as any)?.notificationMethod
              ? String((saved as any).notificationMethod)
              : updatedPayment.notificationMethod,
            reminderFrequency: (saved as any)?.reminderFrequency
              ? String((saved as any).reminderFrequency)
              : updatedPayment.reminderFrequency
          }
          setSelectedPayment(merged)
        }

        await loadPaymentSchedules()
        setShowEditPaymentModal(false)
        showNotification(`Paiement ${updatedPayment.id} modifié avec succès`, 'success')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Mise à jour impossible.'
        showNotification(message, 'warning')
      } finally {
        setIsLoading(false)
      }
    })()
  }

  const monthKeys = Array.isArray((revenue as any)?.monthKeys)
    ? (((revenue as any).monthKeys as any[])?.map((v) => String(v)) as string[])
    : []

  const monthlyRevenue = Array.isArray((revenue as any)?.monthlyRevenue)
    ? (((revenue as any).monthlyRevenue as any[])?.map((v) => Number(v ?? 0)) as number[])
    : []

  const monthlyOrders = Array.isArray((revenue as any)?.monthlyOrders)
    ? (((revenue as any).monthlyOrders as any[])?.map((v) => Number(v ?? 0)) as number[])
    : []

  const monthlyData = useMemo(() => {
    const maxLen = Math.max(monthKeys.length, monthlyRevenue.length, monthlyOrders.length)
    const out: Array<{ month: string; revenue: number; orders: number }> = []

    for (let i = 0; i < maxLen; i++) {
      const key = monthKeys[i] ?? ''
      const parsed = key && /^\d{4}-\d{2}$/.test(key) ? new Date(`${key}-01T00:00:00.000Z`) : null
      const monthLabel = parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
        : key || `M${i + 1}`

      out.push({
        month: monthLabel,
        revenue: Number.isFinite(monthlyRevenue[i] as any) ? Number(monthlyRevenue[i]) : 0,
        orders: Number.isFinite(monthlyOrders[i] as any) ? Number(monthlyOrders[i]) : 0
      })
    }

    return out
  }, [monthKeys, monthlyOrders, monthlyRevenue])

  // Fenêtre sélectionnable pour « Évolution des Revenus » (3 mois → 2 ans).
  const visibleMonthlyData = useMemo(() => {
    const count = chartWindow === '3m' ? 3 : chartWindow === '6m' ? 6 : chartWindow === '1y' ? 12 : 24
    if (monthlyData.length <= count) return monthlyData
    return monthlyData.slice(monthlyData.length - count)
  }, [chartWindow, monthlyData])

  const categoryData = useMemo(() => {
    const rows = Array.isArray((revenue as any)?.revenueByCategory)
      ? (((revenue as any).revenueByCategory as any[]) ?? [])
      : []

    return rows.map((row: any) => ({
      category: String(row?.category ?? 'Autres'),
      revenue: Number(row?.revenue ?? 0),
      percentage: Number(row?.percentage ?? 0)
    }))
  }, [revenue])

  const growthRate = getGrowthRate(revenue.totalRevenue, 0) // Comparaison avec 0 (pas de données précédentes)

  const isReceivedPaymentStatus = (status: unknown) => {
    const s = String(status ?? '').trim().toLowerCase()
    if (!s) return false
    if (s === 'completed') return true
    if (s === 'paid') return true
    if (s === 'approved') return true
    if (s.includes('success')) return true
    if (s.includes('succeed')) return true
    return false
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : notification.type === 'warning' 
            ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
            : 'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              notification.type === 'success' ? 'bg-green-500' 
              : notification.type === 'warning' ? 'bg-yellow-500' 
              : 'bg-blue-500'
            }`}></div>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* En-tête avec statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(revenue.totalRevenue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(growthRate)}
                  <span className={`text-xs font-medium ${getGrowthColor(growthRate)}`}>
                    {Math.abs(growthRate).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs mois dernier</span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Revenu Net</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(revenue.netRevenue)}</p>
                <p className="text-xs text-green-600 mt-1">
                  {formatPercentage(revenue.netRevenue, revenue.totalRevenue)}% du CA
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Commissions</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(revenue.totalCommissions)}</p>
                <p className="text-xs text-red-600 mt-1">
                  {formatPercentage(revenue.totalCommissions, revenue.totalRevenue)}% du CA
                </p>
              </div>
              <Calculator className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Paiements en Attente</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(revenue.pendingPayments)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {revenue.completedPayments} paiements reçus
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Évolution des Revenus</CardTitle>
                <CardDescription>
                  Performance sur {chartWindow === '3m' ? 'les 3 derniers mois' : chartWindow === '6m' ? 'les 6 derniers mois' : chartWindow === '1y' ? 'les 12 derniers mois (1 an)' : 'les 24 derniers mois (2 ans)'}
                </CardDescription>
              </div>
              <Select value={chartWindow} onValueChange={(v) => setChartWindow(v as typeof chartWindow)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 mois</SelectItem>
                  <SelectItem value="6m">6 mois</SelectItem>
                  <SelectItem value="1y">1 an</SelectItem>
                  <SelectItem value="2y">2 ans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Graphique d'évolution des revenus</p>
                <div className="mt-4 space-y-2">
                  {visibleMonthlyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{data.month}</span>
                      <span className="font-medium">{formatCurrency(data.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Catégorie</CardTitle>
            <CardDescription>Répartition du CA par catégorie de produits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Graphique de répartition</p>
                <div className="mt-4 space-y-2">
                  {categoryData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{data.category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{data.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails financiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Produits</CardTitle>
            <CardDescription>Produits les plus rentables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} ventes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-500">
                      {formatPercentage(product.revenue, revenue.totalRevenue)}% du CA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des Paiements</CardTitle>
            <CardDescription>Derniers paiements reçus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue.paymentHistory.slice(0, 5).map((payment, index) => (
                <div key={payment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">{payment.method}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        isReceivedPaymentStatus(payment.status)
                          ? 'bg-green-100 text-green-800'
                          : String(payment.status ?? '').toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }
                    >
                      {isReceivedPaymentStatus(payment.status)
                        ? 'Reçu'
                        : String(payment.status ?? '').toLowerCase() === 'pending'
                          ? 'En cours'
                          : 'Échoué'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{payment.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Gestion des paiements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => setShowAllVendorsModal(true)}
                className="w-full bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Demander un Paiement
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportRevenueReport}
                disabled={isLoading}
                className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Export en cours...' : 'Exporter Rapport'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGenerateInvoices}
                disabled={isLoading}
                className="w-full justify-start hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <Receipt className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Génération...' : 'Générer Factures'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSchedulePayments}
                disabled={isLoading}
                className="w-full justify-start hover:bg-purple-50 hover:border-purple-200 transition-colors"
              >
                <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Planification...' : 'Planifier Paiement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse Détaillée des Revenus</CardTitle>
          <CardDescription>Vue d'ensemble complète de vos finances</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="products">Par Produit</TabsTrigger>
              <TabsTrigger value="categories">Par Catégorie</TabsTrigger>
              <TabsTrigger value="periods">Par Période</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CA Total</span>
                    <Target className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.totalRevenue)}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {getGrowthIcon(growthRate)}
                    <span className={`text-xs ${getGrowthColor(growthRate)}`}>
                      {Math.abs(growthRate).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenu Net</span>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.netRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercentage(revenue.netRevenue, revenue.totalRevenue)}% du CA
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Commissions</span>
                    <Calculator className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.totalCommissions)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercentage(revenue.totalCommissions, revenue.totalRevenue)}% du CA
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">En Attente</span>
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.pendingPayments)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {revenue.completedPayments} paiements reçus
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <div className="space-y-4">
                {revenue.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.sales} unités vendues</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">
                        {formatPercentage(product.revenue, revenue.totalRevenue)}% du CA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="space-y-4">
                {revenue.revenueByCategory.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category.category}</span>
                      <span className="font-bold">{formatCurrency(category.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{category.percentage}% du chiffre d'affaires</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="periods" className="mt-6">
              <div className="space-y-4">
                {visibleMonthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{data.month}</p>
                      <p className="text-sm text-gray-500">{data.orders} commandes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.revenue)}</p>
                      <p className="text-sm text-gray-500">
                        Moyenne: {formatCurrency(data.revenue / data.orders)}/commande
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal pour demande tous les paiements */}
      <Dialog open={showAllVendorsModal} onOpenChange={setShowAllVendorsModal}>
        <DialogContent className="max-w-lg border-[#8b5cf6] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#8b5cf6]/20 rounded-full">
                <Users className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <DialogTitle className="text-[#8b5cf6] font-bold">Demande Tous les Paiements</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Effectuer une demande de paiement pour toutes les commandes disponibles
            </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-[#8b5cf6]/20 to-[#3b82f6]/20 rounded-lg border border-[#8b5cf6]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#8b5cf6]">Commandes disponibles :</span>
                <span className="text-lg font-bold text-[#8b5cf6]">
                  {typeof (withdrawableSummary as any)?.availableOrdersCount === 'number'
                    ? (withdrawableSummary as any).availableOrdersCount
                    : typeof withdrawableSummary?.ordersCount === 'number'
                      ? withdrawableSummary.ordersCount
                      : revenue.completedPayments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#3b82f6]">Montant retirable :</span>
                <span className="text-xl font-bold text-[#3b82f6]">
                  {formatCurrency(typeof withdrawableSummary?.amount === 'number' ? withdrawableSummary.amount : revenue.netRevenue)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Mode de paiement :</h4>
              <Select value={payoutPaymentMethod} onValueChange={(v) => setPayoutPaymentMethod(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                </SelectContent>
              </Select>

              {payoutPaymentMethod === 'mobile_money' && (
                <input
                  className="w-full mt-2 px-3 py-2 border rounded-md text-sm"
                  value={payoutMobileNumber}
                  onChange={(e) => setPayoutMobileNumber(e.target.value)}
                  placeholder="Numéro Mobile Money (ex: +2250700000000)"
                />
              )}

              {payoutPaymentMethod === 'bank_transfer' && (
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <input
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={payoutBankName}
                    onChange={(e) => setPayoutBankName(e.target.value)}
                    placeholder="Nom de la banque"
                  />
                  <input
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={payoutAccountNumber}
                    onChange={(e) => setPayoutAccountNumber(e.target.value)}
                    placeholder="Numéro de compte"
                  />
                  <input
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={payoutAccountName}
                    onChange={(e) => setPayoutAccountName(e.target.value)}
                    placeholder="Nom du titulaire"
                  />
                </div>
              )}
            </div>

            {Number(revenue.pendingPayments ?? 0) > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Demande en attente :</p>
                  <p>
                    Une demande de paiement est en cours de traitement. Vous pouvez demander le solde restant :
                    cette nouvelle demande portera uniquement sur les commandes pas encore incluses dans la demande
                    en cours (pas de doublon possible).
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Aperçu des revenus :</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Chiffre d'affaires total</span>
                  <span className="font-medium">{formatCurrency(revenue.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Revenu net disponible</span>
                  <span className="font-medium">{formatCurrency(revenue.netRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Revenu retirable</span>
                  <span className="font-medium">{formatCurrency(typeof withdrawableSummary?.amount === 'number' ? withdrawableSummary.amount : revenue.netRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Reste (non éligible / bloqué)</span>
                  <span className="font-medium">{formatCurrency(typeof withdrawableSummary?.remainingAmount === 'number' ? withdrawableSummary.remainingAmount : 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Commissions</span>
                  <span className="font-medium">{formatCurrency(revenue.totalCommissions)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Paiements en attente</span>
                  <span className="font-medium">{formatCurrency(revenue.pendingPayments)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#ff6600]/20 border border-[#ff6600] rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff6600] mt-0.5" />
                <div className="text-sm text-[#ff6600]">
                  <p className="font-medium">Information :</p>
                  <p>Cette action enverra une demande de paiement pour tous vos revenus disponibles.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAllVendorsModal(false)}
              className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                await handleConfirmPaymentRequest()
                setShowAllVendorsModal(false)
              }}
              disabled={
                isLoading ||
                !(
                  typeof withdrawableSummary?.amount === 'number'
                    ? withdrawableSummary.amount > 0
                    : Number(revenue.netRevenue ?? 0) > 0
                )
              }
              className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Users className="w-4 h-4 mr-2" />
              {Number(revenue.pendingPayments ?? 0) > 0 ? 'Confirmer la Demande (solde restant)' : 'Confirmer la Demande'}
            </Button>
          </DialogFooter>
                 </DialogContent>
       </Dialog>

       {/* Modal de Planification des Paiements */}
       <Dialog open={showPaymentScheduleModal} onOpenChange={setShowPaymentScheduleModal}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-purple-100 rounded-full">
                 <Calendar className="w-6 h-6 text-purple-600" />
               </div>
            <div>
                 <DialogTitle className="text-2xl font-bold text-gray-900">Planification des Paiements</DialogTitle>
                 <DialogDescription className="text-gray-600">
                   Planifiez et gérez vos paiements à venir avec des échéances et priorités
                 </DialogDescription>
            </div>
             </div>
           </DialogHeader>
           
           <div className="space-y-6">
             {/* Aperçu des paiements à planifier */}
             <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
               <CardHeader>
                 <CardTitle className="text-purple-800">Aperçu des Paiements Disponibles</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                     <div className="text-2xl font-bold text-purple-600">{formatCurrency(revenue.pendingPayments)}</div>
                     <div className="text-sm text-purple-600">Montant en attente</div>
                   </div>
                   <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                     <div className="text-2xl font-bold text-blue-600">{revenue.completedPayments}</div>
                     <div className="text-sm text-blue-600">Commandes livrées</div>
                   </div>
                   <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                     <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue.netRevenue)}</div>
                     <div className="text-sm text-green-600">Revenu net disponible</div>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Tableau des paiements planifiés */}
             <Card>
               <CardHeader>
                 <CardTitle>Paiements à Planifier</CardTitle>
                 <CardDescription>Gérez les échéances et priorités de vos paiements</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {/* Sélection des commandes à planifier */}
                   {((Array.isArray(schedulableOrders) && schedulableOrders.length > 0) || eligibleOrders.length > 0) && (
                     <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                       <div className="text-sm font-medium text-gray-700">Commandes à planifier</div>
                       <div className="space-y-2">
                         {(Array.isArray(schedulableOrders) && schedulableOrders.length > 0 ? schedulableOrders : eligibleOrders)
                           .slice(0, 20)
                           .map((o) => (
                             <div key={o.id} className="flex items-center justify-between gap-3 p-2 bg-white rounded border">
                               <div className="flex items-center gap-2">
                                 <Checkbox
                                   checked={selectedScheduleOrderIds.includes(o.id)}
                                   onCheckedChange={() => toggleScheduleOrder(o.id)}
                                 />
                                 <div className="text-sm font-medium text-gray-800">{o.customerName ?? 'Commande'}</div>
                               </div>
                               <div className="text-sm font-bold text-green-600">{formatCurrency(Number(o.netRevenue ?? 0))}</div>
                             </div>
                           ))}
                       </div>
                       {((Array.isArray(schedulableOrders) && schedulableOrders.length > 20) || eligibleOrders.length > 20) && (
                         <div className="text-xs text-gray-500">Affichage limité aux 20 premières commandes.</div>
                       )}
                     </div>
                   )}

                   {/* En-têtes */}
                   <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                     <div>Client</div>
                     <div>Montant</div>
                     <div>Date d'échéance</div>
                     <div>Priorité</div>
                     <div>Statut</div>
                     <div>Actions</div>
                   </div>

                   {/* Lignes */}
                   <div className="space-y-3">
                     {paymentSchedules.length === 0 ? (
                       <div className="p-4 text-sm text-gray-600 bg-gray-50 border rounded-lg">
                         Aucun paiement planifié pour le moment.
                       </div>
                     ) : (
                       paymentSchedules.map((p) => (
                         <div key={p.id} className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                           <div className="font-medium">{p.customerName}</div>
                           <div className="font-bold text-green-600">{formatCurrency(p.amount)}</div>
                           <div className="text-sm text-gray-600">
                             {p.dueDate ? new Date(p.dueDate).toLocaleDateString('fr-FR') : '-'}
                           </div>
                           <div>
                             <Badge className="bg-blue-100 text-blue-800 border-blue-200">{p.priority}</Badge>
                           </div>
                           <div>
                             <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Planifié</Badge>
                           </div>
                           <div className="flex space-x-2">
                             <Button
                               size="sm"
                               variant="outline"
                               className="text-blue-600 border-blue-200 hover:bg-blue-50"
                               onClick={() =>
                                 handleEditPayment({
                                   id: p.id,
                                   customerName: p.customerName,
                                   amount: p.amount,
                                   dueDate: p.dueDate,
                                   priority: p.priority,
                                   notificationMethod: p.notificationMethod,
                                   reminderFrequency: p.reminderFrequency
                                 })
                               }
                             >
                               <Calendar className="w-3 h-3 mr-1" />
                               Modifier
                             </Button>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Options de planification */}
             <Card>
               <CardHeader>
                 <CardTitle>Options de Planification</CardTitle>
                 <CardDescription>Personnalisez vos paramètres de planification</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence de rappel</label>
                       <Select value={scheduleReminderFrequency} onValueChange={setScheduleReminderFrequency}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner la fréquence" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="daily">Quotidien</SelectItem>
                           <SelectItem value="weekly">Hebdomadaire</SelectItem>
                           <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                           <SelectItem value="monthly">Mensuel</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de notification</label>
                       <Select value={scheduleNotificationMethod} onValueChange={setScheduleNotificationMethod}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner la méthode" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="email">Email</SelectItem>
                           <SelectItem value="sms">SMS</SelectItem>
                           <SelectItem value="push">Notification push</SelectItem>
                           <SelectItem value="all">Toutes</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Délai d'échéance par défaut</label>
                       <Select value={scheduleDefaultDelayDays} onValueChange={setScheduleDefaultDelayDays}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner le délai" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="3">3 jours</SelectItem>
                           <SelectItem value="7">7 jours</SelectItem>
                           <SelectItem value="14">14 jours</SelectItem>
                           <SelectItem value="30">30 jours</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Priorité par défaut</label>
                       <Select value={scheduleDefaultPriority} onValueChange={setScheduleDefaultPriority}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner la priorité" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="low">Basse</SelectItem>
                           <SelectItem value="normal">Normale</SelectItem>
                           <SelectItem value="high">Haute</SelectItem>
                           <SelectItem value="urgent">Urgente</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
           
           <DialogFooter className="flex justify-between">
             <div className="flex space-x-2">
               <Button 
                 variant="outline" 
                 onClick={handleExportPaymentSchedule}
                 disabled={isLoading}
                 className="border-blue-500 text-blue-600 hover:bg-blue-50"
               >
                 <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                 {isLoading ? 'Export...' : 'Exporter Planification'}
               </Button>
               <Button 
                 variant="outline" 
                 onClick={() => setShowPaymentScheduleModal(false)}
                 className="border-gray-300 text-gray-600 hover:bg-gray-50"
               >
                 Annuler
               </Button>
             </div>
             <Button 
               onClick={handleConfirmPaymentSchedule}
               disabled={isLoading}
               className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
             >
               <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
               {isLoading ? 'Planification...' : 'Confirmer Planification'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Modal d'édition des paiements */}
       <Dialog open={showEditPaymentModal} onOpenChange={setShowEditPaymentModal}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-blue-100 rounded-full">
                 <Calendar className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                 <DialogTitle className="text-xl font-bold text-gray-900">Modifier le Paiement</DialogTitle>
                 <DialogDescription className="text-gray-600">
                   Modifiez la date d'échéance et la priorité du paiement
                 </DialogDescription>
               </div>
             </div>
           </DialogHeader>
           
           {selectedPayment && (
             <div className="space-y-6">
               {/* Informations du paiement */}
               <Card className="bg-gray-50">
                 <CardContent className="p-4">
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-600">Client :</span>
                       <span className="font-medium">{selectedPayment.customerName}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-600">Montant :</span>
                       <span className="font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-600">ID Paiement :</span>
                       <span className="font-mono text-sm">{selectedPayment.id}</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Formulaire de modification */}
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
              <input
                     type="date"
                     defaultValue={selectedPayment.dueDate}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     onChange={(e) => setSelectedPayment({
                       ...selectedPayment,
                       dueDate: e.target.value
                     })}
              />
            </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                   <Select 
                     value={selectedPayment.priority} 
                     onValueChange={(value) => setSelectedPayment({
                       ...selectedPayment,
                       priority: value
                     })}
                   >
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Sélectionner la priorité" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Basse">Basse</SelectItem>
                       <SelectItem value="Normale">Normale</SelectItem>
                       <SelectItem value="Haute">Haute</SelectItem>
                       <SelectItem value="Urgente">Urgente</SelectItem>
                     </SelectContent>
                   </Select>
            </div>

                 {/* Options supplémentaires */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de notification</label>
                   <Select defaultValue="email">
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Sélectionner la méthode" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="email">Email</SelectItem>
                       <SelectItem value="sms">SMS</SelectItem>
                       <SelectItem value="push">Notification push</SelectItem>
                       <SelectItem value="all">Toutes</SelectItem>
                     </SelectContent>
                   </Select>
          </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Rappel avant échéance</label>
                   <Select defaultValue="3">
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Sélectionner le délai" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="1">1 jour avant</SelectItem>
                       <SelectItem value="3">3 jours avant</SelectItem>
                       <SelectItem value="7">7 jours avant</SelectItem>
                       <SelectItem value="14">14 jours avant</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </div>
           )}
           
           <DialogFooter className="flex justify-between">
             <Button 
               variant="outline" 
               onClick={() => setShowEditPaymentModal(false)}
               className="border-gray-300 text-gray-600 hover:bg-gray-50"
             >
              Annuler
            </Button>
            <Button 
               onClick={() => selectedPayment && handleSavePaymentEdit(selectedPayment)}
               disabled={isLoading || !selectedPayment}
               className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
             >
               <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
               {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Factures (PDF par commande) */}
      <Dialog open={showInvoicesModal} onOpenChange={setShowInvoicesModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Factures (PDF)</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Télécharge une facture PDF pour chaque commande.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {invoiceRows.length === 0 ? (
              <div className="p-4 text-sm text-gray-600 bg-gray-50 border rounded-lg">
                Aucune facture PDF disponible.
              </div>
            ) : (
              invoiceRows.slice(0, 50).map((row) => (
                <div key={row.orderId} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-800">
                      Commande: {row.orderNumber && row.orderNumber.trim().length > 0 ? row.orderNumber : row.orderId}
                    </div>
                    {(row.customerName && row.customerName.trim().length > 0) || typeof row.amount === 'number' ? (
                      <div className="text-xs text-gray-500">
                        {row.customerName && row.customerName.trim().length > 0 ? row.customerName : 'Client'}
                        {typeof row.amount === 'number' ? ` • ${row.amount} ${row.currency || 'XOF'}` : ''}
                      </div>
                    ) : null}

                    {row.createdAt && row.createdAt.trim().length > 0 ? (
                      <div className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleDateString('fr-FR')}</div>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => window.open(row.pdfUrl, '_blank')}
                  >
                    Télécharger PDF
                  </Button>
                </div>
              ))
            )}
            {invoiceRows.length > 50 && (
              <div className="text-xs text-gray-500">Affichage limité aux 50 premières factures.</div>
            )}
          </div>

          <DialogFooter>
            <div className="flex w-full justify-between gap-2">
              <Button
                variant="outline"
                disabled={isInvoicesZipLoading || invoiceRows.length === 0}
                onClick={handleDownloadAllInvoicesZip}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                {isInvoicesZipLoading ? 'ZIP en cours...' : 'Télécharger tout (ZIP)'}
              </Button>

              <Button variant="outline" onClick={() => setShowInvoicesModal(false)}>
                Fermer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
