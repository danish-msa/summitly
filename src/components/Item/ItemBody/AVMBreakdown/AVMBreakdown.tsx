"use client";

import React from 'react';
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import PricePrediction from '../PricePrediction';
import ValuationRange from './ValuationRange';
import Home from './Home';
import {
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  VerticalTabsContent,
  VerticalTabsContainer,
} from '@/components/ui/vertical-tabs';

interface AVMBreakdownProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
}

const AVMBreakdown: React.FC<AVMBreakdownProps> = ({ property, rawProperty }) => {
  // Extract price prediction data from rawProperty if available
  const estimatedValue = rawProperty?.estimate?.value || property?.listPrice || 0;
  const lowerRange = rawProperty?.estimate?.low || (estimatedValue * 0.9);
  const higherRange = rawProperty?.estimate?.high || (estimatedValue * 1.1);
  const confidence = rawProperty?.estimate?.confidence || 75;
  
  // Calculate appreciation from estimate history if available
  const estimateHistory = rawProperty?.estimate?.history?.mth;
  let appreciation = 0;
  if (estimateHistory && Object.keys(estimateHistory).length > 1) {
    const values = Object.values(estimateHistory).map(v => v.value);
    const oldest = values[values.length - 1];
    const newest = values[0];
    if (oldest > 0) {
      appreciation = ((newest - oldest) / oldest) * 100;
    }
  }
  
  // Estimate monthly rent as 0.5% of property value
  const monthlyRent = estimatedValue ? Math.round(estimatedValue * 0.005) : 0;

  return (
    <div className="w-full space-y-6 relative z-0">
      <VerticalTabs defaultValue="valuation-range" className="w-full">
        <VerticalTabsContainer>
          <VerticalTabsList>
            <VerticalTabsTrigger value="valuation-range">Valuation Range</VerticalTabsTrigger>
            <VerticalTabsTrigger value="home">Home</VerticalTabsTrigger>
          </VerticalTabsList>
          
          <div className="flex-1 relative z-0">
            <VerticalTabsContent value="valuation-range" className="relative z-0">
              <ValuationRange property={property} rawProperty={rawProperty} />
            </VerticalTabsContent>
            
            <VerticalTabsContent value="home" className="relative z-0">
              <Home property={property} rawProperty={rawProperty} />
            </VerticalTabsContent>
          </div>
        </VerticalTabsContainer>
      </VerticalTabs>
    </div>
  );
};

export default AVMBreakdown;

