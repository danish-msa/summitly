"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { PropertyListing } from '@/lib/types'
import { getListingDetails } from '@/lib/api/properties'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import { CurvedTabs, CurvedTabsList, CurvedTabsTrigger, CurvedTabsContent } from '@/components/ui/curved-tabs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import ComparableSelectorModal from '@/components/Comparables/ComparableSelectorModal'
import CardView from './CardView'
import ListView from './ListView'
import ComparisonView from './ComparisonView'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Plus } from 'lucide-react'

interface PropertiesComparisonProps {
  currentProperty: PropertyListing
}

const PropertiesComparison: React.FC<PropertiesComparisonProps> = ({ currentProperty }) => {
  const { savedComparables, isLoading: isLoadingComparables } = useSavedComparables(currentProperty.mlsNumber)
  const [comparableProperties, setComparableProperties] = useState<PropertyListing[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComparableModalOpen, setIsComparableModalOpen] = useState(false)

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
        // Filter comparables to only those for the current property
        const relevantComparables = savedComparables.filter(
          sc => sc.basePropertyMlsNumber === currentProperty.mlsNumber
        )
        
        const propertyPromises = relevantComparables.map(async (saved) => {
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
  }, [savedComparables, currentProperty.mlsNumber])

  const hasComparables = comparableProperties.length > 0

  // Get selected IDs from saved comparables for ComparisonView
  const selectedIds = useMemo(() => {
    const relevantComparables = savedComparables.filter(
      sc => sc.basePropertyMlsNumber === currentProperty.mlsNumber
    )
    return new Set(relevantComparables.map(sc => sc.mlsNumber))
  }, [savedComparables, currentProperty.mlsNumber])

  return (
    <div className="w-full mt-12">
      <CurvedTabs defaultValue="sold-active-comps" className="w-full">
        <CurvedTabsList className="w-full justify-start">
          <CurvedTabsTrigger value="sold-active-comps">Sold & Active Comps</CurvedTabsTrigger>
        </CurvedTabsList>

        <CurvedTabsContent value="sold-active-comps" className="pl-10">
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
              <Button
                onClick={() => setIsComparableModalOpen(true)}
                variant="default"
                className="gap-2"
              >
                <Plus className="w-4 h-4" aria-hidden />
                Select Comparables
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="card-view" className="w-full">
              <TabsList>
                <TabsTrigger value="card-view">Card View</TabsTrigger>
                <TabsTrigger value="list-view">List View</TabsTrigger>
                <TabsTrigger value="comparison-view">Comparison View</TabsTrigger>
              </TabsList>

              <TabsContent value="card-view" variant="borderless">
                <CardView 
                  currentProperty={currentProperty}
                  comparableProperties={comparableProperties}
                />
              </TabsContent>

              <TabsContent value="list-view" variant="borderless">
                <ListView 
                  currentProperty={currentProperty}
                  comparableProperties={comparableProperties}
                />
              </TabsContent>

              <TabsContent value="comparison-view" variant="borderless">
                <ComparisonView 
                  subjectProperty={currentProperty}
                  comparableProperties={comparableProperties}
                  selectedIds={selectedIds}
                />
              </TabsContent>
            </Tabs>
          )}
        </CurvedTabsContent>
      </CurvedTabs>
      <ComparableSelectorModal
        open={isComparableModalOpen}
        onOpenChange={setIsComparableModalOpen}
        property={currentProperty}
      />
    </div>
  )
}

export default PropertiesComparison

