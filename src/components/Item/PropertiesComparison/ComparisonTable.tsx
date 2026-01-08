"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { Info } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { getPropertyTypeUrl, getNeighborhoodUrl, getPropertyUrlFromListing } from '@/lib/utils/comparisonTableUrls'

interface ComparisonTableProps {
  currentProperty: PropertyListing
  comparableProperties: PropertyListing[]
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ 
  currentProperty, 
  comparableProperties 
}) => {
  // Format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (!price) return '—'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice)
  }

  // Format number with commas
  const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '—'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '—'
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Format date
  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '—'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '—'
      return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    } catch {
      return '—'
    }
  }

  // Calculate price per square foot
  const getPricePerSqft = (price: number | string, sqft: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    const numSqft = typeof sqft === 'string' ? parseFloat(String(sqft)) : Number(sqft)
    if (isNaN(numPrice) || isNaN(numSqft) || numSqft === 0) return '—'
    const perSqft = numPrice / numSqft
    return `$${Math.round(perSqft)}/ft²`
  }

  // Get property image
  const getPropertyImage = (property: PropertyListing): string => {
    if (property.images?.allImages && property.images.allImages.length > 0) {
      return property.images.allImages[0]
    }
    if (property.images?.imageUrl) {
      return property.images.imageUrl
    }
    return '/images/placeholder-property.jpg'
  }

  // Get full address (only street number, name, and suffix)
  const getFullAddress = (property: PropertyListing): string => {
    const streetNumber = property.address?.streetNumber || ''
    const streetName = property.address?.streetName || ''
    const streetSuffix = property.address?.streetSuffix || ''
    return `${streetNumber} ${streetName} ${streetSuffix}`.trim() || '—'
  }

  // Get listing status badge color
  const getStatusBadgeColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower.includes('active') || statusLower === 'a') {
      return 'bg-green-100 text-green-800'
    }
    if (statusLower.includes('sold') || statusLower === 's') {
      return 'bg-blue-100 text-blue-800'
    }
    if (statusLower.includes('pending') || statusLower === 'p') {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  // All properties including current
  const allProperties = [currentProperty, ...comparableProperties]

  return (
    <div className="overflow-x-auto pl-10">
      <table className="w-full border-collapse min-w-max bg-white">
        <thead>
          <tr className="border-b border-gray-200">
            {/* Table 1 columns */}
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap sticky left-0 z-10 bg-white">Property</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">
              <div className="flex items-center gap-1">
                Similarity
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                        <p>Similarity score based on property features</p>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Distance</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Beds</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Baths</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">
              <div className="flex items-center gap-1">
                GLA (ft²)
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                        <p>Gross Living Area in square feet</p>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">
              <div className="flex items-center gap-1">
                LAAG (ft²)
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                        <p>Living Area Above Grade in square feet</p>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">
              <div className="flex items-center gap-1">
                LABG (ft²)
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                        <p>Living Area Below Grade in square feet</p>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Lot Size (ft²)</th>
            {/* Table 2 columns */}
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Property Type</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Year Built</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Listing Status</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Subdivision</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Sale Date</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Sale $</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Sale $/ft²</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">List Date</th>
            {/* Table 3 columns */}
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">List $</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">List $/ft²</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">ADOM</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">CDOM</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Current Value</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Pool</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Garage Spaces</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Stories</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Basement</th>
            {/* Table 4 columns */}
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Basement</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Distressed</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Flip</th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 whitespace-nowrap">Condition</th>
          </tr>
        </thead>
        <tbody>
          {allProperties.map((property, index) => {
            const isCurrent = index === 0
            const sqft = property.details?.sqft ? (typeof property.details.sqft === 'string' ? parseFloat(property.details.sqft) : property.details.sqft) : null
            const soldPrice = property.soldPrice ? (typeof property.soldPrice === 'string' ? parseFloat(property.soldPrice) : property.soldPrice) : null
            const listPrice = property.listPrice || 0
            // Check for basement in amenities (rental properties may have amenities, but it's not in the type definition)
            const rentalAmenities = 'rental' in property && typeof property.rental === 'object' && property.rental !== null
              ? (property.rental as { amenities?: string[] })?.amenities
              : undefined
            const hasBasement = (rentalAmenities?.some((a: string) => a.toLowerCase().includes('basement')) || 
                                 property.preCon?.amenities?.some((a: string) => a.toLowerCase().includes('basement'))) || false
            
            return (
              <tr key={property.mlsNumber} className={`border-b border-gray-100 ${isCurrent ? 'bg-blue-50' : ''}`}>
                {/* Table 1 data */}
                <td className={`py-2 px-3 whitespace-nowrap sticky left-0 z-10 border-r border-gray-200 ${isCurrent ? 'bg-blue-50' : 'bg-white'}`}>
                  <Link href={getPropertyUrlFromListing(property)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={getPropertyImage(property)}
                        alt={getFullAddress(property)}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder-property.jpg'
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate hover:text-primary transition-colors">
                        {getFullAddress(property)}
                      </p>
                      <span className="text-xs text-gray-500">
                        {property.address?.city || '—'} {property.address?.state || '—'} {property.address?.zip || '—'}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">—</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">—</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {property.details?.numBedrooms ?? '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {property.details?.numBathrooms ?? '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {sqft ? formatNumber(sqft) : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">—</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">—</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {property.lot?.squareFeet ? formatNumber(property.lot.squareFeet) : '—'}
                </td>
                {/* Table 2 data */}
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {(() => {
                    const propertyType = property.details?.propertyType
                    if (!propertyType) return '—'
                    
                    const typeUrl = getPropertyTypeUrl(propertyType, property.address?.city)
                    if (typeUrl) {
                      return (
                        <Link 
                          href={typeUrl}
                          className="text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {propertyType}
                        </Link>
                      )
                    }
                    return propertyType
                  })()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {property.details?.yearBuilt || '—'}
                </td>
                <td className="py-3 px-4 text-sm whitespace-nowrap">
                  {property.status ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(property.status)}`}>
                      {property.status}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {(() => {
                    const neighborhood = property.address?.neighborhood
                    if (!neighborhood) return '—'
                    
                    const neighborhoodUrl = getNeighborhoodUrl(neighborhood, property.address?.city)
                    if (neighborhoodUrl) {
                      return (
                        <Link 
                          href={neighborhoodUrl}
                          className="text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {neighborhood}
                        </Link>
                      )
                    }
                    return neighborhood
                  })()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {formatDate(property.soldDate)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {soldPrice ? formatPrice(soldPrice) : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {soldPrice && sqft ? getPricePerSqft(soldPrice, sqft) : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {formatDate(property.listDate)}
                </td>
                {/* Table 3 data */}
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {formatPrice(listPrice)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {sqft ? getPricePerSqft(listPrice, sqft) : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {property.daysOnMarket ?? '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {property.daysOnMarket ?? '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">—</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {(() => {
                    const rentalAmenities = 'rental' in property && typeof property.rental === 'object' && property.rental !== null
                      ? (property.rental as { amenities?: string[] })?.amenities
                      : undefined
                    return (rentalAmenities?.some((a: string) => a.toLowerCase().includes('pool')) || 
                            property.preCon?.amenities?.some((a: string) => a.toLowerCase().includes('pool'))) ? 'Yes' : 'No'
                  })()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {property.details?.numGarageSpaces ?? '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">—</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {hasBasement ? 'Yes' : 'No'}
                </td>
                {/* Table 4 data */}
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {hasBasement ? 'Yes' : 'No'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">No</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">No</td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">Excellent</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ComparisonTable

