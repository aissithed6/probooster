'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NotificationItem, UserProfile, Product, Order, CartItem, OrderStatus } from '@/app/dashboard/types';
import { v4 as uuidv4 } from 'uuid';

export const useDashboard = () => {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // États pour le tableau de bord
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Données factices pour les produits
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'T-shirt en coton bio',
      description: 'T-shirt confectionné à 100% en coton biologique, fabriqué de manière éthique.',
      price: 29.99,
      originalPrice: 39.99,
      discount: 25,
      image: '/images/products/tshirt.jpg',
      category: 'vêtements',
      stock: 42,
      rating: 4.5,
      reviewCount: 128,
      colors: ['blanc', 'noir', 'bleu'],
      sizes: ['S', 'M', 'L', 'XL'],
      tags: ['bio', 'éco-responsable', 'coton'],
      sku: 'TSHIRT-BIO-001',
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2023-06-20T14:25:00Z',
    },
    // Ajoutez plus de produits factices si nécessaire
  ];

  // Données factices pour les commandes
  const mockOrders: Order[] = [
    {
      id: 'ORD-2023-001',
      userId: user?.id || '',
      items: [
        {
          productId: '1',
          name: 'T-shirt en coton bio',
          quantity: 2,
          price: 29.99,
          image: '/images/products/tshirt.jpg',
        },
      ],
      total: 59.98,
      status: 'completed' as OrderStatus,
      shippingAddress: {
        fullName: `${userProfile?.firstName} ${userProfile?.lastName}`,
        street: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      },
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      createdAt: '2023-06-15T14:30:00Z',
      updatedAt: '2023-06-20T09:15:00Z',
    },
  ];

  // Charger les données du tableau de bord
  const loadDashboardData = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simuler un chargement de données
      // Dans une application réelle, vous feriez des appels API ici
      const mockNotifications: NotificationItem[] = [
        {
          id: uuidv4(),
          type: 'success',
          title: 'Commande passée avec succès',
          message: 'Votre commande #ORD-2023-001 a été passée avec succès.',
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'high',
          category: 'orders',
          actionUrl: '/orders/ORD-2023-001',
          actionText: 'Voir la commande'
        },
        {
          id: uuidv4(),
          type: 'info',
          title: 'Expédition en cours',
          message: 'Votre commande #ORD-2023-001 est en cours de préparation.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
          priority: 'medium',
          category: 'shipping',
          actionUrl: '/tracking/ORD-2023-001',
          actionText: 'Suivre ma commande'
        },
        {
          id: uuidv4(),
          type: 'promo',
          title: 'Réduction spéciale',
          message: 'Profitez de -20% sur une sélection de produits éco-responsables !',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          isRead: true,
          priority: 'low',
          category: 'promotions',
          actionUrl: '/promotions',
          actionText: 'Découvrir',
          promoCode: 'ECOBIO20'
        },
      ];

      // Mettre à jour les états avec les données factices
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
      
      // Mettre à jour le profil utilisateur avec des données factices si nécessaire
      const userProfileData = userProfile || {
        id: user.id,
        email: user.email || '',
        firstName: 'Prénom',
        lastName: 'Nom',
        phone: '+33 6 12 34 56 78',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        avatar: '/images/avatars/default.png',
        bio: 'Je suis passionné par la mode éco-responsable !',
        preferences: {
          newsletter: true,
          promotions: true,
          smsNotifications: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(userProfileData);

      // Mettre à jour les commandes récentes
      setRecentOrders(mockOrders);
      
      // Mettre à jour les produits recommandés
      setRecommendedProducts(mockProducts);
      
      // Mettre à jour le panier avec des exemples
      setCartItems([
        {
          id: uuidv4(),
          productId: '1',
          name: 'T-shirt en coton bio',
          price: 29.99,
          quantity: 2,
          image: '/images/products/tshirt.jpg',
          maxQuantity: 10,
        },
      ]);
      
      // Mettre à jour la liste de souhaits avec des exemples
      setWishlist(mockProducts.slice(0, 2));

    } catch (err) {
      console.error('Erreur lors du chargement des données du tableau de bord:', err);
      setError('Impossible de charger les données du tableau de bord. Veuillez réessayer.');
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement des données.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile, router, toast]);

  // Effet pour charger les données au montage
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({
        ...notif,
        isRead: true
      }))
    );
    setUnreadCount(0);
  }, []);

  // Gérer le changement d'onglet
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Gérer l'ajout au panier
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Si le produit est déjà dans le panier, mettre à jour la quantité
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.maxQuantity || 10) }
            : item
        );
      } else {
        // Sinon, ajouter un nouvel élément au panier
        return [
          ...prev,
          {
            id: uuidv4(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: Math.min(quantity, product.stock || 10),
            image: product.image || '/images/placeholder-product.jpg',
            maxQuantity: Math.min(product.stock, 10) || 10,
          },
        ];
      }
    });

    // Afficher une notification
    toast({
      title: 'Ajouté au panier',
      description: `${quantity} x ${product.name} a été ajouté à votre panier.`,
      variant: 'default',
    });
  }, [toast]);

  // Mettre à jour la quantité d'un article dans le panier
  const updateCartItemQuantity = useCallback((itemId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity || 10)) } : item
      )
    );
  }, []);

  // Supprimer un article du panier
  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Vider le panier
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Ajouter à la liste de souhaits
  const addToWishlist = useCallback((product: Product) => {
    setWishlist(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev; // Déjà dans la liste de souhaits
      }
      return [...prev, product];
    });

    toast({
      title: 'Ajouté aux favoris',
      description: `${product.name} a été ajouté à votre liste de souhaits.`,
      variant: 'default',
    });
  }, [toast]);

  // Supprimer de la liste de souhaits
  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prev => prev.filter(product => product.id !== productId));
  }, []);

  return {
    // États
    activeTab,
    notifications,
    unreadCount,
    recentOrders,
    recommendedProducts,
    cartItems,
    wishlist,
    isLoading,
    error,
    profile,
    user,
    authLoading,
    
    // Méthodes
    markAsRead,
    markAllAsRead,
    handleTabChange,
    refreshData: loadDashboardData,
    
    // Gestion du panier
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    
    // Gestion de la liste de souhaits
    addToWishlist,
    removeFromWishlist,
  };
};

export default useDashboard;
