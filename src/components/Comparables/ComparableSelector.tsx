"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { PropertyListing } from '@/lib/types'
import { getListings } from '@/lib/api/properties'
import dynamic from 'next/dynamic'
import ComparablePropertyCard from './ComparablePropertyCard'
import { Loader2, Info, Grid3x3, List, LayoutGrid } from 'lucide-react'
import { useSession } from 'next-auth/react'
import AuthModal from '@/components/Auth/AuthModal'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import * as Tooltip from '@radix-ui/react-tooltip'
import ComparisonView from '@/components/Item/PropertiesComparison/ComparisonView'
import ComparisonTable from '@/components/Item/PropertiesComparison/ComparisonTable'
import Image from 'next/image'

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false })

type ViewType = 'card' | 'list' | 'comparison'

interface ComparableSelectorProps {
  centerLat?: number
  centerLng?: number
  radius?: number // in km
  basePropertyMlsNumber: string // The property page the user is on
  baseProperty?: PropertyListing // The base property object
  city?: string // City filter to narrow down results
  onComparableValueChange?: (averagePrice: number | null, count: number) => void
}

const ComparableSelector = ({ 
  centerLat, 
  centerLng, 
  radius = 5, // Default 5km radius
  basePropertyMlsNumber,
  baseProperty,
  city,
  onComparableValueChange 
}: ComparableSelectorProps) => {
  const { data: session } = useSession()
  const { savedComparables, saveComparable, unsaveComparable } = useSavedComparables(basePropertyMlsNumber)
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null)
  const [selectedComparables, setSelectedComparables] = useState<Set<string>>(new Set())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [comparableValue, setComparableValue] = useState<number | null>(null)
  const [selectedCount, setSelectedCount] = useState<number>(0)
  const [viewType, setViewType] = useState<ViewType>('card')
  
  // Create stable keys to prevent infinite loops
  const savedComparablesKey = useMemo(() => {
    return savedComparables.map(sc => sc.mlsNumber).sort().join(',')
  }, [savedComparables])
  
  const propertiesKey = useMemo(() => {
    return properties.map(p => p.mlsNumber).sort().join(',')
  }, [properties])
  
  const lastProcessedKeyRef = useRef<string>('')
  const hasInitializedRef = useRef(false)

  // Initialize selected comparables from saved comparables (only once when data changes)
  useEffect(() => {
    const currentKey = `${savedComparablesKey}|${propertiesKey}`
    
    // Skip if we've already processed this combination
    if (currentKey === lastProcessedKeyRef.current) {
      return
    }
    
    // Only initialize if we have both saved comparables and properties loaded
    if (savedComparables.length > 0 && properties.length > 0) {
      const savedMlsNumbers = new Set(savedComparables.map(sc => sc.mlsNumber))
      setSelectedComparables(savedMlsNumbers)
      
      // Calculate initial average price
      const selectedProperties = properties.filter(p => savedMlsNumbers.has(p.mlsNumber))
      if (selectedProperties.length > 0) {
        const averagePrice = selectedProperties.reduce((sum, p) => sum + p.listPrice, 0) / selectedProperties.length
        setComparableValue(averagePrice)
        setSelectedCount(selectedProperties.length)
        onComparableValueChange?.(averagePrice, selectedProperties.length)
      }
      
      lastProcessedKeyRef.current = currentKey
      hasInitializedRef.current = true
    } else if (savedComparables.length === 0 && hasInitializedRef.current) {
      // Only reset if we've initialized before
      setSelectedComparables(new Set())
      setComparableValue(null)
      setSelectedCount(0)
      onComparableValueChange?.(null, 0)
      lastProcessedKeyRef.current = currentKey
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedComparablesKey, propertiesKey])

  // Load nearby properties
  useEffect(() => {
    const loadProperties = async () => {
      if (!centerLat || !centerLng) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params: Record<string, string | number> = {
          resultsPerPage: 200, // Fetch more to ensure we have enough after filtering
          pageNum: 1,
          status: "A" // Active listings
        }

        // Add city filter if available to narrow down results
        if (city) {
          params.city = city
        }

        console.log('[ComparableSelector] Fetching properties with params:', params)

        const data = await getListings(params)
        
        console.log('[ComparableSelector] Received listings:', data?.listings?.length || 0)
        
        if (data && data.listings) {
          console.log('[ComparableSelector] Filtering properties...', {
            totalListings: data.listings.length,
            centerLat,
            centerLng,
            radius,
            basePropertyMlsNumber
          })

          // Filter properties within radius and exclude base property
          const filtered = data.listings
            .filter(property => {
              // Exclude the base property
              if (property.mlsNumber === basePropertyMlsNumber) {
                console.log('[ComparableSelector] Excluding base property:', property.mlsNumber)
                return false
              }
              
              if (!property.map?.latitude || !property.map?.longitude) {
                return false
              }
              
              const distance = calculateDistance(
                centerLat,
                centerLng,
                property.map.latitude,
                property.map.longitude
              )
              
              const withinRadius = distance <= radius
              if (!withinRadius) {
                console.log('[ComparableSelector] Property outside radius:', {
                  mlsNumber: property.mlsNumber,
                  distance: distance.toFixed(2),
                  radius
                })
              }
              
              return withinRadius
            })
            // Sort by distance (closest first)
            .sort((a, b) => {
              const distA = calculateDistance(
                centerLat,
                centerLng,
                a.map!.latitude!,
                a.map!.longitude!
              )
              const distB = calculateDistance(
                centerLat,
                centerLng,
                b.map!.latitude!,
                b.map!.longitude!
              )
              return distA - distB
            })
            // Limit to 10 properties
            .slice(0, 10)
          
          console.log('[ComparableSelector] Filtered properties:', filtered.length)
          setProperties(filtered)
        } else {
          setProperties([])
        }
      } catch (error) {
        console.error('Error loading properties:', error)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [centerLat, centerLng, radius, basePropertyMlsNumber, city])

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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

  // Handle property selection for comparison
  const handlePropertySelect = async (property: PropertyListing, isSelected: boolean) => {
    if (!session) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      if (isSelected) {
        await saveComparable(property.mlsNumber)
      } else {
        await unsaveComparable(property.mlsNumber)
      }

      // Update local state
      const newSelected = new Set(selectedComparables)
      if (isSelected) {
        newSelected.add(property.mlsNumber)
      } else {
        newSelected.delete(property.mlsNumber)
      }
      setSelectedComparables(newSelected)

      // Calculate average price
      const selectedProperties = properties.filter(p => newSelected.has(p.mlsNumber))
      const averagePrice = selectedProperties.length > 0
        ? selectedProperties.reduce((sum, p) => sum + p.listPrice, 0) / selectedProperties.length
        : null
      
      setComparableValue(averagePrice)
      setSelectedCount(selectedProperties.length)
      onComparableValueChange?.(averagePrice, selectedProperties.length)
    } catch (error) {
      console.error('Error saving/unsaving comparable:', error)
      // Optionally show a toast notification here
    }
  }

  // Handle map property click
  const handleMapPropertyClick = (property: PropertyListing) => {
    setSelectedProperty(property)
  }

  // Handle map bounds change
  const handleMapBoundsChange = (_bounds: {
    north: number
    south: number
    east: number
    west: number
  }) => {
    // Could update properties based on new bounds if needed
  }

  // Get selected comparable properties for views (must be before early returns)
  const selectedComparableProperties = useMemo(() => {
    return properties.filter(p => selectedComparables.has(p.mlsNumber))
  }, [properties, selectedComparables])

  // Get selected IDs set for ComparisonView (must be before early returns)
  const selectedIds = useMemo(() => {
    return selectedComparables
  }, [selectedComparables])

  // Format price function (must be before early returns)
  const formatPrice = (price: number | null) => {
    if (price === null) return "--"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get property image for base property
  const getBasePropertyImage = (property: PropertyListing | undefined): string => {
    if (!property) return '/images/placeholder-property.jpg'
    if (property.images?.allImages && property.images.allImages.length > 0) {
      return property.images.allImages[0]
    }
    if (property.images?.imageUrl) {
      return property.images.imageUrl
    }
    return '/images/placeholder-property.jpg'
  }

  // Get full address for base property
  const getBasePropertyAddress = (property: PropertyListing | undefined): string => {
    if (!property?.address) return '—'
    const streetNumber = property.address.streetNumber || ''
    const streetName = property.address.streetName || ''
    const streetSuffix = property.address.streetSuffix || ''
    return `${streetNumber} ${streetName} ${streetSuffix}`.trim() || '—'
  }

  // Format number with commas
  const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '—'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '—'
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Check if user is authenticated
  if (!session) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Login Required
          </h3>
          <p className="text-muted-foreground mb-6">
            Please log in to use the Comparable Value feature.
          </p>
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      {/* Map View - left Side */}
      <div className="md:w-1/2 bg-gray-100 rounded-lg overflow-hidden min-h-0 flex-shrink-0">
        <GooglePropertyMap 
          properties={properties}
          selectedProperty={selectedProperty}
          onPropertySelect={handleMapPropertyClick}
          onBoundsChange={handleMapBoundsChange}
        />
      </div>

      {/* Property Listings - Right Side */}
      <div className="md:w-1/2 flex flex-col h-full">
        {/* View Selection Icons */}
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <button
            onClick={() => setViewType('card')}
            className={`p-2 rounded-lg transition-all ${
              viewType === 'card'
                ? 'bg-secondary text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            title="Card View"
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`p-2 rounded-lg transition-all ${
              viewType === 'list'
                ? 'bg-secondary text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            title="List View"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewType('comparison')}
            className={`p-2 rounded-lg transition-all ${
              viewType === 'comparison'
                ? 'bg-secondary text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            title="Comparison View"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>

        {/* Comps for Subject Property */}
        {baseProperty && (
          <div className="mb-4 flex-shrink-0">
            <h3 className="text-lg font-bold text-foreground mb-3">
              Comps for {getBasePropertyAddress(baseProperty)}
            </h3>
            <div className="flex items-center gap-4">
              {/* Property Image Thumbnail */}
              <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={getBasePropertyImage(baseProperty)}
                  alt={getBasePropertyAddress(baseProperty)}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/placeholder-property.jpg'
                  }}
                />
              </div>
              
              {/* Property Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  {baseProperty.address?.city || '—'}, {baseProperty.address?.state || '—'} {baseProperty.address?.zip || '—'} • {baseProperty.details?.propertyType || '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  • {baseProperty.details?.numBedrooms || '—'} Beds • {baseProperty.details?.numBathrooms || '—'} Baths • {baseProperty.details?.sqft ? formatNumber(baseProperty.details.sqft) : '—'} ft²
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View Content */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden mb-2 min-h-0" 
          data-listings-container
        >
          {properties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">No properties found in this area.</p>
            </div>
          ) : viewType === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-2">
              {properties.map((property) => (
                <ComparablePropertyCard
                  key={property.mlsNumber}
                  property={property}
                  basePropertyMlsNumber={basePropertyMlsNumber}
                  onSelect={handlePropertySelect}
                />
              ))}
            </div>
          ) : viewType === 'list' && baseProperty ? (
            <div className="pr-2">
              <ComparisonTable
                currentProperty={baseProperty}
                comparableProperties={selectedComparableProperties}
              />
            </div>
          ) : viewType === 'comparison' && baseProperty ? (
            <div className="pr-2">
              <ComparisonView
                subjectProperty={baseProperty}
                comparableProperties={selectedComparableProperties}
                selectedIds={selectedIds}
              />
            </div>
          ) : null}
        </div>
        
        {/* Status Bar at Bottom of Left Column - Fixed */}
        <div className="price-card-gradient rounded-lg p-4 flex-shrink-0 mt-auto">
          <div className="flex items-center gap-4">
            {/* Comparable Value */}
            <div className="flex items-baseline gap-2 flex-1">
              <span className="text-3xl font-bold text-white">
                {formatPrice(comparableValue)}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-white/90">/ Comparable Value</span>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Info className="h-4 w-4 text-white/80 cursor-help" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                        <p>
                          The comparable value is calculated as the average price of all selected properties in the nearby area.
                        </p>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
            {selectedCount > 0 && (
              <span className="text-sm text-foreground bg-white rounded-full px-4 py-1">
                {selectedCount} {selectedCount === 1 ? 'Comp Selected' : 'Comps Selected'}
              </span>
            )}
          </div>
        </div>
      </div>

      
    </div>
  )
}

export default ComparableSelector

