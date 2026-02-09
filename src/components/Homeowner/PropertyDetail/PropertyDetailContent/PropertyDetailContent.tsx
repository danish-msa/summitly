"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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

/** Saved home from GET /api/v1/my-home?slug= */
type SavedHome = {
  slug: string;
  addressLine: string;
  streetNumber?: string | null;
  streetName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  bedrooms?: number | null;
  fullBathrooms?: number | null;
  partialBathrooms?: number | null;
  livingAreaSqft?: number | null;
  lotSize?: string | null;
  garageType?: string | null;
  yearBuilt?: number | null;
};

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

function bathsFromSaved(full?: number | null, partial?: number | null): number | string | undefined {
  const f = full ?? 0;
  const p = partial ?? 0;
  const total = f + p;
  if (total === 0) return undefined;
  return total % 1 === 0 ? total : Number(total.toFixed(1));
}

const PropertyDetailContent: React.FC<PropertyDetailContentProps> = (props) => {
  const { data: session } = useSession();
  const [currentView, setCurrentView] = useState<'public' | 'owner'>('owner');
  const [savedHome, setSavedHome] = useState<SavedHome | null>(null);

  // When property is verified (in user's My Home), use saved data for display instead of Repliers
  useEffect(() => {
    if (!session?.user || !props.propertySlug?.trim()) {
      setSavedHome(null);
      return;
    }
    let cancelled = false;
    const slug = props.propertySlug.trim();
    (async () => {
      try {
        const res = await fetch(`/api/v1/my-home?slug=${encodeURIComponent(slug)}`, { credentials: "include" });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled && json.home) setSavedHome(json.home);
        else if (!cancelled) setSavedHome(null);
      } catch {
        if (!cancelled) setSavedHome(null);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user, props.propertySlug]);

  const refetchSavedHome = useCallback(async () => {
    if (!props.propertySlug?.trim()) return;
    const slug = props.propertySlug.trim();
    try {
      const res = await fetch(`/api/v1/my-home?slug=${encodeURIComponent(slug)}`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setSavedHome(json.home ?? null);
    } catch {
      setSavedHome(null);
    }
  }, [props.propertySlug]);

  // Use saved user home for display when verified; otherwise Repliers (props)
  const display = savedHome
    ? {
        streetNumber: savedHome.streetNumber ?? props.streetNumber,
        streetName: savedHome.streetName ?? props.streetName,
        city: savedHome.city ?? props.city,
        state: savedHome.state ?? props.state,
        zip: savedHome.zip ?? props.zip,
        beds: savedHome.bedrooms ?? props.beds,
        baths: bathsFromSaved(savedHome.fullBathrooms, savedHome.partialBathrooms) ?? props.baths,
        sqft: savedHome.livingAreaSqft ?? props.sqft,
        lotSize: savedHome.lotSize ?? props.lotSize,
        garage: savedHome.garageType ?? props.garage,
        yearBuilt: savedHome.yearBuilt ?? props.yearBuilt,
      }
    : {
        streetNumber: props.streetNumber,
        streetName: props.streetName,
        city: props.city,
        state: props.state,
        zip: props.zip,
        beds: props.beds,
        baths: props.baths,
        sqft: props.sqft,
        lotSize: props.lotSize,
        garage: props.garage,
        yearBuilt: props.yearBuilt,
      };

  const fullAddress = savedHome?.addressLine?.trim() || [
    display.streetNumber,
    display.streetName,
    display.city,
    display.state,
    display.zip,
  ]
    .filter(Boolean)
    .join(', ') || 'Address not available';

  const mergedProps = {
    ...props,
    propertySlug: props.propertySlug,
    streetNumber: display.streetNumber,
    streetName: display.streetName,
    city: display.city,
    state: display.state,
    zip: display.zip,
    beds: display.beds,
    baths: display.baths,
    sqft: display.sqft,
    lotSize: display.lotSize,
    garage: display.garage,
    yearBuilt: display.yearBuilt,
  };

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
            
            <PropertyInfoCard {...mergedProps} />
            
            <YourHomeCard
              onVerify={refetchSavedHome}
              addressLine={fullAddress}
              propertySlug={props.propertySlug}
              isVerified={!!savedHome}
              streetNumber={display.streetNumber}
              streetName={display.streetName}
              city={display.city}
              state={display.state}
              zip={display.zip}
              beds={display.beds}
              baths={display.baths}
              sqft={display.sqft}
              lotSize={display.lotSize}
              garage={display.garage}
              yearBuilt={display.yearBuilt}
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
                    zip={mergedProps.zip}
                    city={mergedProps.city}
                    state={mergedProps.state}
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
