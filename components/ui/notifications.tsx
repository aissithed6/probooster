"use client"

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Notification } from '@/hooks/use-notifications'

interface NotificationsProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
}

const notificationColors = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-400'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-400'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-400'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-400'
  }
}

export function Notifications({ notifications, onRemove }: NotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([])

  useEffect(() => {
    setVisibleNotifications(notifications)
  }, [notifications])

  const handleRemove = (id: string) => {
    onRemove(id)
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => {
        const colors = notificationColors[notification.type]
        const Icon = notificationIcons[notification.type]

        return (
          <div
            key={notification.id}
            className={`
              ${colors.bg} ${colors.border} ${colors.text}
              border rounded-lg p-4 shadow-lg
              transform transition-all duration-300 ease-in-out
              animate-slide-in-right hover:scale-105
            `}
          >
            <div className="flex items-start space-x-3">
              <Icon className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{notification.title}</h4>
                <p className="text-sm mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => handleRemove(notification.id)}
                className={`
                  ${colors.icon} hover:${colors.text}
                  transition-colors duration-200
                  flex-shrink-0
                `}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
} 