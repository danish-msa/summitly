"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { PropertyListing } from '@/lib/types'
import { getListings } from '@/lib/api/properties'
import dynamic from 'next/dynamic'
import ComparablePropertyCard from './ComparablePropertyCard'
import { Loader2, Info } from 'lucide-react'
import { useSession } from 'next-auth/react'
import AuthModal from '@/components/Auth/AuthModal'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import * as Tooltip from '@radix-ui/react-tooltip'

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false })

interface ComparableSelectorProps {
  centerLat?: number
  centerLng?: number
  radius?: number // in km
  onComparableValueChange?: (averagePrice: number | null, count: number) => void
}

const ComparableSelector = ({ 
  centerLat, 
  centerLng, 
  radius = 5, // Default 5km radius
  onComparableValueChange 
}: ComparableSelectorProps) => {
  const { data: session } = useSession()
  const { savedComparables } = useSavedComparables()
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null)
  const [selectedComparables, setSelectedComparables] = useState<Set<string>>(new Set())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [comparableValue, setComparableValue] = useState<number | null>(null)
  const [selectedCount, setSelectedCount] = useState<number>(0)
  
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
          resultsPerPage: 50,
          pageNum: 1,
          status: "A" // Active listings
        }

        const data = await getListings(params)
        
        if (data && data.listings) {
          // Filter properties within radius
          const filtered = data.listings.filter(property => {
            if (!property.map?.latitude || !property.map?.longitude) return false
            
            const distance = calculateDistance(
              centerLat,
              centerLng,
              property.map.latitude,
              property.map.longitude
            )
            
            return distance <= radius
          })
          
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
  }, [centerLat, centerLng, radius])

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
  const handlePropertySelect = (property: PropertyListing, isSelected: boolean) => {
    if (!session) {
      setIsAuthModalOpen(true)
      return
    }

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
  }

  // Handle map property click
  const handleMapPropertyClick = (property: PropertyListing) => {
    setSelectedProperty(property)
  }

  // Handle map bounds change
  const handleMapBoundsChange = (bounds: {
    north: number
    south: number
    east: number
    west: number
  }) => {
    // Could update properties based on new bounds if needed
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
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-0">
      {/* Property Listings - Left Side */}
      <div className="md:w-1/2 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto mb-2 min-h-0" data-listings-container>
          {properties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">No properties found in this area.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.map((property) => (
                <ComparablePropertyCard
                  key={property.mlsNumber}
                  property={property}
                  onSelect={handlePropertySelect}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Status Bar at Bottom of Left Column */}
        <div className="price-card-gradient rounded-lg p-4 mt-auto">
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

      {/* Map View - Right Side */}
      <div className="md:w-1/2 bg-gray-100 rounded-lg overflow-hidden min-h-0 flex-shrink-0">
        <GooglePropertyMap 
          properties={properties}
          selectedProperty={selectedProperty}
          onPropertySelect={handleMapPropertyClick}
          onBoundsChange={handleMapBoundsChange}
        />
      </div>
    </div>
  )
}

export default ComparableSelector

