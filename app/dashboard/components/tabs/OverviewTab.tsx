'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Product } from '@/app/dashboard/types';

interface OverviewTabProps {
  recentOrders?: any[];
  recommendedProducts?: Product[];
  isLoading?: boolean;
}

export function OverviewTab({ 
  recentOrders = [], 
  recommendedProducts = [],
  isLoading = false 
}: OverviewTabProps) {
  const router = useRouter();

  // Données factices pour les cartes de statistiques
  const stats = [
    {
      title: 'Commandes en cours',
      value: '12',
      change: '+2.5%',
      changeType: 'increase',
      icon: 'package',
      description: 'Commandes en attente de traitement',
    },
    {
      title: 'Revenu total',
      value: '1,234 €',
      change: '+12.3%',
      changeType: 'increase',
      icon: 'euro',
      description: 'Ce mois-ci',
    },
    {
      title: 'Clients',
      value: '1,234',
      change: '+5.2%',
      changeType: 'increase',
      icon: 'users',
      description: 'Nouveaux clients ce mois-ci',
    },
    {
      title: 'Satisfaction',
      value: '4.8/5',
      change: '+0.3',
      changeType: 'increase',
      icon: 'star',
      description: 'Note moyenne des clients',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[140px] w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[400px] col-span-4 rounded-lg" />
          <Skeleton className="h-[400px] col-span-3 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="h-5 w-5 text-muted-foreground">
                {Icons[stat.icon as keyof typeof Icons]({ className: 'h-5 w-5' })}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.changeType === 'increase' ? (
                  <span className="text-green-600">{stat.change} par rapport au mois dernier</span>
                ) : (
                  <span className="text-red-600">{stat.change} par rapport au mois dernier</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphiques et tableaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Graphique des ventes */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aperçu des ventes</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center p-6">
                <Icons.barChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Graphique des ventes</h3>
                <p className="text-sm text-gray-500">
                  Les données de vente seront affichées ici
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dernières commandes */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dernières commandes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/orders')}>
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Commande #{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{order.amount} €</p>
                      <p 
                        className={`text-xs ${
                          order.status === 'completed' 
                            ? 'text-green-600' 
                            : order.status === 'pending' 
                            ? 'text-yellow-600' 
                            : 'text-gray-600'
                        }`}
                      >
                        {order.status === 'completed' ? 'Terminée' : 'En cours'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icons.packageOpen className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">Aucune commande récente</h3>
                <p className="text-sm text-gray-500">
                  Vos commandes récentes apparaîtront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produits recommandés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produits recommandés</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/products')}>
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recommendedProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Icons.image className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{product.price} €</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-500 line-through">
                          {product.originalPrice} €
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icons.packageSearch className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">Aucun produit recommandé</h3>
              <p className="text-sm text-gray-500">
                Découvrez nos produits populaires
              </p>
              <Button className="mt-4" onClick={() => router.push('/products')}>
                Voir les produits
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
