"use client"

import { useState } from 'react'

// Test simple pour vérifier les imports
export default function TestComponent() {
  const [test, setTest] = useState('Test réussi')

  return (
    <div>
      <h1>Test Component</h1>
      <p>{test}</p>
    </div>
  )
}
