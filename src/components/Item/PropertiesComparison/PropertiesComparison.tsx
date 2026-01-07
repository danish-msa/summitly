"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { PropertyListing } from '@/lib/types'
import { getListingDetails } from '@/lib/api/properties'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import { CurvedTabs, CurvedTabsList, CurvedTabsTrigger, CurvedTabsContent } from '@/components/ui/curved-tabs'
import ComparisonTable from './ComparisonTable'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface PropertiesComparisonProps {
  currentProperty: PropertyListing
}

const PropertiesComparison: React.FC<PropertiesComparisonProps> = ({ currentProperty }) => {
  const { savedComparables, isLoading: isLoadingComparables } = useSavedComparables()
  const [comparableProperties, setComparableProperties] = useState<PropertyListing[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch property details for all saved comparables
  useEffect(() => {
    const fetchComparableProperties = async () => {
      if (savedComparables.length === 0) {
        setComparableProperties([])
        return
      }

      setIsLoadingProperties(true)
      setError(null)

      try {
        const propertyPromises = savedComparables.map(async (saved) => {
          try {
            const property = await getListingDetails(saved.mlsNumber)
            return property
          } catch (err) {
            console.error(`Failed to fetch property ${saved.mlsNumber}:`, err)
            return null
          }
        })

        const properties = await Promise.all(propertyPromises)
        const validProperties = properties.filter((p): p is PropertyListing => p !== null)
        setComparableProperties(validProperties)
      } catch (err) {
        console.error('Error fetching comparable properties:', err)
        setError('Failed to load comparable properties')
      } finally {
        setIsLoadingProperties(false)
      }
    }

    fetchComparableProperties()
  }, [savedComparables])

  const hasComparables = comparableProperties.length > 0

  return (
    <div className="w-full mt-12">
      <CurvedTabs defaultValue="sold-active-comps" className="w-full">
        <CurvedTabsList className="w-full justify-start">
          <CurvedTabsTrigger value="sold-active-comps">Sold & Active Comps</CurvedTabsTrigger>
        </CurvedTabsList>

        <CurvedTabsContent value="sold-active-comps">
          {isLoadingComparables || isLoadingProperties ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" message="Loading comparables..." />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : !hasComparables ? (
            <div className="text-center py-12">
              <p className="text-zinc-500">
                No comparables selected yet. Use the "Select Comparables" button in the price card to add properties for comparison.
              </p>
            </div>
          ) : (
            <ComparisonTable 
              currentProperty={currentProperty}
              comparableProperties={comparableProperties}
            />
          )}
        </CurvedTabsContent>
      </CurvedTabs>
    </div>
  )
}

export default PropertiesComparison

