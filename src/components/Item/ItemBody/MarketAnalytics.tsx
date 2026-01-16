"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { MarketAnalytics as MarketAnalyticsComponent } from './MarketAnalytics/MarketAnalytics'

interface MarketAnalyticsProps {
  property: PropertyListing
  rawProperty?: SinglePropertyListingResponse | null
  isPreCon?: boolean
  isRent?: boolean
}

const MarketAnalyticsWrapper: React.FC<MarketAnalyticsProps> = ({ property, rawProperty: _rawProperty, isPreCon = false, isRent = false }) => {
  // Get property address
  const propertyAddress = property.address?.location || 
    `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}, ${property.address?.city || ''}, ${property.address?.state || ''} ${property.address?.zip || ''}`.trim()

  // Get property class
  const propertyClass = property.details?.propertyType || 'Residential'

  // Get coordinates
  const latitude = property.map?.latitude || null
  const longitude = property.map?.longitude || null

  // Get city
  const city = property.address?.city || undefined

  // Don't render if it's a rental or pre-construction
  if (isRent || isPreCon) {
    return null
  }

  return (
    <div className="w-full">
      <MarketAnalyticsComponent
        propertyAddress={propertyAddress}
        propertyClass={propertyClass}
        latitude={latitude || undefined}
        longitude={longitude || undefined}
        city={city}
      />
    </div>
  )
}

export default MarketAnalyticsWrapper
