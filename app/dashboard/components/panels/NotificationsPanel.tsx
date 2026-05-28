'use client';

import { X, Bell, Check, Clock, AlertTriangle, Info, Gift, MessageSquare, ShoppingCart, Package, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { NotificationItem } from '@/app/dashboard/types';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'promotion':
      return <Gift className="h-5 w-5 text-purple-500" />;
    case 'message':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'order':
      return <Package className="h-5 w-5 text-amber-500" />;
    case 'payment':
      return <CreditCard className="h-5 w-5 text-emerald-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsPanelProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white px-4 py-4 sm:px-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </h2>
                  <div className="ml-3 flex items-center
                  ">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                      <span className="sr-only">Fermer le panneau</span>
                    </Button>
                  </div>
                </div>
                
                {notifications.length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={onMarkAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Tout marquer comme lu
                    </Button>
                  </div>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Aucune notification
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Vous n'avez pas encore de notifications
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-120px)]">
                  <ul className="divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <li key={notification.id} className="relative">
                        <div 
                          className={`relative px-4 py-4 hover:bg-gray-50 ${
                            notification.isRead ? 'bg-white' : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <div className="flex-shrink-0 self-center flex">
                                  <button
                                    type="button"
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <span className="sr-only">Marquer comme lu</span>
                                    {notification.isRead ? (
                                      <Check className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {notification.message}
                              </p>
                              <div className="mt-2 flex items-center text-xs text-gray-500">
                                <Clock className="mr-1 h-3 w-3 flex-shrink-0 text-gray-400" />
                                <span>
                                  {new Date(notification.timestamp).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {notification.priority === 'high' && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                    Important
                                  </span>
                                )}
                              </div>
                              {notification.actionUrl && (
                                <div className="mt-2">
                                  <a
                                    href={notification.actionUrl}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarkAsRead(notification.id);
                                    }}
                                  >
                                    {notification.actionText || 'Voir les détails'}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
            
            <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Logique pour afficher toutes les notifications
                    console.log('Voir toutes les notifications');
                  }}
                >
                  Voir toutes les notifications
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Logique pour les paramètres de notification
                    console.log('Paramètres de notification');
                  }}
                >
                  Paramètres
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
