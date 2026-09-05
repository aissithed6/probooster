"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  MessageCircle, Users, Trash2, Search, RefreshCw, 
  TrendingUp, Globe, Filter, CheckSquare, Square,
  FileText, FileSpreadsheet, Clock, Activity, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotifications } from '@/components/ui/modern-notification'

interface Subscriber {
  id: string
  phone: string
  country_code: string
  country_name: string
  country_flag: string
  interests: string[]
  status: 'active' | 'inactive' | 'unsubscribed'
  source: string
  subscribed_at: string
}

interface Stats {
  total: number
  active: number
  inactive: number
  unsubscribed: number
  today: number
  thisWeek: number
  thisMonth: number
  byCountry: Array<{ country: string; flag: string; count: number }>
  byInterest: Array<{ interest: string; count: number }>
  bySource: Array<{ source: string; count: number }>
  recentSubscribers: Array<{ id: string; phone: string; countryFlag: string; interests: string[]; subscribedAt: string }>
}

const INTEREST_LABELS: Record<string, string> = {
  promotions: '🏷️ Promotions',
  news: '✨ Nouveautés',
  stock: '📦 Alertes Stock',
  events: '🎉 Événements',
  all: '🌟 Tout'
}

export default function WhatsAppPulseDashboard() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { addNotification } = useNotifications()

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        interest: interestFilter,
        search
      })
      const res = await fetch(`/api/super-admin/whatsapp-subscribers?${params}`)
      const json = await res.json()
      setSubscribers(json.data || [])
      setTotalPages(json.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, interestFilter, search])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/public/whatsapp-subscribe')
      const json = await res.json()
      setStats(json.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchSubscribers()
    fetchStats()
  }, [fetchSubscribers, fetchStats])

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) {
      addNotification({ type: 'warning', title: 'Sélection requise', message: 'Sélectionnez au moins un abonné', duration: 3000 })
      return
    }
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ${selectedIds.size} abonné(s) ?`)) return

    try {
      const res = await fetch('/api/super-admin/whatsapp-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) })
      })
      const json = await res.json()
      if (json.success) {
        addNotification({ type: 'success', title: 'Action réussie', message: `${selectedIds.size} abonné(s) traité(s)`, duration: 3000 })
        setSelectedIds(new Set())
        fetchSubscribers()
        fetchStats()
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Erreur', message: 'Action échouée', duration: 3000 })
    }
  }

  const handleExport = (format: string) => {
    const params = new URLSearchParams({ format, status: statusFilter, interest: interestFilter, search })
    window.open(`/api/super-admin/whatsapp-subscribers?${params}`, '_blank')
    addNotification({ type: 'success', title: 'Export démarré', message: `Format ${format.toUpperCase()}`, duration: 2000 })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === subscribers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(subscribers.map(s => s.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500 rounded-xl">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">WhatsApp Pulse</h2>
            <p className="text-sm text-gray-500">Gestion des abonnés newsletter</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchSubscribers(); fetchStats() }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <FileText className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Total</p>
                <p className="text-3xl font-bold text-green-700">{stats?.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Actifs</p>
                <p className="text-3xl font-bold text-blue-700">{stats?.active || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Aujourd&apos;hui</p>
                <p className="text-3xl font-bold text-orange-700">{stats?.today || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Ce mois</p>
                <p className="text-3xl font-bold text-purple-700">{stats?.thisMonth || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> Par pays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.byCountry?.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{c.flag} {c.country}</span>
                  <Badge variant="secondary">{c.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Par intérêt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.byInterest?.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{INTEREST_LABELS[item.interest] || item.interest}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedIds.size === subscribers.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </Button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-gray-500">{selectedIds.size} sélectionné(s)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Rechercher..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="unsubscribed">Désabonnés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={interestFilter} onValueChange={setInterestFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous intérêts</SelectItem>
                  <SelectItem value="promotions">Promotions</SelectItem>
                  <SelectItem value="news">Nouveautés</SelectItem>
                  <SelectItem value="stock">Alertes Stock</SelectItem>
                  <SelectItem value="events">Événements</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')} disabled={selectedIds.size === 0}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun abonné trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="p-3 text-left w-10"></th>
                    <th className="p-3 text-left">Téléphone</th>
                    <th className="p-3 text-left">Intérêts</th>
                    <th className="p-3 text-left">Statut</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={() => toggleSelect(sub.id)}>
                          {selectedIds.has(sub.id) ? <CheckSquare className="h-4 w-4 text-green-500" /> : <Square className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{sub.country_flag} {sub.phone}</span>
                        <span className="text-gray-400 ml-2 text-xs">{sub.country_name}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {sub.interests.map((int, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{INTEREST_LABELS[int] || int}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={
                          sub.status === 'active' ? 'bg-green-500' :
                          sub.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                        }>{sub.status}</Badge>
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Date(sub.subscribed_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
              <span className="flex items-center px-3 text-sm text-gray-500">Page {page}/{totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.recentSubscribers?.map((sub, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span>{sub.countryFlag}</span>
                  <span className="font-medium text-sm">{sub.phone}</span>
                </div>
                <span className="text-xs text-gray-500">{new Date(sub.subscribedAt).toLocaleString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}