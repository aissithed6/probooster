"use client"

import { useState } from 'react'
import { Card, CardContent, Button } from '../ui'

export default function SimpleTest() {
  const [test, setTest] = useState('Test simple')

  return (
    <Card>
      <CardContent>
        <h1>Test Simple</h1>
        <p>{test}</p>
        <Button>Test Button</Button>
      </CardContent>
    </Card>
  )
}
