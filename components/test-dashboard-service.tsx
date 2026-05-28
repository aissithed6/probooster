"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardData } from '@/lib/services/dashboard-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMoney } from '@/lib/hooks/use-money'
import { 
  User, 
  Gift, 
  ShoppingBag, 
  Package, 
  MessageCircle, 
  Bell,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Star,
  Users,
  Activity
} from 'lucide-react'

export default function TestDashboardService() {
  const { user } = useAuth()
  const { data, loading, error, refreshData } = useDashboardData(user?.id || null)
  const [activeTab, setActiveTab] = useState('overview')
  const { currencyCode, formatMoney } = useMoney()

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-[#535455] flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-[#ff6600] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Non connecté</h2>
            <p className="text-gray-300">Connectez-vous pour tester le service dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-[#535455] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧪 Test du Service Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Vérification du bon fonctionnement du service dashboard avec Supabase
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <Badge variant="outline" className="text-white border-white/30">
              Utilisateur: {user.email}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30">
              Rôle: {user.role}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30">
              ID: {user.id.slice(0, 8)}...
            </Badge>
          </div>
        </div>

        {/* Bouton de rafraîchissement */}
        <div className="text-center mb-6">
          <Button 
            onClick={refreshData} 
            disabled={loading}
            className="bg-[#ff6600] hover:bg-[#ff8533] text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Chargement...' : 'Rafraîchir les données'}
          </Button>
        </div>

        {/* État de chargement */}
        {loading && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#ff6600] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white">Chargement des données du tableau de bord...</p>
            </CardContent>
          </Card>
        )}

        {/* Erreur */}
        {error && (
          <Card className="bg-red-500/20 backdrop-blur-sm border-red-500/30 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Erreur</h3>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Données du dashboard */}
        {data && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border-white/20">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-[#ff6600]">
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-white data-[state=active]:bg-[#ff6600]">
                Profil
              </TabsTrigger>
              <TabsTrigger value="data" className="text-white data-[state=active]:bg-[#ff6600]">
                Données
              </TabsTrigger>
              <TabsTrigger value="stats" className="text-white data-[state=active]:bg-[#ff6600]">
                Statistiques
              </TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Commandes */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center">
                      <ShoppingBag className="h-5 w-5 text-[#ff6600] mr-2" />
                      Commandes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{data.stats.totalOrders}</div>
                    <p className="text-gray-300 text-sm">Total des commandes</p>
                  </CardContent>
                </Card>

                {/* Produits */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center">
                      <Package className="h-5 w-5 text-[#ff6600] mr-2" />
                      Produits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{data.stats.totalProducts}</div>
                    <p className="text-gray-300 text-sm">Total des produits</p>
                  </CardContent>
                </Card>

                {/* Points */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center">
                      <Gift className="h-5 w-5 text-[#ff6600] mr-2" />
                      Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{data.stats.totalPoints}</div>
                    <p className="text-gray-300 text-sm">Points de fidélité</p>
                  </CardContent>
                </Card>

                {/* Revenus */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center">
                      <DollarSign className="h-5 w-5 text-[#ff6600] mr-2" />
                      Revenus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{data.stats.totalRevenue.toFixed(2)}</div>
                    <p className="text-gray-300 text-sm">Total des revenus</p>
                  </CardContent>
                </Card>
              </div>

              {/* Messages et notifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <MessageCircle className="h-5 w-5 text-[#ff6600] mr-2" />
                      Messages non lus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{data.unreadMessages}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="h-5 w-5 text-[#ff6600] mr-2" />
                      Chats non lus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{data.unreadChats}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Bell className="h-5 w-5 text-[#ff6600] mr-2" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{data.stats.pendingNotifications}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profil utilisateur */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="h-5 w-5 text-[#ff6600] mr-2" />
                    Profil Utilisateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.userProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-300 text-sm">Prénom</label>
                        <p className="text-white font-medium">{data.userProfile.first_name}</p>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">Nom</label>
                        <p className="text-white font-medium">{data.userProfile.last_name}</p>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">Pays</label>
                        <p className="text-white font-medium">{data.userProfile.country}</p>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">Ville</label>
                        <p className="text-white font-medium">{data.userProfile.city || 'Non spécifiée'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300">Aucun profil trouvé</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Gift className="h-5 w-5 text-[#ff6600] mr-2" />
                    Points de Fidélité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.loyaltyPoints ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-gray-300 text-sm">Solde</label>
                        <p className="text-white font-medium">{data.loyaltyPoints.points_balance}</p>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">Valeur {currencyCode}</label>
                        <p className="text-white font-medium">{formatMoney(Number(data.loyaltyPoints.fcfa_value ?? 0))}</p>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">Seuil de retrait</label>
                        <p className="text-white font-medium">{data.loyaltyPoints.withdrawal_threshold}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300">Aucun point de fidélité trouvé</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Données brutes */}
            <TabsContent value="data" className="space-y-6">
              {/* Commandes */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Commandes ({data.orders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.orders.length > 0 ? (
                    <div className="space-y-2">
                      {data.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{order.order_number}</p>
                            <p className="text-gray-300 text-sm">{order.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{order.total_amount} {order.currency}</p>
                            <p className="text-gray-300 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300">Aucune commande trouvée</p>
                  )}
                </CardContent>
              </Card>

              {/* Produits */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Produits ({data.products.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.products.length > 0 ? (
                    <div className="space-y-2">
                      {data.products.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{product.name}</p>
                            <p className="text-gray-300 text-sm">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{product.price} {product.currency}</p>
                            <p className="text-gray-300 text-sm">Stock: {product.stock_quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300">Aucun produit trouvé</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistiques détaillées */}
            <TabsContent value="stats" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="h-5 w-5 text-[#ff6600] mr-2" />
                    Statistiques Détaillées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">Commandes</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total:</span>
                          <span className="text-white font-medium">{data.stats.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Revenus:</span>
                          <span className="text-white font-medium">{data.stats.totalRevenue.toFixed(2)} FCFA</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">Produits</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total:</span>
                          <span className="text-white font-medium">{data.stats.totalProducts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Note moyenne:</span>
                          <span className="text-white font-medium">{data.stats.averageRating.toFixed(1)} ⭐</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">Points</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Solde:</span>
                          <span className="text-white font-medium">{data.stats.totalPoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Valeur:</span>
                          <span className="text-white font-medium">{data.loyaltyPoints?.fcfa_value || 0} FCFA</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">Communication</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Messages non lus:</span>
                          <span className="text-white font-medium">{data.stats.unreadMessages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Chats non lus:</span>
                          <span className="text-white font-medium">{data.stats.unreadChats}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
