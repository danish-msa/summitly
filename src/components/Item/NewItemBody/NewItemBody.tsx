"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { CurvedTabs, CurvedTabsList, CurvedTabsTrigger, CurvedTabsContent } from '@/components/ui/curved-tabs'
import Description from '../ItemBody/Description'
import PropertyHistory from '../ItemBody/PropertyHistory/PropertyHistory'
import { generatePropertyDetailsData } from '../ItemBody/generatePropertyDetails'
import PropertyListingDetails from '../ItemBody/PropertyListingDetails'
import AVMBreakdown from '../ItemBody/AVMBreakdown'
import Features from './Features'
import MarketAnalytics from './MarketAnalytics'

interface NewItemBodyProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
  isPreCon?: boolean;
  isRent?: boolean;
}

const NewItemBody: React.FC<NewItemBodyProps> = ({ 
  property,
  rawProperty = null,
  isPreCon = false, 
  isRent = false 
}) => {
  return (
    <div className="w-full">
      <CurvedTabs defaultValue="avm-breakdown" className="w-full">
        <CurvedTabsList className="w-full justify-start">
          {!isRent && <CurvedTabsTrigger value="avm-breakdown">AVM Breakdown</CurvedTabsTrigger>}
          <CurvedTabsTrigger value="listing-details">Listing Details</CurvedTabsTrigger>
          {!isRent && <CurvedTabsTrigger value="history">History</CurvedTabsTrigger>}
          <CurvedTabsTrigger value="features">Features</CurvedTabsTrigger>
          <CurvedTabsTrigger value="location">Location</CurvedTabsTrigger>
          {!isRent && <CurvedTabsTrigger value="market-analytics">Market Analytics</CurvedTabsTrigger>}
        </CurvedTabsList>

        {!isRent && (
          <CurvedTabsContent value="avm-breakdown">
            <AVMBreakdown property={property} rawProperty={rawProperty} />
          </CurvedTabsContent>
        )}

        <CurvedTabsContent value="listing-details">
          {/* Listing details content will go here */}
          <PropertyListingDetails data={generatePropertyDetailsData(property)} property={property} />
        </CurvedTabsContent>

        {!isRent && (
          <CurvedTabsContent value="history">
            <PropertyHistory 
              listingHistory={generatePropertyDetailsData(property, rawProperty).listingHistory} 
              property={property}
              rawProperty={rawProperty}
            />
          </CurvedTabsContent>
        )}

        <CurvedTabsContent value="features">
          <Features property={property} rawProperty={rawProperty} isPreCon={isPreCon} isRent={isRent} />
        </CurvedTabsContent>

        <CurvedTabsContent value="location">
          {/* Location content will go here */}
        </CurvedTabsContent>

        {!isRent && (
          <CurvedTabsContent value="market-analytics">
            <MarketAnalytics property={property} rawProperty={rawProperty} isPreCon={isPreCon} isRent={isRent} />
          </CurvedTabsContent>
        )}
      </CurvedTabs>
    </div>
  )
}

export default NewItemBody

