"use client"

import { useState, useEffect } from 'react'
import Notification from './Notification'

interface NotificationData {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
}

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  useEffect(() => {
    const handleShowNotification = (event: CustomEvent) => {
      const { type, title, message } = event.detail
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        type,
        title,
        message
      }
      
      setNotifications(prev => [...prev, newNotification])
    }

    // Écouter les événements de notification
    window.addEventListener('showNotification', handleShowNotification as EventListener)

    return () => {
      window.removeEventListener('showNotification', handleShowNotification as EventListener)
    }
  }, [])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  return (
    <>
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  )
}
