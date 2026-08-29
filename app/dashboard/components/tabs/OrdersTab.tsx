'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Order, OrderStatus } from '@/app/dashboard/types';

interface OrdersTabProps {
  orders?: Order[];
  isLoading?: boolean;
}

const statuses: { [key in OrderStatus]: { label: string; color: string } } = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Remboursée', color: 'bg-purple-100 text-purple-800' },
};

export function OrdersTab({ orders = [], isLoading = false }: OrdersTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filtrer les commandes
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const now = new Date();
    const orderDate = new Date(order.orderDate ?? order.createdAt);
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchesDate = orderDate >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = orderDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      matchesDate = orderDate >= monthAgo;
    } else if (dateFilter === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      matchesDate = orderDate >= yearAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Trier les commandes par date (du plus récent au plus ancien)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.orderDate ?? b.createdAt).getTime() - new Date(a.orderDate ?? a.createdAt).getTime()
  );

  // Formater la date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: fr });
  };

  // Obtenir le statut de la commande
  const getStatusBadge = (status: OrderStatus) => {
    const statusInfo = statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Afficher le détail d'une commande
  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher une commande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statuses).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icons.packageOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune commande trouvée</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Aucune commande ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore passé de commande.'}
            </p>
            <Button onClick={() => router.push('/products')}>
              <Icons.shoppingCart className="mr-2 h-4 w-4" />
              Faire des achats
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{formatDate(order.orderDate ?? order.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                          {item.product?.image ? (
                            <img 
                              src={item.product?.image} 
                              alt={item.product?.name ?? item.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Icons.package className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{order.total.toFixed(2)} €</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => showOrderDetails(order)}
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Détails de la commande sélectionnée (modal) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Commande #{selectedOrder.id}</CardTitle>
                  <CardDescription>
                    Passée le {formatDate(selectedOrder.orderDate ?? selectedOrder.createdAt)}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedOrder(null)}
                >
                  <Icons.x className="h-4 w-4" />
                  <span className="sr-only">Fermer</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Adresse de livraison</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p>{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    <p className="mt-2">
                      <span className="font-medium">Tél:</span> {selectedOrder.shippingAddress.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Résumé de la commande</h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Statut:</span>
                      <span>{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Méthode de paiement:</span>
                      <span className="capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statut du paiement:</span>
                      <span className="capitalize">{selectedOrder.paymentStatus}</span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div className="flex justify-between">
                        <span>Numéro de suivi:</span>
                        <span className="font-mono">{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                    {selectedOrder.deliveryDate && (
                      <div className="flex justify-between">
                        <span>Date de livraison estimée:</span>
                        <span>{formatDate(selectedOrder.deliveryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Articles commandés</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                                {item.product?.image ? (
                                  <img 
                                    src={item.product?.image} 
                                    alt={item.product?.name ?? item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                    <Icons.package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{item.product?.name ?? item.name}</p>
                                <p className="text-sm text-gray-500">
                                  {item.selectedSize && `Taille: ${item.selectedSize} `}
                                  {item.selectedColor && `Couleur: ${item.selectedColor}`}
                                </p>
                                {(() => {
                                  const warranty = String((item as any)?.product?.warranty ?? '').trim();
                                  const returnPolicy = String((item as any)?.product?.returnPolicy ?? '').trim();
                                  if (!warranty && !returnPolicy) return null;
                                  return (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {warranty && (
                                        <span>
                                          <span className="font-medium">Garantie:</span> {warranty}
                                        </span>
                                      )}
                                      {warranty && returnPolicy ? <span className="mx-2">•</span> : null}
                                      {returnPolicy && (
                                        <span>
                                          <span className="font-medium">Retours:</span> {returnPolicy}
                                        </span>
                                      )}
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.price.toFixed(2)} €</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {(item.price * item.quantity).toFixed(2)} €
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{selectedOrder.total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livraison</span>
                    <span>Gratuite</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Total</span>
                    <span>{selectedOrder.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Fermer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Logique d'impression
                  window.print();
                }}
              >
                <Icons.printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
              {selectedOrder.status === 'delivered' && (
                <Button>
                  <Icons.refreshCw className="mr-2 h-4 w-4" />
                  Commander à nouveau
                </Button>
              )}
              {selectedOrder.status === 'pending' && (
                <Button variant="destructive">
                  Annuler la commande
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
