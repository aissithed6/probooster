"use client"

import { useState } from 'react'
import { useNotifications } from '../hooks/use-notifications'

// Test des hooks
export default function TestHooksComponent() {
  const { addNotification } = useNotifications()
  const [test, setTest] = useState('Hooks Test réussi')

  const handleClick = () => {
    addNotification({
      type: 'success',
      title: 'Test',
      message: 'Notification fonctionne !'
    })
  }

  return (
    <div>
      <h1>Test Hooks Component</h1>
      <p>{test}</p>
      <button onClick={handleClick}>Test Notification</button>
    </div>
  )
}
