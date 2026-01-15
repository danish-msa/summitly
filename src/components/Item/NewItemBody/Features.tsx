"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { MapPin, Sparkles, Users, Building2 } from 'lucide-react'
import { 
  VerticalTabs, 
  VerticalTabsList, 
  VerticalTabsTrigger, 
  VerticalTabsContent,
  VerticalTabsContainer
} from '@/components/ui/vertical-tabs'
import { NeighborhoodAmenities } from '../ItemBody/NeighborhoodAmenities'
import { LifestyleAmenities } from '../ItemBody/LifestyleAmenities'
import NeighbourhoodDemographics from '../ItemBody/Demographics/Demographics'
import ProjectAmenities from '../../PreConItem/PreConItemBody/ProjectAmenities'

interface FeaturesProps {
  property: PropertyListing
  rawProperty?: SinglePropertyListingResponse | null
  isPreCon?: boolean
  isRent?: boolean
}

const Features: React.FC<FeaturesProps> = ({ property, rawProperty, isPreCon = false, isRent = false }) => {
  // Get property address
  const address = property.address?.location || 
    `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}, ${property.address?.city || ''}, ${property.address?.state || ''} ${property.address?.zip || ''}`.trim()

  // Get coordinates
  const latitude = property.map?.latitude || null
  const longitude = property.map?.longitude || null

  // Determine default tab based on whether it's pre-con
  const defaultTab = isPreCon ? "project-amenities" : "neighborhood"

  return (
    <div className="w-full">
      <VerticalTabs defaultValue={defaultTab} className="w-full">
        <VerticalTabsContainer>
          <VerticalTabsList>
            {isPreCon && (
              <VerticalTabsTrigger value="project-amenities" className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-secondary" />
                <span>Project Amenities</span>
              </VerticalTabsTrigger>
            )}
            <VerticalTabsTrigger value="neighborhood" className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-secondary" />
              <span>Neighborhood Amenities</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="lifestyle" className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-secondary" />
              <span>Lifestyle Amenities</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="demographics" className="flex items-center gap-3">
              <Users className="h-6 w-6 text-secondary" />
              <span>Demographics</span>
            </VerticalTabsTrigger>
          </VerticalTabsList>

          <div className="flex-1">
            {isPreCon && (
              <VerticalTabsContent value="project-amenities">
                <ProjectAmenities property={property} />
              </VerticalTabsContent>
            )}
            <VerticalTabsContent value="neighborhood">
              <NeighborhoodAmenities 
                address={address}
                latitude={latitude}
                longitude={longitude}
              />
            </VerticalTabsContent>

            <VerticalTabsContent value="lifestyle">
              <LifestyleAmenities 
                address={address}
                latitude={latitude}
                longitude={longitude}
              />
            </VerticalTabsContent>

            <VerticalTabsContent value="demographics">
              <NeighbourhoodDemographics 
                address={address}
                latitude={latitude}
                longitude={longitude}
              />
            </VerticalTabsContent>
          </div>
        </VerticalTabsContainer>
      </VerticalTabs>
    </div>
  )
}

export default Features

