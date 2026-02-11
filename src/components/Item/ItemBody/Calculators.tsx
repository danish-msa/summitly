"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { MortgageCalculator } from './MortgageCalculator'
import AffordabilityCalculator from './AffordabilityCalculator'
import {
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  VerticalTabsContent,
  VerticalTabsContainer,
} from '@/components/ui/vertical-tabs'
import { Calculator, TrendingUp } from 'lucide-react'

interface CalculatorsProps {
  property: PropertyListing
  rawProperty?: SinglePropertyListingResponse | null
  isPreCon?: boolean
  isRent?: boolean
}

const Calculators: React.FC<CalculatorsProps> = ({ property, rawProperty, isPreCon: _isPreCon = false, isRent: _isRent = false }) => {
  // Extract property price from property or rawProperty
  const propertyPrice = rawProperty?.estimate?.value || property.listPrice || 0

  return (
    <div className="w-full">
      <VerticalTabs defaultValue="mortgage" className="w-full">
        <VerticalTabsContainer>
          <VerticalTabsList>
            <VerticalTabsTrigger value="mortgage" className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-secondary" />
              <span>Mortgage Calculator</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="affordability" className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-secondary" />
              <span>Affordability Calculator</span>
            </VerticalTabsTrigger>
          </VerticalTabsList>

          <div className="flex-1">
            <VerticalTabsContent value="mortgage">
              <MortgageCalculator />
            </VerticalTabsContent>

            <VerticalTabsContent value="affordability">
              <AffordabilityCalculator propertyPrice={propertyPrice} />
            </VerticalTabsContent>
          </div>
        </VerticalTabsContainer>
      </VerticalTabs>
    </div>
  )
}

export default Calculators
