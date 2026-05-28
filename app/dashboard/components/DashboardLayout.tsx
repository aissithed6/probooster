'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/app/dashboard/hooks/useDashboard';
import { Sidebar } from './sidebar/Sidebar';
import { Header } from './header/Header';
import { OverviewTab } from './tabs/OverviewTab';
import { OrdersTab } from './tabs/OrdersTab';
import { WishlistTab } from './tabs/WishlistTab';
import { SettingsTab } from './tabs/SettingsTab';
import { OffersTab } from './tabs/OffersTab';
import { NotificationsPanel } from './panels/NotificationsPanel';
import { CartPanel } from './panels/CartPanel';
import { MobileMenu } from './mobile/MobileMenu';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Toaster } from '@/components/ui/toaster';
import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function DashboardLayout() {
  const {
    activeTab,
    handleTabChange,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    cartItems,
    wishlist,
    isLoading,
    error,
    profile,
    user,
    authLoading,
  } = useDashboard();

  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: publicSettings } = usePublicGlobalSettings();
  const isMobileNavigationEnabled = Boolean(publicSettings?.designUx?.responsive?.features?.navigationMobile ?? true);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobileNavigationEnabled) {
      setShowMobileMenu(false);
    }
  }, [isMobileNavigationEnabled]);

  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Afficher un écran de chargement pendant le chargement initial
  if (authLoading || (!user && !error)) {
    return <LoadingOverlay />;
  }

  // Afficher un message d'erreur s'il y a une erreur
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Rendu du contenu du tableau de bord
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'orders':
        return <OrdersTab />;
      case 'wishlist':
        return <WishlistTab />;
      case 'offers':
        return <OffersTab />;
      case 'settings':
        return <SettingsTab profile={profile} />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadNotifications={unreadCount}
        cartItemsCount={cartItems.length}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* En-tête */}
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onNotificationClick={() => setShowNotifications(!showNotifications)}
          onCartClick={() => setShowCart(!showCart)}
          onProfileClick={() => handleTabChange('settings')}
          unreadNotifications={unreadCount}
          cartItemsCount={cartItems.length}
          profile={profile}
          isMobile={isMobile}
          onMobileMenuClick={() => {
            if (!isMobileNavigationEnabled) return
            setShowMobileMenu(true)
          }}
        />

        {/* Contenu de l'onglet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderTabContent()
          )}
        </main>
      </div>

      {/* Panneaux latéraux */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />

      <CartPanel 
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cartItems}
      />

      {/* Menu mobile */}
      {isMobile && isMobileNavigationEnabled && (
        <MobileMenu 
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadNotifications={unreadCount}
          cartItemsCount={cartItems.length}
        />
      )}

      {/* Toaster pour les notifications */}
      <Toaster />
    </div>
  );
}
