'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserProfile } from '@/app/dashboard/types';
import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext'

interface HeaderProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  unreadNotifications: number;
  cartItemsCount: number;
  profile: UserProfile | null;
  isMobile: boolean;
  onMobileMenuClick: () => void;
}

export function Header({
  onMenuClick,
  onNotificationClick,
  onCartClick,
  onProfileClick,
  unreadNotifications,
  cartItemsCount,
  profile,
  isMobile,
  onMobileMenuClick,
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: publicSettings } = usePublicGlobalSettings()

  const resolvedSiteName = useMemo(() => {
    const name = (publicSettings?.siteConfig?.siteName ?? 'Probooster').toString().trim()
    return name || 'Probooster'
  }, [publicSettings?.siteConfig?.siteName])

  const resolvedLogoSrc = useMemo(() => {
    const candidate = (publicSettings?.siteConfig?.logoUrl ?? '').toString().trim()
    return candidate || ''
  }, [publicSettings?.siteConfig?.logoUrl])

  const canUseNextImage = useMemo(() => resolvedLogoSrc.startsWith('/'), [resolvedLogoSrc])

  // Gérer le défilement de la page pour l'effet de style de l'en-tête
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gérer la soumission de la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    // Ici, vous ajouterez la logique de déconnexion
    console.log('Déconnexion');
    router.push('/login');
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 transition-shadow ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      {/* Bouton du menu pour mobile */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>

        {/* Logo ou titre */}
        <div className="hidden md:flex items-center gap-3">
          {resolvedLogoSrc ? (
            canUseNextImage ? (
              // On évite next/image ici pour ne pas ajouter de config images.domains; dashboard reste simple.
              <img src={resolvedLogoSrc} alt={`${resolvedSiteName} Logo`} className="h-8 w-auto object-contain" />
            ) : (
              <img src={resolvedLogoSrc} alt={`${resolvedSiteName} Logo`} className="h-8 w-auto object-contain" />
            )
          ) : null}
          <h1 className="text-xl font-bold">{resolvedSiteName}</h1>
        </div>
      </div>

      {/* Barre de recherche (visible uniquement sur les grands écrans) */}
      <form 
        className="hidden md:flex flex-1 max-w-2xl mx-4" 
        onSubmit={handleSearch}
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher des produits, commandes..."
            className="w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Actions de l'en-tête */}
      <div className="flex items-center space-x-2">
        {/* Bouton de recherche pour mobile */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5" />
          <span className="sr-only">Rechercher</span>
        </Button>

        {/* Bouton des notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={onNotificationClick}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Bouton du panier */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={onCartClick}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
              {cartItemsCount > 9 ? '9+' : cartItemsCount}
            </span>
          )}
          <span className="sr-only">Panier</span>
        </Button>

        {/* Menu déroulant du profil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar} alt={profile?.name || 'Utilisateur'} />
                <AvatarFallback>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Ouvrir le menu du profil</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.name || 'Utilisateur'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email || 'chargement...'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
