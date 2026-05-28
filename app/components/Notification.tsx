"use client"

import { useState, useEffect } from 'react'
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react'

interface NotificationProps {
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  onClose?: () => void
}

export default function Notification({ 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const colors = {
    success: 'border-green-200 bg-green-50',
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50'
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg shadow-lg ${colors[type]} animate-fade-in`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
