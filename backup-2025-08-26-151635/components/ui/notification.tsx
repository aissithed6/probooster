"use client"

import React, { useState, useEffect, createContext, useContext } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'

// Types pour les notifications
export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

// Contexte pour les notifications
interface NotificationContextType {
  showNotification: (notification: Omit<NotificationProps, 'id'>) => void
  hideNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Hook pour utiliser les notifications
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    // Fallback si le contexte n'est pas disponible
    return {
      showNotification: (notification: Omit<NotificationProps, 'id'>) => {
        // Fallback vers alert si pas de contexte
        alert(`${notification.title}: ${notification.message}`)
      },
      hideNotification: () => {}
    }
  }
  return context
}

// Composant de notification individuelle
function NotificationItem({ notification, onRemove }: { 
  notification: NotificationProps
  onRemove: (id: string) => void 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-suppression après la durée spécifiée
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onRemove(notification.id), 300)
      }, notification.duration || 5000)
      return () => clearTimeout(timer)
    }
  }, [notification.duration, notification.id, onRemove])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div
      className={`
        ${getBackgroundColor()}
        ${getTextColor()}
        border rounded-lg p-4 shadow-lg max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        hover:shadow-xl
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <h4 className="text-sm font-semibold mb-1">
              {notification.title}
            </h4>
          )}
          <p className="text-sm">
            {notification.message}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onRemove(notification.id), 300)
            }}
            className="h-6 w-6 p-0 hover:bg-black/10 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant conteneur des notifications
function NotificationContainer({ notifications, onRemove }: {
  notifications: NotificationProps[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// Provider pour les notifications
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const showNotification = (notification: Omit<NotificationProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const value = {
    showNotification,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  )
}

// Composant simple pour les notifications sans contexte
export function SimpleNotification({ type, title, message, onClose }: {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onClose: () => void
}) {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info': return <Info className="h-5 w-5 text-blue-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg max-w-sm ${getBackgroundColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">{title}</h4>
          <p className="text-sm">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
