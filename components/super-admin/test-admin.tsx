"use client"

import { useState } from 'react'
import { Card, CardContent, Button } from '../../ui'

export default function TestComponent() {
  const [test, setTest] = useState('Test admin marketing')

  return (
    <Card>
      <CardContent>
        <h1>Test Admin Marketing Component</h1>
        <p>{test}</p>
        <Button>Test Button</Button>
      </CardContent>
    </Card>
  )
}
