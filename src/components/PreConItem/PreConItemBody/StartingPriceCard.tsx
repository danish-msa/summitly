"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface StartingPriceCardProps {
  property: PropertyListing
  onGetPreQualified?: () => void
  /** Price label (e.g. "Listed Price" for assignments, "Starting Price" for pre-con). Default: "Starting Price". */
  priceLabel?: string
}

const StartingPriceCard: React.FC<StartingPriceCardProps> = ({ property, onGetPreQualified, priceLabel = "Starting Price" }) => {
  const preConData = property.preCon
  const startingPrice = preConData?.startingPrice || preConData?.priceRange?.min || property.listPrice || 0

  const handleGetPreQualified = () => {
    if (onGetPreQualified) {
      onGetPreQualified()
    } else {
      // Fallback: scroll to contact section
      const contactElement = document.getElementById('contact-section')
      if (contactElement) {
        const elementPosition = contactElement.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - 100 // Offset for navbar
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }
  }

  // Check if price is 0 or not available
  const hasPrice = startingPrice && startingPrice > 0

  return (
    <Card variant="light" className="bg-white w-full shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-2">
          {/* Price Label (e.g. Starting Price / Listed Price) */}
          <span className="text-sm font-medium text-gray-600">
            {priceLabel}
          </span>
          
          {/* Price Value or Coming Soon */}
          {hasPrice ? (
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(startingPrice)}
            </span>
          ) : (
            <span className="text-3xl font-bold text-gray-900">
              Coming Soon
            </span>
          )}
          
          {/* Get Pre-Qualified Button */}
          <Button
            onClick={handleGetPreQualified}
            className="w-full font-semibold py-6 transition-colors"
            aria-label="Get Pre-Qualified"
          >
            Get Pre-Qualified
          </Button>
          
          {/* Descriptive Text */}
          <p className="text-sm font-light text-gray-500 text-center">
            Check your affordability in minutes
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default StartingPriceCard
