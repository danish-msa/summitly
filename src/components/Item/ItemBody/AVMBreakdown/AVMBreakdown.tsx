"use client";

import React from 'react';
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
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

