"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, ShoppingCart, DollarSign, Star, Shield, Activity, AlertTriangle, Mail, Loader2, BarChart3, RefreshCw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SuperAdminDashboardService, type SuperAdminOverviewStats, type SuperAdminActivity, type SuperAdminSystemAlert, type SuperAdminInboxMessage } from '@/lib/services/super-admin-dashboard-service'
import { useAuth } from '@/contexts/AuthContext'
import { useMoney } from '@/lib/hooks/use-money'

type OverviewProps = {
  stats: SuperAdminOverviewStats | null
}

const DEFAULT_STATS: SuperAdminOverviewStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalVendors: 0,
  pendingVendors: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  revenueGross: 0,
  revenueRefunds: 0,
  revenueNet: 0,
  totalPoints: 0,
  unreadMessages: 0,
  systemAlerts: 0,
  conversionRate: 0
}

/**
 * Affiche la synthÃ¨se temps rÃ©el du super administrateur (stats, activitÃ©s, alertes, messages).
 */
export default function SuperAdminOverview({ stats }: OverviewProps) {
  const { user } = useAuth()
  const { formatMoney } = useMoney()
  const [activities, setActivities] = useState<SuperAdminActivity[]>([])
  const [alerts, setAlerts] = useState<SuperAdminSystemAlert[]>([])
  const [inboxMessages, setInboxMessages] = useState<SuperAdminInboxMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false)

  const resolvedStats = stats ?? DEFAULT_STATS

  const activitySummary = useMemo(() => ({
    orders: activities.filter((a) => a.type === 'order').length,
    alerts: activities.filter((a) => a.type === 'alert').length,
    messages: activities.filter((a) => a.type === 'message').length
  }), [activities])

  const loadOverviewData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [activityData, alertData, messageData] = await Promise.all([
        SuperAdminDashboardService.getRecentActivities(15),
        SuperAdminDashboardService.getSystemAlerts(10),
        user?.id ? SuperAdminDashboardService.getInboxMessages(user.id, 10) : Promise.resolve([])
      ])

      setActivities(activityData)
      setAlerts(alertData)
      setInboxMessages(messageData)
    } catch (err) {
      console.error('Erreur lors du chargement de la vue d\'ensemble:', err)
      setError('Impossible de charger la vue d\'ensemble. Veuillez rÃ©essayer plus tard.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void loadOverviewData()
  }, [loadOverviewData])

  const handleRefresh = () => {
    void loadOverviewData()
  }

  const handleCreateSystemAlert = async () => {
    if (!alertMessage.trim()) {
      return
    }

    setIsSubmittingAlert(true)
    try {
      const success = await SuperAdminDashboardService.createSystemAlert({
        title: 'Alerte Super Admin',
        message: alertMessage,
        severity: 'warning',
        actionRequired: true
      })

      if (success) {
        setAlertMessage('')
        setShowAlertDialog(false)
        void loadOverviewData()
      } else {
        setError('Impossible de crÃ©er l\'alerte systÃ¨me. RÃ©essayez ultÃ©rieurement.')
      }
    } finally {
      setIsSubmittingAlert(false)
    }
  }

  const formatAmount = (value: number) => formatMoney(value)
  const resolvePercentage = (numerator: number, denominator: number) => {
    if (!denominator) return '0.0'
    return ((numerator / denominator) * 100).toFixed(1)
  }

  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.status === 'active'), [alerts])

  const latestMessages = useMemo(() => inboxMessages.slice(0, 4), [inboxMessages])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble du systÃ¨me</h2>
          <p className="text-gray-600">Surveillez l'activitÃ© globale, les alertes et la messagerie en temps rÃ©el.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setShowAlertDialog(true)} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
            <AlertTriangle className="mr-2 h-4 w-4" />
            CrÃ©er une alerte
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#ff6600]/20 bg-gradient-to-br from-[#ff6600]/10 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                <p className="text-3xl font-bold text-[#ff6600]">{resolvedStats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {resolvePercentage(resolvedStats.activeUsers, resolvedStats.totalUsers)}% du total
                </p>
              </div>
              <div className="p-3 bg-[#ff6600]/20 rounded-full">
                <Users className="h-8 w-8 text-[#ff6600]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#535455]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-3xl font-bold text-[#535455]">{formatAmount((resolvedStats as any).revenueNet ?? resolvedStats.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Ventes: {formatAmount((resolvedStats as any).revenueGross ?? resolvedStats.totalRevenue)} Â· Remboursements: {formatAmount((resolvedStats as any).revenueRefunds ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-[#535455]/10 rounded-full">
                <DollarSign className="h-8 w-8 text-[#535455]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#ff6600]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes</p>
                <p className="text-3xl font-bold text-[#ff6600]">{resolvedStats.totalOrders.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Depuis le lancement</p>
              </div>
              <div className="p-3 bg-[#ff6600]/20 rounded-full">
                <ShoppingCart className="h-8 w-8 text-[#ff6600]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#535455]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points en circulation</p>
                <p className="text-3xl font-bold text-[#535455]">
                  {resolvedStats.totalPoints >= 1_000_000
                    ? `${(resolvedStats.totalPoints / 1_000_000).toFixed(1)}M`
                    : resolvedStats.totalPoints.toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Programme de fidÃ©litÃ©</p>
              </div>
              <div className="p-3 bg-[#535455]/10 rounded-full">
                <Star className="h-8 w-8 text-[#535455]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#ff6600]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#ff6600]" />
              ActivitÃ©s rÃ©centes
            </CardTitle>
            <CardDescription>
              {activitySummary.orders} commandes Â· {activitySummary.alerts} alertes Â· {activitySummary.messages} messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des activitÃ©sâ€¦
              </div>
            )}

            {!isLoading && activities.length === 0 && (
              <p className="text-sm text-gray-500">Aucune activitÃ© rÃ©cente pour le moment.</p>
            )}

            {!isLoading && activities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white shadow-sm">
                <div className="mt-1">
                  {activity.type === 'order' && <ShoppingCart className="h-4 w-4 text-[#ff6600]" />}
                  {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {activity.type === 'message' && <Mail className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <Badge variant="outline">{activity.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(activity.timestamp).toLocaleString('fr-FR')}</p>
                </div>
                <Badge className={`capitalize ${activity.priority === 'high' ? 'bg-red-100 text-red-700' : activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                  {activity.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#ff6600]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#ff6600]">
              <Shield className="h-5 w-5" />
              Alertes actives
            </CardTitle>
            <CardDescription>Gestion centralisÃ©e des incidents en cours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                VÃ©rification des alertesâ€¦
              </div>
            )}

            {!isLoading && activeAlerts.length === 0 && (
              <p className="text-sm text-gray-500">Aucune alerte critique pour le moment.</p>
            )}

            {!isLoading && activeAlerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <p className="font-medium text-orange-900">{alert.title}</p>
                </div>
                <p className="text-xs text-orange-700 mt-1">{alert.message}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-orange-600">
                  <span>GravitÃ© : {alert.type}</span>
                  <span>{new Date(alert.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}

            <Separator />
            <p className="text-xs text-gray-500">
              Total alertes : {alerts.length} Â· Actives : {activeAlerts.length} Â· RÃ©solues : {alerts.length - activeAlerts.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#535455]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#535455]">
              <Mail className="h-5 w-5" />
              Derniers messages reÃ§us
            </CardTitle>
            <CardDescription>Messages internes rÃ©cents adressÃ©s au super administrateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de la messagerieâ€¦
              </div>
            )}

            {!isLoading && latestMessages.length === 0 && (
              <p className="text-sm text-gray-500">Aucun message rÃ©cent.</p>
            )}

            {!isLoading && latestMessages.map((message) => (
              <div key={message.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{message.subject}</p>
                    <p className="text-xs text-gray-500">De : {message.from} ({message.fromEmail})</p>
                  </div>
                  <Badge variant={message.isRead ? 'outline' : 'default'}>
                    {message.isRead ? 'Lu' : 'Non lu'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">{message.message}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                  <span>{new Date(message.timestamp).toLocaleString('fr-FR')}</span>
                  <span>PrioritÃ© : {message.priority}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#ff6600]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#ff6600]">
              <BarChart3 className="h-5 w-5" />
              SynthÃ¨se
            </CardTitle>
            <CardDescription>Vue rapide des indicateurs clÃ©s</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vendeurs en attente</p>
                <p className="text-2xl font-semibold text-gray-900">{resolvedStats.pendingVendors}</p>
              </div>
              <Badge variant="outline" className="text-[#ff6600] border-[#ff6600]">
                {resolvedStats.totalVendors} vendeurs
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-600 mb-2">Alertes par gravitÃ©</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-red-600" /> Critiques</span>
                  <span>{alerts.filter((a) => a.type === 'critical').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-yellow-600" /> Avertissements</span>
                  <span>{alerts.filter((a) => a.type === 'warning').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Info className="h-3 w-3 text-blue-600" /> Informations</span>
                  <span>{alerts.filter((a) => a.type === 'info').length}</span>
                </div>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-gray-500">
              {resolvedStats.unreadMessages} messages non lus Â· {resolvedStats.systemAlerts} alertes totales Â· {resolvedStats.totalProducts.toLocaleString()} produits actifs
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>CrÃ©er une alerte systÃ¨me</DialogTitle>
            <DialogDescription>
              Diffusez une alerte immÃ©diate aux Ã©quipes concernÃ©es.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={alertMessage}
              onChange={(event) => setAlertMessage(event.target.value)}
              placeholder="DÃ©crivez l'incident ou l'information importante Ã  partager."
              className="min-h-[140px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAlertDialog(false)} disabled={isSubmittingAlert}>
                Annuler
              </Button>
              <Button onClick={handleCreateSystemAlert} disabled={isSubmittingAlert || !alertMessage.trim()} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
                {isSubmittingAlert ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
