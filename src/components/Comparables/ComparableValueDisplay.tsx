"use client"

import React from 'react'
import { Award } from 'lucide-react'

interface ComparableValueDisplayProps {
  averagePrice: number | null
  propertyCount: number
}

const ComparableValueDisplay = ({ averagePrice, propertyCount }: ComparableValueDisplayProps) => {
  const formatPrice = (price: number | null) => {
    if (price === null) return "--"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-secondary" style={{ boxShadow: '0px 40px 80px rgba(0, 0, 0, .2)' }}>
      {/* Main section */}
      <div className="px-8 pb-6 pt-10 rounded-t-3xl">
        {/* Price and Icon Row */}
        <div className="flex items-start justify-center gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            {formatPrice(averagePrice)}
          </h1>
          <Award 
            className="mt-1 h-12 w-12 text-foreground opacity-80"
            strokeWidth={1.5}
          />
        </div>

        {/* Label */}
        <p className="mt-2 text-center text-sm font-medium tracking-wide text-muted-foreground">
          Comparable Value
        </p>

        {/* Property Count */}
        {propertyCount > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Based on {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
          </p>
        )}
      </div>
    </div>
  )
}

export default ComparableValueDisplay

