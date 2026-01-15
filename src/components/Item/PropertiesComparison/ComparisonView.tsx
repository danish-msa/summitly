"use client"

import React, { useMemo } from 'react'
import { ArrowRight, Info } from 'lucide-react'
import { PropertyListing } from '@/lib/types'
import PropertyImage from './PropertyImage'
import StatusBadge from './StatusBadge'
import InfoTooltip from './InfoTooltip'
import { Button } from '@/components/ui/button'

interface ComparisonViewProps {
  subjectProperty: PropertyListing
  comparableProperties: PropertyListing[]
  selectedIds: Set<string>
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  subjectProperty,
  comparableProperties,
  selectedIds,
}) => {
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

  const formatPricePerSqft = (price: number | string | null | undefined, sqft: number | string | null | undefined): string => {
    if (!price || !sqft) return '—'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    const numSqft = typeof sqft === 'string' ? parseFloat(sqft) : sqft
    if (isNaN(numPrice) || isNaN(numSqft) || numSqft === 0) return '—'
    return `$${Math.round(numPrice / numSqft)}/ft²`
  }

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '—'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '—'
      return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    } catch {
      return '—'
    }
  }

  const getPropertyImage = (property: PropertyListing): string => {
    if (property.images?.allImages && property.images.allImages.length > 0) {
      return property.images.allImages[0]
    }
    if (property.images?.imageUrl) {
      return property.images.imageUrl
    }
    return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop'
  }

  const getFullAddress = (property: PropertyListing): string => {
    const streetNumber = property.address?.streetNumber || ''
    const streetName = property.address?.streetName || ''
    const streetSuffix = property.address?.streetSuffix || ''
    return `${streetNumber} ${streetName} ${streetSuffix}`.trim() || '—'
  }

  const getLocation = (property: PropertyListing): string => {
    const city = property.address?.city || ''
    const state = property.address?.state || ''
    const zip = property.address?.zip || ''
    return `${city}${city && state ? ' , ' : ''}${state} ${zip}`.trim()
  }

  // Get selected comparable properties
  const selectedComparables = comparableProperties.filter(p => selectedIds.has(p.mlsNumber))
  const allProperties = [subjectProperty, ...selectedComparables]

  // Extended property type for dynamic fields
  type ExtendedPropertyListing = PropertyListing & {
    currentValue?: number | string
    marketPrice?: number | string
    hpiAdjustment?: number | string
    hcAdjustment?: number | string
    yourAdjustment?: number | string
  }

  // Calculate comparable value (average of selected comparables)
  const comparableValue = useMemo(() => {
    if (selectedComparables.length === 0) return null
    const total = selectedComparables.reduce((sum, p) => {
      const extendedP = p as ExtendedPropertyListing
      const price = extendedP.currentValue || p.listPrice || 0
      return sum + (typeof price === 'string' ? parseFloat(price) : price)
    }, 0)
    return total / selectedComparables.length
  }, [selectedComparables])

  const comparisonRows = [
    { label: 'Current Value', getValue: (p: PropertyListing) => formatPrice((p as ExtendedPropertyListing).currentValue || p.listPrice) },
    { label: 'Current Value/ft²', getValue: (p: PropertyListing) => formatPricePerSqft((p as ExtendedPropertyListing).currentValue || p.listPrice, p.details?.sqft) },
    { label: 'Listing Status', getValue: (p: PropertyListing) => p.status, isStatus: true },
    { label: 'List Date', getValue: (p: PropertyListing) => formatDate(p.listDate) },
    { label: 'List Price', getValue: (p: PropertyListing) => formatPrice(p.listPrice) },
    { label: 'List Price/ft²', getValue: (p: PropertyListing) => formatPricePerSqft(p.listPrice, p.details?.sqft) },
    { label: 'Sale Date', getValue: (p: PropertyListing) => formatDate(p.soldDate) },
    { label: 'Sale Price', getValue: (p: PropertyListing) => formatPrice(p.soldPrice) },
    { label: 'Sale Price/ft²', getValue: (p: PropertyListing) => formatPricePerSqft(p.soldPrice, p.details?.sqft) },
    { label: 'Market Price', getValue: (p: PropertyListing) => formatPrice((p as ExtendedPropertyListing).marketPrice || p.listPrice) },
    { label: 'HPI Adjustment', getValue: (p: PropertyListing) => {
      const extendedP = p as ExtendedPropertyListing
      return extendedP.hpiAdjustment ? formatPrice(extendedP.hpiAdjustment) : '—'
    }, hasTooltip: true, tooltip: 'House Price Index Adjustment' },
    { label: 'HC Adjustment', getValue: (p: PropertyListing) => {
      const extendedP = p as ExtendedPropertyListing
      return extendedP.hcAdjustment ? formatPrice(extendedP.hcAdjustment) : '—'
    }, hasTooltip: true, tooltip: 'Housing Characteristic Adjustment' },
    { label: 'Your Adjustment', getValue: (p: PropertyListing) => {
      const extendedP = p as ExtendedPropertyListing
      return extendedP.yourAdjustment ? formatPrice(extendedP.yourAdjustment) : '—'
    }, hasTooltip: true, tooltip: 'Custom adjustment value' },
  ]

  return (
    <div className="relative h-[30rem]">
      <div className="h-full overflow-x-auto overflow-y-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {allProperties.map((property, index) => {
            const isSubject = index === 0

            return (
              <div 
                key={property.mlsNumber} 
                className={`bg-white rounded-xl overflow-hidden flex-shrink-0 w-80 ${isSubject ? 'sticky left-0 z-10 border shadow-sm border-muted' : ''}`}
              >
              {/* Property Image */}
              <div className="relative w-full h-40">
                <PropertyImage
                  src={getPropertyImage(property)}
                  alt={getFullAddress(property)}
                  isSelected={!isSubject}
                  showCheckmark={!isSubject}
                  className="w-full h-full rounded-t-lg"
                />
              </div>

              {/* Action Buttons */}
              <div className="px-4 pt-4 flex gap-2">
                {isSubject ? (
                  <>
                    <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-primary-foreground text-xs px-3 rounded-lg">
                      Subject Property
                    </Button>
                    <Button size="sm" className="bg-muted text-muted-foreground text-xs px-3 rounded-lg">
                      Transaction History
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="bg-muted text-muted-foreground text-xs px-3 rounded-lg">
                    Transaction History
                  </Button>
                )}
              </div>

              {/* Address Information */}
              <div className="px-4 pt-3 pb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {getFullAddress(property)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getLocation(property)}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Courtesy of Realty
                </p>
              </div>

              {/* Property Data Section */}
              <div className="border-t border-border">
                {comparisonRows.map((row, rowIndex) => (
                  <div 
                    key={row.label}
                    className={`flex items-center justify-between px-4 py-3 border-b border-muted/40 last:border-b-0 `}
                  >
                    {isSubject && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {row.label}
                        {row.hasTooltip && row.tooltip && (
                          <InfoTooltip content={row.tooltip} />
                        )}
                      </div>
                    )}
                    <div className={`text-sm text-foreground font-medium ${isSubject ? 'text-right' : 'w-full text-left'}`}>
                      {row.isStatus && property.status ? (
                        <StatusBadge status={property.status} />
                      ) : (
                        row.getValue(property)
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* View Transaction History Link */}
              <div className="px-4 py-4 border-t border-border">
                <button className="flex items-center gap-1.5 text-sm text-secondary hover:text-secondary/80 transition-colors w-full justify-center">
                  View Transaction History
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ComparisonView
