'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, X, Trash2, HeartOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/app/dashboard/types';
import { Icons } from '@/components/icons';
import { EditableMessagesBanner } from '@/components/messages/EditableMessagesBanner';

interface WishlistTabProps {
  wishlist?: Product[];
  isLoading?: boolean;
  onAddToCart?: (product: Product) => void;
  onRemoveFromWishlist?: (productId: string) => void;
  onMoveAllToCart?: () => void;
  onClearWishlist?: () => void;
}

export function WishlistTab({
  wishlist = [],
  isLoading = false,
  onAddToCart = () => {},
  onRemoveFromWishlist = () => {},
  onMoveAllToCart = () => {},
  onClearWishlist = () => {},
}: WishlistTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filtrer les produits de la wishlist
  const filteredWishlist = wishlist.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Basculer la sélection d'un produit
  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Sélectionner tous les produits
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredWishlist.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredWishlist.map(product => product.id));
    }
  };

  // Ajouter les produits sélectionnés au panier
  const addSelectedToCart = () => {
    const selectedProducts = wishlist.filter(product => 
      selectedItems.includes(product.id)
    );
    selectedProducts.forEach(product => onAddToCart(product));
    setSelectedItems([]);
  };

  // Supprimer les produits sélectionnés de la wishlist
  const removeSelected = () => {
    selectedItems.forEach(productId => onRemoveFromWishlist(productId));
    setSelectedItems([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[320px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <HeartOff className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre liste de souhaits est vide</h2>
        <p className="text-gray-500 mb-6 max-w-md">
          Vous n'avez pas encore ajouté de produits à votre liste de souhaits. Parcourez nos articles et ajoutez vos favoris ici !
        </p>
        <Button onClick={() => router.push('/products')}>
          Parcourir les produits
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EditableMessagesBanner location="wishlist" />
      {/* En-tête avec actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher dans votre liste de souhaits..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          {selectedItems.length > 0 ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addSelectedToCart}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Ajouter au panier ({selectedItems.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={removeSelected}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer ({selectedItems.length})
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onMoveAllToCart}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Tout ajouter au panier
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearWishlist}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Vider la liste
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {filteredWishlist.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun produit ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWishlist.map((product) => (
              <Card key={product.id} className="group relative overflow-hidden">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                    onClick={() => onRemoveFromWishlist(product.id)}
                  >
                    <X className="h-4 w-4 text-gray-700" />
                    <span className="sr-only">Retirer de la liste de souhaits</span>
                  </Button>
                </div>
                
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-50">
                      <Icons.package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-base">
                          {product.price.toFixed(2)} €
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {product.originalPrice.toFixed(2)} €
                          </span>
                        )}
                        {product.discountPercentage && (
                          <Badge variant="destructive" className="ml-2">
                            -{product.discountPercentage}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span className="sr-only">Ajouter au panier</span>
                    </Button>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icons.star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.floor(product.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-1 text-gray-500">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    
                    {product.stock > 0 ? (
                      <span className="text-green-600">En stock</span>
                    ) : (
                      <span className="text-red-600">Rupture</span>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    Voir les détails
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Bannière de promotion */}
      {wishlist.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              Envie de faire des économies ?
            </h3>
            <p className="text-gray-600">
              Ajoutez {wishlist.length > 1 ? 'ces articles' : 'cet article'} à votre panier pour profiter de la livraison gratuite.
            </p>
          </div>
          <Button 
            className="mt-4 md:mt-0 whitespace-nowrap"
            onClick={onMoveAllToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Ajouter tout au panier
          </Button>
        </div>
      )}
    </div>
  );
}
