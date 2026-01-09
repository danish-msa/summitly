"use client"

import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { CurvedTabs, CurvedTabsList, CurvedTabsTrigger, CurvedTabsContent } from '@/components/ui/curved-tabs'
import Description from '../ItemBody/Description'
import PropertyHistory from '../ItemBody/PropertyHistory/PropertyHistory'
import { generatePropertyDetailsData } from '../ItemBody/generatePropertyDetails'
import PropertyListingDetails from '../ItemBody/PropertyListingDetails'
import AVMBreakdown from '../ItemBody/AVMBreakdown'
import Documents from '../ItemBody/Documents'
import Features from './Features'
import MarketAnalytics from './MarketAnalytics'
import Calculators from './Calculators'

interface NewItemBodyProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
  isPreCon?: boolean;
  isRent?: boolean;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export interface NewItemBodyRef {
  setActiveTab: (value: string) => void;
  scrollToSection: () => void;
}

const NewItemBody = forwardRef<NewItemBodyRef, NewItemBodyProps>(({ 
  property,
  rawProperty = null,
  isPreCon = false, 
  isRent = false,
  activeTab: externalActiveTab,
  onTabChange
}, ref) => {
  const [internalActiveTab, setInternalActiveTab] = useState("avm-breakdown")
  const sectionRef = React.useRef<HTMLDivElement>(null)
  
  // Use external activeTab if provided, otherwise use internal state
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab
  
  const handleTabChange = (value: string) => {
    if (externalActiveTab === undefined) {
      setInternalActiveTab(value)
    }
    onTabChange?.(value)
  }

  useImperativeHandle(ref, () => ({
    setActiveTab: (value: string) => {
      handleTabChange(value)
    },
    scrollToSection: () => {
      if (sectionRef.current) {
        const elementPosition = sectionRef.current.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - 100 // Offset for navbar
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }
  }))

  return (
    <div ref={sectionRef} className="w-full">
      <CurvedTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <CurvedTabsList className="w-full justify-start">
          {!isRent && <CurvedTabsTrigger value="avm-breakdown">AVM Breakdown</CurvedTabsTrigger>}
          <CurvedTabsTrigger value="listing-details">Listing Details</CurvedTabsTrigger>
          {!isRent && <CurvedTabsTrigger value="history">History</CurvedTabsTrigger>}
          <CurvedTabsTrigger value="features">Features</CurvedTabsTrigger>
          <CurvedTabsTrigger value="location">Location</CurvedTabsTrigger>
          {!isRent && <CurvedTabsTrigger value="market-analytics">Market Analytics</CurvedTabsTrigger>}
          {!isRent && <CurvedTabsTrigger value="calculators">Calculators</CurvedTabsTrigger>}
          <CurvedTabsTrigger value="documents">Documents</CurvedTabsTrigger>
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

        {!isRent && (
          <CurvedTabsContent value="calculators">
            <Calculators property={property} rawProperty={rawProperty} isPreCon={isPreCon} isRent={isRent} />
          </CurvedTabsContent>
        )}

        <CurvedTabsContent value="documents">
          <Documents property={property} rawProperty={rawProperty} />
        </CurvedTabsContent>
      </CurvedTabs>
    </div>
  )
})

NewItemBody.displayName = "NewItemBody"

export default NewItemBody

