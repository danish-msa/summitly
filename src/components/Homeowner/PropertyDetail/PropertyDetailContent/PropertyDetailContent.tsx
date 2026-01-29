"use client";

import React, { useState } from 'react';
import ViewToggle from '../ViewToggle/ViewToggle';
import WelcomeHeading from '../WelcomeHeading/WelcomeHeading';
import PropertyInfoCard from '../PropertyInfoCard/PropertyInfoCard';
import YourHomeCard from '../YourHomeCard/YourHomeCard';
import ToolsAndServices from '../ToolsAndServices/ToolsAndServices';
import HomeSalesSection from '../HomeSalesSection/HomeSalesSection';
import MarketSnapshot from '../MarketSnapshot/MarketSnapshot';
import ValueChangeCard from '../ValueChangeCard/ValueChangeCard';
import { 
  CurvedTabs, 
  CurvedTabsList, 
  CurvedTabsTrigger, 
  CurvedTabsContent 
} from '@/components/ui/curved-tabs';
import { NeighborhoodAmenities } from '@/components/Item/ItemBody/NeighborhoodAmenities/NeighborhoodAmenities';

interface PropertyDetailContentProps {
  propertySlug?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zip?: string;
  neighborhood?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  lotSize?: string;
  garage?: number | string;
  yearBuilt?: number | string;
  latitude?: number;
  longitude?: number;
  propertyImage?: string;
}

const PropertyDetailContent: React.FC<PropertyDetailContentProps> = (props) => {
  const [currentView, setCurrentView] = useState<'public' | 'owner'>('owner');

  const handleVerify = () => {
    console.log('Verify ownership clicked');
    // Add verification logic here
  };

  // Build full address for MarketAnalytics
  const fullAddress = [
    props.streetNumber,
    props.streetName,
    props.city,
    props.state,
    props.zip
  ]
    .filter(Boolean)
    .join(', ') || 'Address not available';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-1400 mx-auto px-4">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2">
            {/* Welcome Heading and View Toggle on same line */}
            <div className="flex items-center justify-between mb-6">
              <WelcomeHeading />
              <ViewToggle 
                currentView={currentView} 
                onViewChange={setCurrentView} 
              />
            </div>
            
            <PropertyInfoCard {...props} propertySlug={props.propertySlug} />
            
            <YourHomeCard
              onVerify={handleVerify}
              addressLine={fullAddress}
              propertySlug={props.propertySlug}
              streetNumber={props.streetNumber}
              streetName={props.streetName}
              city={props.city}
              state={props.state}
              zip={props.zip}
              beds={props.beds}
              baths={props.baths}
              sqft={props.sqft}
              lotSize={props.lotSize}
              garage={props.garage}
              yearBuilt={props.yearBuilt}
            />

            {/* Tabbed Section */}
            <div className="">
              <CurvedTabs defaultValue="home-sales" className="w-full">
                <CurvedTabsList className="w-full justify-start">
                  <CurvedTabsTrigger value="home-sales">Home sales</CurvedTabsTrigger>
                  <CurvedTabsTrigger value="market-snapshot">Market Snapshot</CurvedTabsTrigger>
                  <CurvedTabsTrigger value="neighborhood-insights">Neighborhood Insights</CurvedTabsTrigger>
                </CurvedTabsList>

                <CurvedTabsContent value="home-sales">
                  <HomeSalesSection
                    latitude={props.latitude}
                    longitude={props.longitude}
                    city={props.city}
                    neighborhood={props.neighborhood}
                    addressQuery={fullAddress !== 'Address not available' ? fullAddress : undefined}
                  />
                </CurvedTabsContent>

                <CurvedTabsContent value="market-snapshot">
                  <MarketSnapshot
                    zip={props.zip}
                    city={props.city}
                    state={props.state}
                  />
                </CurvedTabsContent>

                <CurvedTabsContent value="neighborhood-insights">
                  <NeighborhoodAmenities
                    address={fullAddress}
                    latitude={props.latitude ?? undefined}
                    longitude={props.longitude ?? undefined}
                  />
                </CurvedTabsContent>
              </CurvedTabs>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <ValueChangeCard />
            </div>
            <ToolsAndServices />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailContent;
