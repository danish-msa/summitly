"use client"

import React, { useState, useMemo } from 'react'
import { PropertyListing } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { Info, Check } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { DataTable, Column } from '@/components/ui/data-table'
import { getPropertyTypeUrl, getNeighborhoodUrl, getPropertyUrlFromListing } from '@/lib/utils/comparisonTableUrls'

interface ComparisonTableProps {
  currentProperty: PropertyListing
  comparableProperties: PropertyListing[]
}

interface PropertyRowData {
  property: PropertyListing
  isCurrent: boolean
  similarityScore: number | null
  distance: string
  sqft: number | null
  soldPrice: number | null
  listPrice: number
  hasBasement: boolean
  hasPool: boolean
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ 
  currentProperty, 
  comparableProperties 
}) => {
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
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

  // Calculate distance between two properties using Haversine formula
  const calculateDistance = (property1: PropertyListing, property2: PropertyListing): number | null => {
    const lat1 = property1.map?.latitude
    const lng1 = property1.map?.longitude
    const lat2 = property2.map?.latitude
    const lng2 = property2.map?.longitude

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return null
    }

    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Format distance for display
  const formatDistance = (distanceKm: number | null): string => {
    if (distanceKm === null) return '—'
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`
    }
    return `${distanceKm.toFixed(1)} km`
  }

  // Calculate or get similarity score
  const getSimilarityScore = (property: PropertyListing, currentProperty: PropertyListing): number | null => {
    if (property.mlsNumber === currentProperty.mlsNumber) {
      return 100
    }

    let score = 85
    
    if (property.details?.propertyType === currentProperty.details?.propertyType) {
      score += 5
    }
    
    const currentSqft = typeof currentProperty.details?.sqft === 'string' 
      ? parseFloat(currentProperty.details.sqft) 
      : (currentProperty.details?.sqft || 0)
    const propSqft = typeof property.details?.sqft === 'string' 
      ? parseFloat(property.details.sqft) 
      : (property.details?.sqft || 0)
    
    if (currentSqft > 0 && propSqft > 0) {
      const sqftDiff = Math.abs(currentSqft - propSqft) / currentSqft
      if (sqftDiff < 0.2) {
        score += 5
      }
    }
    
    if (property.details?.numBedrooms === currentProperty.details?.numBedrooms) {
      score += 3
    }
    
    if (property.details?.numBathrooms === currentProperty.details?.numBathrooms) {
      score += 2
    }
    
    return Math.min(100, Math.max(0, score))
  }

  // Handle sort
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  // Prepare data for DataTable
  const allProperties = [currentProperty, ...comparableProperties]
  
  const rawTableData: PropertyRowData[] = allProperties.map((property, index) => {
    const isCurrent = index === 0
    const sqft = property.details?.sqft ? (typeof property.details.sqft === 'string' ? parseFloat(property.details.sqft) : property.details.sqft) : null
    const soldPrice = property.soldPrice ? (typeof property.soldPrice === 'string' ? parseFloat(property.soldPrice) : property.soldPrice) : null
    const listPrice = property.listPrice || 0
    
    const rentalAmenities = 'rental' in property && typeof property.rental === 'object' && property.rental !== null
      ? (property.rental as { amenities?: string[] })?.amenities
      : undefined
    const hasBasement = (rentalAmenities?.some((a: string) => a.toLowerCase().includes('basement')) || 
                         property.preCon?.amenities?.some((a: string) => a.toLowerCase().includes('basement'))) || false
    const hasPool = (rentalAmenities?.some((a: string) => a.toLowerCase().includes('pool')) || 
                     property.preCon?.amenities?.some((a: string) => a.toLowerCase().includes('pool'))) || false

    return {
      property,
      isCurrent,
      similarityScore: getSimilarityScore(property, currentProperty),
      distance: formatDistance(calculateDistance(property, currentProperty)),
      sqft,
      soldPrice,
      listPrice,
      hasBasement,
      hasPool,
    }
  })

  // Sort data
  const tableData = useMemo(() => {
    if (!sortBy) return rawTableData

    return [...rawTableData].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'property':
          aValue = getFullAddress(a.property).toLowerCase()
          bValue = getFullAddress(b.property).toLowerCase()
          break
        case 'similarity':
          aValue = a.similarityScore ?? -1
          bValue = b.similarityScore ?? -1
          break
        case 'distance':
          // Extract numeric value from distance string (e.g., "1.5 km" -> 1.5)
          const aDist = a.distance.replace(/[^\d.]/g, '')
          const bDist = b.distance.replace(/[^\d.]/g, '')
          aValue = aDist ? parseFloat(aDist) : Infinity
          bValue = bDist ? parseFloat(bDist) : Infinity
          break
        case 'beds':
          aValue = a.property.details?.numBedrooms ?? -1
          bValue = b.property.details?.numBedrooms ?? -1
          break
        case 'baths':
          aValue = a.property.details?.numBathrooms ?? -1
          bValue = b.property.details?.numBathrooms ?? -1
          break
        case 'gla':
          aValue = a.sqft ?? -1
          bValue = b.sqft ?? -1
          break
        case 'lotSize':
          aValue = a.property.lot?.squareFeet ?? -1
          bValue = b.property.lot?.squareFeet ?? -1
          break
        case 'propertyType':
          aValue = (a.property.details?.propertyType || '').toLowerCase()
          bValue = (b.property.details?.propertyType || '').toLowerCase()
          break
        case 'yearBuilt':
          aValue = a.property.details?.yearBuilt ?? -1
          bValue = b.property.details?.yearBuilt ?? -1
          break
        case 'status':
          aValue = (a.property.status || '').toLowerCase()
          bValue = (b.property.status || '').toLowerCase()
          break
        case 'subdivision':
          aValue = (a.property.address?.neighborhood || '').toLowerCase()
          bValue = (b.property.address?.neighborhood || '').toLowerCase()
          break
        case 'saleDate':
          aValue = a.property.soldDate ? new Date(a.property.soldDate).getTime() : 0
          bValue = b.property.soldDate ? new Date(b.property.soldDate).getTime() : 0
          break
        case 'salePrice':
          aValue = a.soldPrice ?? -1
          bValue = b.soldPrice ?? -1
          break
        case 'salePricePerSqft':
          aValue = a.soldPrice && a.sqft ? a.soldPrice / a.sqft : -1
          bValue = b.soldPrice && b.sqft ? b.soldPrice / b.sqft : -1
          break
        case 'listDate':
          aValue = a.property.listDate ? new Date(a.property.listDate).getTime() : 0
          bValue = b.property.listDate ? new Date(b.property.listDate).getTime() : 0
          break
        case 'listPrice':
          aValue = a.listPrice ?? -1
          bValue = b.listPrice ?? -1
          break
        case 'listPricePerSqft':
          aValue = a.sqft ? a.listPrice / a.sqft : -1
          bValue = b.sqft ? b.listPrice / b.sqft : -1
          break
        case 'adom':
        case 'cdom':
          aValue = a.property.daysOnMarket ?? -1
          bValue = b.property.daysOnMarket ?? -1
          break
        case 'garageSpaces':
          aValue = a.property.details?.numGarageSpaces ?? -1
          bValue = b.property.details?.numGarageSpaces ?? -1
          break
        case 'pool':
          aValue = a.hasPool ? 1 : 0
          bValue = b.hasPool ? 1 : 0
          break
        case 'basement':
        case 'basement2':
          aValue = a.hasBasement ? 1 : 0
          bValue = b.hasBasement ? 1 : 0
          break
        default:
          return 0
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = -1
      if (bValue === null || bValue === undefined) bValue = -1

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Numeric comparison
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [rawTableData, sortBy, sortOrder, currentProperty])

  // Define columns
  const columns: Column<PropertyRowData>[] = [
    {
      key: 'property',
      header: 'Property',
      className: 'sticky left-0 z-10 bg-white whitespace-nowrap',
      render: (row) => (
        <Link href={getPropertyUrlFromListing(row.property)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {row.isCurrent ? (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary mt-1" />
          ) : (
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary shadow-lg flex items-center justify-center mt-1">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="relative w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={getPropertyImage(row.property)}
              alt={getFullAddress(row.property)}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/images/placeholder-property.jpg'
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-secondary truncate hover:text-primary transition-colors">
              {getFullAddress(row.property)}
            </p>
            <span className="text-xs text-[#6c757d]">
              {row.property.address?.city || '—'} {row.property.address?.state || '—'} {row.property.address?.zip || '—'}
            </span>
            <span className="text-xs text-[#adb5bd] block">
              Courtesy of Realty
            </span>
          </div>
        </Link>
      )
    },
    {
      key: 'similarity',
      header: (
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
      ),
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => {
        if (row.similarityScore === null) return '—'
        return (
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <span className="text-xs font-medium text-gray-700">{row.similarityScore}</span>
          </div>
        )
      }
    },
    {
      key: 'distance',
      header: 'Distance',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.distance
    },
    {
      key: 'beds',
      header: 'Beds',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.details?.numBedrooms ?? '—'
    },
    {
      key: 'baths',
      header: 'Baths',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.details?.numBathrooms ?? '—'
    },
    {
      key: 'gla',
      header: (
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
      ),
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.sqft ? formatNumber(row.sqft) : '—'
    },
    {
      key: 'laag',
      header: (
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
      ),
      className: 'whitespace-nowrap',
      render: () => '—'
    },
    {
      key: 'labg',
      header: (
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
      ),
      className: 'whitespace-nowrap',
      render: () => '—'
    },
    {
      key: 'lotSize',
      header: 'Lot Size (ft²)',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.lot?.squareFeet ? formatNumber(row.property.lot.squareFeet) : '—'
    },
    {
      key: 'propertyType',
      header: 'Property Type',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => {
        const propertyType = row.property.details?.propertyType
        if (!propertyType) return '—'
        const typeUrl = getPropertyTypeUrl(propertyType, row.property.address?.city)
        if (typeUrl) {
          return (
            <Link href={typeUrl} className="text-primary hover:text-primary/80 hover:underline transition-colors">
              {propertyType}
            </Link>
          )
        }
        return propertyType
      }
    },
    {
      key: 'yearBuilt',
      header: 'Year Built',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.details?.yearBuilt || '—'
    },
    {
      key: 'status',
      header: 'Listing Status',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.status ? (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(row.property.status)}`}>
          {row.property.status}
        </span>
      ) : '—'
    },
    {
      key: 'subdivision',
      header: 'Subdivision',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => {
        const neighborhood = row.property.address?.neighborhood
        if (!neighborhood) return '—'
        const neighborhoodUrl = getNeighborhoodUrl(neighborhood, row.property.address?.city)
        if (neighborhoodUrl) {
          return (
            <Link href={neighborhoodUrl} className="text-primary hover:text-primary/80 hover:underline transition-colors">
              {neighborhood}
            </Link>
          )
        }
        return neighborhood
      }
    },
    {
      key: 'saleDate',
      header: 'Sale Date',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => formatDate(row.property.soldDate)
    },
    {
      key: 'salePrice',
      header: 'Sale $',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.soldPrice ? formatPrice(row.soldPrice) : '—'
    },
    {
      key: 'salePricePerSqft',
      header: 'Sale $/ft²',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.soldPrice && row.sqft ? getPricePerSqft(row.soldPrice, row.sqft) : '—'
    },
    {
      key: 'listDate',
      header: 'List Date',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => formatDate(row.property.listDate)
    },
    {
      key: 'listPrice',
      header: 'List $',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => formatPrice(row.listPrice)
    },
    {
      key: 'listPricePerSqft',
      header: 'List $/ft²',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.sqft ? getPricePerSqft(row.listPrice, row.sqft) : '—'
    },
    {
      key: 'adom',
      header: 'ADOM',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.daysOnMarket ?? '—'
    },
    {
      key: 'cdom',
      header: 'CDOM',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.daysOnMarket ?? '—'
    },
    {
      key: 'currentValue',
      header: 'Current Value',
      className: 'whitespace-nowrap',
      render: () => '—'
    },
    {
      key: 'pool',
      header: 'Pool',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.hasPool ? 'Yes' : 'No'
    },
    {
      key: 'garageSpaces',
      header: 'Garage Spaces',
      className: 'whitespace-nowrap',
      sortable: true,
      render: (row) => row.property.details?.numGarageSpaces ?? '—'
    },
    {
      key: 'stories',
      header: 'Stories',
      className: 'whitespace-nowrap',
      render: () => '—'
    },
    {
      key: 'basement',
      header: 'Basement',
      className: 'whitespace-nowrap',
      render: (row) => row.hasBasement ? 'Yes' : 'No'
    },
    {
      key: 'basement2',
      header: 'Basement',
      className: 'whitespace-nowrap',
      render: (row) => row.hasBasement ? 'Yes' : 'No'
    },
    {
      key: 'distressed',
      header: 'Distressed',
      className: 'whitespace-nowrap',
      render: () => 'No'
    },
    {
      key: 'flip',
      header: 'Flip',
      className: 'whitespace-nowrap',
      render: () => 'No'
    },
    {
      key: 'condition',
      header: 'Condition',
      className: 'whitespace-nowrap',
      render: () => 'Excellent'
    },
  ]

  return (
    <div className="overflow-x-auto">
      <DataTable
        data={tableData}
        columns={columns}
        keyExtractor={(row) => row.property.mlsNumber}
        className="bg-transparent shadow-none border-0 p-0"
        getRowClassName={(row) => row.isCurrent ? 'bg-blue-50' : ''}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </div>
  )
}

export default ComparisonTable
