"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { fetchPropertyListings, getRawListingDetails } from '@/lib/api/properties'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import AgentCTA from './ItemBody/AgentCTA'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import BannerGallery from './Banner/BannerGallery'
import SectionNavigation from './ItemBody/SectionNavigation'

// Remove the local Property interface definition

const Item: React.FC = () => {
  const params = useParams();
  const propertyId = params?.id as string || '';
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [rawProperty, setRawProperty] = useState<SinglePropertyListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        // Fetch both regular listing and raw listing for imageInsights
        const [listings, rawListing] = await Promise.all([
          fetchPropertyListings(),
          getRawListingDetails(propertyId)
        ]);
        
        const foundProperty = listings.find(p => p.mlsNumber === propertyId);
        
        if (foundProperty) {
          setProperty(foundProperty);
          setRawProperty(rawListing);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        setError('Failed to load property details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading property details..." />
      </div>
    );
  }

  if (error || !property) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Property not found'}</div>;
  }

  // Define navigation sections that match CollapsibleTabs
  const navigationSections = [
    { id: 'description', label: 'Description' },
    { id: 'listing-details', label: 'Listing Details' },
    { id: 'history', label: 'History' },
    { id: 'features', label: 'Neighborhood' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'market-analytics', label: 'Market Analytics' },
    { id: 'tools', label: 'Tools' },
    { id: 'similar', label: 'Similar Properties' },
  ];

  return (
    <div className='bg-background'>
      {/* Sticky Property Bar */}
      {/* <StickyPropertyBar property={property} bannerRef={bannerRef} /> */}
      <div className='container-1400 mt-20 mb-4'>
        <BannerGallery property={property} />
      </div>
      {/* Sticky Navigation Panel */}
      <SectionNavigation sections={navigationSections} />
      <div className='container-1400'>
          <div ref={bannerRef}>
            <Banner property={property} rawProperty={rawProperty} />
          </div>
        
        
        <div className='flex flex-row gap-4'>
          <div className='w-[70%] flex flex-col gap-6'>
            <ItemBody property={property} />
          </div>
          <div className='w-[30%] flex flex-col items-start gap-6'>
            <BasicInfo property={property} rawProperty={rawProperty} />
            <AgentCTA />
          </div>
        </div>
        <div className='mt-6'>
          
        </div>
      </div>
    </div>
  )
}

export default Item