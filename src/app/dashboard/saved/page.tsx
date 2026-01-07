"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useSavedProperties } from '@/hooks/useSavedProperties'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import { fetchPropertyListings } from '@/lib/api/properties'
import { useState, useEffect, useMemo } from 'react'
import { PropertyListing } from '@/lib/types'
import PropertyCard from '@/components/Helper/PropertyCard'
import { useBackgroundFetch } from '@/hooks/useBackgroundFetch'
import { getAllPreConProjects } from '@/data/mockPreConData'
import PreConstructionPropertyCardV3 from '@/components/PreCon/PropertyCards/PreConstructionPropertyCardV3'
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types'
import { Loader2 } from 'lucide-react'

const savedSearches = [
  { id: 1, name: "Downtown Condos", criteria: "2-3 bed, $500K-$800K, Downtown", results: 24 },
  { id: 2, name: "Family Homes", criteria: "3-4 bed, $800K-$1.2M, Suburbs", results: 18 },
  { id: 3, name: "Investment Properties", criteria: "Any, $300K-$600K, All areas", results: 45 },
]

// Convert PropertyListing to PreConstructionProperty format
const convertToPreConProperty = (property: PropertyListing): PreConstructionProperty | null => {
  if (!property.preCon) return null;

  const preCon = property.preCon;
  const address = property.address;

  return {
    id: property.mlsNumber,
    projectName: preCon.projectName,
    developer: preCon.developer,
    startingPrice: preCon.startingPrice,
    images: property.images?.allImages || [property.images?.imageUrl || '/images/p1.jpg'],
    address: {
      street: `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || address.location?.split(',')[0] || '',
      city: address.city || '',
      province: address.state || '',
      latitude: property.map?.latitude ?? undefined,
      longitude: property.map?.longitude ?? undefined,
    },
    details: {
      propertyType: property.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: preCon.completion.progress,
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};

export default function Saved() {
  const { savedProperties, isLoading: isLoadingSaved } = useSavedProperties()
  const { savedComparables, isLoading: isLoadingComparables } = useSavedComparables()
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [comparableProperties, setComparableProperties] = useState<PropertyListing[]>([])
  const { loading: isLoadingProperties, fetchData } = useBackgroundFetch()

  // Get saved pre-construction projects
  const savedProjects = useMemo(() => {
    if (isLoadingSaved || savedProperties.length === 0) return [];
    
    const allPreConProjects = getAllPreConProjects();
    const savedMlsNumbers = savedProperties.map((sp) => sp.mlsNumber);
    
    return allPreConProjects
      .filter((project) => savedMlsNumbers.includes(project.mlsNumber))
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [savedProperties, isLoadingSaved]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (savedProperties.length === 0) {
        return
      }

      if (!isLoadingSaved) {
        await fetchData(async () => {
          const allProperties = await fetchPropertyListings()
          const savedMlsNumbers = savedProperties.map((sp) => sp.mlsNumber)
          // Filter out pre-construction projects (they're handled separately)
          const allPreConProjects = getAllPreConProjects();
          const preConMlsNumbers = allPreConProjects.map(p => p.mlsNumber);
          const savedPropertyListings = allProperties.filter((p) =>
            savedMlsNumbers.includes(p.mlsNumber) && !preConMlsNumbers.includes(p.mlsNumber)
          )
          setProperties(savedPropertyListings)
          return savedPropertyListings
        }).catch((error) => {
          console.error('Error fetching saved properties:', error)
        })
      }
    }

    fetchProperties()
  }, [savedProperties, isLoadingSaved, fetchData])

  // Fetch comparable properties
  useEffect(() => {
    const fetchComparableProperties = async () => {
      if (savedComparables.length === 0) {
        setComparableProperties([])
        return
      }

      if (!isLoadingComparables) {
        await fetchData(async () => {
          const allProperties = await fetchPropertyListings()
          const comparableMlsNumbers = savedComparables.map((sc) => sc.mlsNumber)
          const comparablePropertyListings = allProperties.filter((p) =>
            comparableMlsNumbers.includes(p.mlsNumber)
          )
          setComparableProperties(comparablePropertyListings)
          return comparablePropertyListings
        }).catch((error) => {
          console.error('Error fetching comparable properties:', error)
        })
      }
    }

    fetchComparableProperties()
  }, [savedComparables, isLoadingComparables, fetchData])

  if (isLoadingSaved || isLoadingProperties || isLoadingComparables) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Saved Properties</h2>
        <p className="text-muted-foreground">Manage your saved homes and searches</p>
      </div>
      <Tabs defaultValue="homes" className="w-full">
        <TabsList>
          <TabsTrigger value="homes">Saved Homes</TabsTrigger>
          <TabsTrigger value="projects">Saved Projects</TabsTrigger>
          <TabsTrigger value="comparables">Saved Comparables</TabsTrigger>
          <TabsTrigger value="searches">Saved Searches</TabsTrigger>
        </TabsList>
        <TabsContent value="homes" className="mt-6">
          {properties.length === 0 ? (
            <div className="bg-card rounded-lg p-12 border border-border text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No saved properties yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start saving properties you're interested in to see them here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((property) => (
                <PropertyCard
                  key={property.mlsNumber}
                  property={property}
                  onHide={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="projects" className="mt-6">
          {savedProjects.length === 0 ? (
            <div className="bg-card rounded-lg p-12 border border-border text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No saved projects yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start saving pre-construction projects you're interested in to see them here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedProjects.map((project) => (
                <PreConstructionPropertyCardV3
                  key={project.id}
                  property={project}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="comparables" className="mt-6">
          {comparableProperties.length === 0 ? (
            <div className="bg-card rounded-lg p-12 border border-border text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No saved comparables yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Select properties from nearby areas to use for comparison. The average price will be calculated automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Comparable Value
                </h3>
                <p className="text-2xl font-bold text-secondary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(
                    comparableProperties.reduce((sum, p) => sum + p.listPrice, 0) / comparableProperties.length
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Average price based on {comparableProperties.length} {comparableProperties.length === 1 ? 'property' : 'properties'}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {comparableProperties.map((property) => (
                  <PropertyCard
                    key={property.mlsNumber}
                    property={property}
                    onHide={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="searches" className="mt-6">
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <Card key={search.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground mb-2">{search.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{search.criteria}</p>
                      <Badge variant="secondary">{search.results} results</Badge>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        View Results
                      </button>
                      <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted">
                        Edit
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

