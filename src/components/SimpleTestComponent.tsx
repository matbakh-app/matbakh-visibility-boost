import React from 'react'
import { useLocation } from 'react-router-dom'

export default function SimpleTestComponent() {
  const location = useLocation()
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Test Component
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Route: {location.pathname}
        </p>
        <p className="text-sm text-muted-foreground">
          Placeholder für Figma-Komponenten
        </p>
      </div>
    </div>
  )
}