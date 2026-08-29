'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { NavItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  unreadNotifications: number;
  cartItemsCount: number;
}

const sidebarItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '#',
    icon: 'layoutDashboard',
    tab: 'overview',
    badge: null,
  },
  {
    title: 'Commandes',
    href: '#',
    icon: 'package',
    tab: 'orders',
    badge: null,
  },
  {
    title: 'Favoris',
    href: '#',
    icon: 'heart',
    tab: 'wishlist',
    badge: null,
  },
  {
    title: 'Offres promotionnelles',
    href: '#',
    icon: 'layoutDashboard',
    tab: 'offers',
    badge: null,
  },
  {
    title: 'Notifications',
    href: '#',
    icon: 'bell',
    tab: 'notifications',
    badge: 'unreadNotifications',
  },
  {
    title: 'Panier',
    href: '#',
    icon: 'shoppingCart',
    tab: 'cart',
    badge: 'cartItemsCount',
  },
  {
    title: 'Paramètres',
    href: '#',
    icon: 'settings',
    tab: 'settings',
    badge: null,
  },
];

export function Sidebar({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  unreadNotifications,
  cartItemsCount,
}: SidebarProps) {
  const { userProfile } = useAuth();

  // Si la barre latérale est fermée, ne pas rendre le contenu
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white shadow-lg">
      {/* En-tête de la barre latérale */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center space-x-2">
          <Icons.logo className="h-8 w-8" />
          <span className="text-lg font-semibold">Mon Compte</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onClose}
        >
          <Icons.x className="h-5 w-5" />
          <span className="sr-only">Fermer le menu</span>
        </Button>
      </div>

      {/* Contenu de la barre latérale */}
      <ScrollArea className="flex-1">
        <nav className="p-2">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = Icons[item.icon as keyof typeof Icons];
              const isActive = activeTab === item.tab;
              let badgeCount = 0;

              if (item.badge === 'unreadNotifications') {
                badgeCount = unreadNotifications;
              } else if (item.badge === 'cartItemsCount') {
                badgeCount = cartItemsCount;
              }

              return (
                <li key={item.tab}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isActive && 'bg-gray-100 font-medium'
                    )}
                    onClick={() => onTabChange(item.tab)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <span>{item.title}</span>
                    {badgeCount > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        {badgeCount}
                      </span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>

      {/* Pied de page de la barre latérale */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <Icons.user className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userProfile?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userProfile?.email || 'chargement...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
