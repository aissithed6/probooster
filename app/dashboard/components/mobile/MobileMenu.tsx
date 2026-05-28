"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadNotifications: number;
  cartItemsCount: number;
}

/**
 * MobileMenu
 * Menu latéral destiné aux écrans mobiles pour le tableau de bord client.
 * Permet de naviguer entre les onglets, incluant "Offres promotionnelles".
 */
export function MobileMenu({ isOpen, onClose, activeTab, onTabChange, unreadNotifications, cartItemsCount }: MobileMenuProps) {
  if (!isOpen) return null;

  const items = [
    { title: 'Tableau de bord', icon: 'layoutDashboard', tab: 'overview' },
    { title: 'Commandes', icon: 'package', tab: 'orders' },
    { title: 'Favoris', icon: 'heart', tab: 'wishlist' },
    { title: 'Offres promotionnelles', icon: 'layoutDashboard', tab: 'offers' },
    { title: 'Notifications', icon: 'bell', tab: 'notifications', badge: unreadNotifications },
    { title: 'Panier', icon: 'shoppingCart', tab: 'cart', badge: cartItemsCount },
    { title: 'Paramètres', icon: 'settings', tab: 'settings' },
  ] as Array<{ title: string; icon: keyof typeof Icons; tab: string; badge?: number }>;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-medium">Menu</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icons.x className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <ScrollArea className="flex-1">
          <nav className="p-2">
            <ul className="space-y-1">
              {items.map((item) => {
                const Icon = Icons[item.icon];
                const isActive = activeTab === item.tab;
                return (
                  <li key={item.tab}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={`w-full justify-start ${isActive ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => { onTabChange(item.tab); onClose(); }}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      <span>{item.title}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
}

export default MobileMenu;
