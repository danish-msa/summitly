"use client"

import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { CurvedTabs, CurvedTabsList, CurvedTabsTrigger, CurvedTabsContent } from '@/components/ui/curved-tabs'
import PropertyHistory from './PropertyHistory/PropertyHistory'
import { generatePropertyDetailsData } from './generatePropertyDetails'
import PropertyListingDetails from './PropertyListingDetails'
import AVMBreakdown from './AVMBreakdown'
import Documents from './Documents'
import Features from './Features'
import MarketAnalyticsWrapper from './MarketAnalytics'
import Calculators from './Calculators'
import PricingIncentives from '../../PreConItem/PreConItemBody/PricingIncentives'
import DepositStructure from '../../PreConItem/PreConItemBody/DepositStructure'
import AvailableUnits from '../../PreConItem/PreConItemBody/AvailableUnits'

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
  // Set default tab based on property type
  const defaultTab = isPreCon ? "listing-details" : "avm-breakdown"
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab)
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

  // Check if documents exist
  const hasDocuments = property.preCon?.documents && property.preCon.documents.length > 0

  return (
    <div ref={sectionRef} className="w-full">
      <CurvedTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <CurvedTabsList className="w-full justify-start">
          {!isRent && !isPreCon && <CurvedTabsTrigger value="avm-breakdown">AVM Breakdown</CurvedTabsTrigger>}
          <CurvedTabsTrigger value="listing-details">{isPreCon ? "Project Details" : "Listing Details"}</CurvedTabsTrigger>
          {!isRent && !isPreCon && <CurvedTabsTrigger value="history">History</CurvedTabsTrigger>}
          {isPreCon && <CurvedTabsTrigger value="pricing-incentives">Pricing & Incentives</CurvedTabsTrigger>}
          {isPreCon && <CurvedTabsTrigger value="deposit-structure">Deposit Structure</CurvedTabsTrigger>}
          {isPreCon && <CurvedTabsTrigger value="available-units">Available Units</CurvedTabsTrigger>}
          <CurvedTabsTrigger value="features">Features</CurvedTabsTrigger>
          {!isRent && !isPreCon && <CurvedTabsTrigger value="market-analytics">Market Analytics</CurvedTabsTrigger>}
          {!isRent && <CurvedTabsTrigger value="calculators">Calculators</CurvedTabsTrigger>}
          {hasDocuments && <CurvedTabsTrigger value="documents">Documents</CurvedTabsTrigger>}
        </CurvedTabsList>

        {!isRent && !isPreCon && (
          <CurvedTabsContent value="avm-breakdown">
            <AVMBreakdown property={property} rawProperty={rawProperty} />
          </CurvedTabsContent>
        )}

        <CurvedTabsContent value="listing-details">
          {/* Listing details content will go here */}
          <PropertyListingDetails data={generatePropertyDetailsData(property)} property={property} />
        </CurvedTabsContent>

        {!isRent && !isPreCon && (
          <CurvedTabsContent value="history">
            <PropertyHistory 
              listingHistory={generatePropertyDetailsData(property, rawProperty).listingHistory} 
              property={property}
              rawProperty={rawProperty}
            />
          </CurvedTabsContent>
        )}

        {isPreCon && (
          <CurvedTabsContent value="pricing-incentives">
            <PricingIncentives property={property} />
          </CurvedTabsContent>
        )}

        {isPreCon && (
          <CurvedTabsContent value="deposit-structure">
            <DepositStructure property={property} />
          </CurvedTabsContent>
        )}

        {isPreCon && (
          <CurvedTabsContent value="available-units">
            <AvailableUnits property={property} />
          </CurvedTabsContent>
        )}


        <CurvedTabsContent value="features">
          <Features property={property} rawProperty={rawProperty} isPreCon={isPreCon} isRent={isRent} />
        </CurvedTabsContent>


        {!isRent && !isPreCon && (
          <CurvedTabsContent value="market-analytics">
            <MarketAnalyticsWrapper property={property} rawProperty={rawProperty} isPreCon={isPreCon} isRent={isRent} />
          </CurvedTabsContent>
        )}

        {!isRent && (
          <CurvedTabsContent value="calculators">
            <Calculators property={property} rawProperty={rawProperty} isPreCon={isPreCon} isRent={isRent} />
          </CurvedTabsContent>
        )}

        {hasDocuments && (
          <CurvedTabsContent value="documents">
            <Documents property={property} rawProperty={rawProperty} />
          </CurvedTabsContent>
        )}
      </CurvedTabs>
    </div>
  )
})

NewItemBody.displayName = "NewItemBody"

export default NewItemBody
