"use client"

import { useState } from 'react'
import { Card, Button } from '../ui'

// Test des imports UI
export default function TestUIComponent() {
  const [test, setTest] = useState('UI Test réussi')

  return (
    <Card>
      <h1>Test UI Component</h1>
      <p>{test}</p>
      <Button>Clic moi</Button>
    </Card>
  )
}
