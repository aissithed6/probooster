import { useState, useCallback } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'success',
      title: title || 'Succès',
      message,
      duration: 4000
    })
  }, [addNotification])

  const showError = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'error',
      title: title || 'Erreur',
      message,
      duration: 6000
    })
  }, [addNotification])

  const showInfo = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'info',
      title: title || 'Information',
      message,
      duration: 4000
    })
  }, [addNotification])

  const showWarning = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'warning',
      title: title || 'Attention',
      message,
      duration: 5000
    })
  }, [addNotification])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll
  }
}
