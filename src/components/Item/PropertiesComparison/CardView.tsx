"use client"

import React, { useState } from 'react'
import { PropertyListing } from '@/lib/types'
import ComparablePropertyCard from '@/components/Comparables/ComparablePropertyCard'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import dynamic from 'next/dynamic'

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false })

interface CardViewProps {
  currentProperty: PropertyListing
  comparableProperties: PropertyListing[]
}

const CardView: React.FC<CardViewProps> = ({
  currentProperty,
  comparableProperties
}) => {
  const { savedComparables: _savedComparables } = useSavedComparables(currentProperty.mlsNumber)
  // const savedMlsNumbers = new Set(savedComparables.map(sc => sc.mlsNumber))
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null)

  // Combine all properties for the map
  const allProperties = [currentProperty, ...comparableProperties]

  const handlePropertySelect = async (_property: PropertyListing, _isSelected: boolean) => {
    // The ComparablePropertyCard handles the save/unsave logic internally
    // This is just a pass-through for consistency
  }

  // Handle map property click
  const handleMapPropertyClick = (property: PropertyListing | null) => {
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

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px] min-h-0 overflow-hidden">
      {/* Map View - Left Side */}
      <div className="md:w-1/2 bg-gray-100 rounded-lg overflow-hidden min-h-0 flex-shrink-0 h-full">
        <GooglePropertyMap 
          properties={allProperties}
          selectedProperty={selectedProperty}
          onPropertySelect={handleMapPropertyClick}
          onBoundsChange={handleMapBoundsChange}
        />
      </div>

      {/* Property Cards - Right Side */}
      <div className="md:w-1/2 flex flex-col min-h-0 h-full overflow-hidden">
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden mb-2 min-h-0 pr-2" 
          data-listings-container
        >
          {allProperties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">No properties to display.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject Property Card */}
              <ComparablePropertyCard
                property={currentProperty}
                basePropertyMlsNumber={currentProperty.mlsNumber}
                onSelect={handlePropertySelect}
              />
              
              {/* Comparable Properties Cards */}
              {comparableProperties.map((property) => (
                <ComparablePropertyCard
                  key={property.mlsNumber}
                  property={property}
                  basePropertyMlsNumber={currentProperty.mlsNumber}
                  onSelect={handlePropertySelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardView
