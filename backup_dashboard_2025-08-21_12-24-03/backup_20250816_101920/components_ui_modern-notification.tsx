"use client"

import React, { useState, useEffect, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModernNotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  onClose?: (id: string) => void
  className?: string
}

// Contexte global pour les notifications
interface NotificationContextType {
  notifications: ModernNotificationProps[]
  addNotification: (notification: Omit<ModernNotificationProps, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Provider pour les notifications
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<ModernNotificationProps[]>([])

  const addNotification = (notification: Omit<ModernNotificationProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook pour utiliser les notifications
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
}

const notificationColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500'
}

export function ModernNotification({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className
}: ModernNotificationProps) {
  // Validation du type de notification
  const validType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info'
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-fermeture
    const autoCloseTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(autoCloseTimer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose?.(id)
    }, 300)
  }

  const Icon = notificationIcons[validType] || Info

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[9999] max-w-sm w-full transform transition-all duration-300 ease-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isLeaving ? 'translate-x-full opacity-0 scale-95' : 'scale-100',
        className
      )}
    >
      <div
        className={cn(
          'relative p-4 rounded-lg border-2 shadow-lg backdrop-blur-sm',
          notificationColors[validType]
        )}
      >
        {/* Icône de type */}
        <div className="flex items-start space-x-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconColors[validType])} />
          
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-sm opacity-90 leading-relaxed">{message}</p>
          </div>
          
          {/* Bouton fermer */}
          <button
            onClick={handleClose}
            className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Barre de progression */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20 rounded-b-lg">
          <div
            className={cn(
              'h-full transition-all duration-300 ease-linear',
              iconColors[validType]?.replace('text-', 'bg-') || 'bg-gray-500'
            )}
            style={{
              width: isLeaving ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Composant conteneur pour afficher toutes les notifications
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <>
      {notifications.map(notification => (
        <ModernNotification
          key={notification.id}
          {...notification}
          onClose={removeNotification}
        />
      ))}
    </>
  )
}
