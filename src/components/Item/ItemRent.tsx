"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { fetchPropertyListings, getRawListingDetails } from '@/lib/api/properties'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import PropertyAlerts from './ItemBody/PropertyAlerts'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import BannerGallery from './Banner/BannerGallery'
import SectionNavigation from './ItemBody/SectionNavigation'
import SimilarListings from './ItemBody/SimilarListings'
import StickyPropertyBar from './StickyPropertyBar'
import Breadcrumbs from './Breadcrumbs'
import { ContactSection } from './ItemBody/ContactSection'

const ItemRent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
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
          // Verify this is a rental property
          const isRental = foundProperty.type === 'Lease' || foundProperty.type?.toLowerCase().includes('lease');
          
          if (!isRental) {
            // Redirect to buy page
            router.replace(`/property/${propertyId}`);
            return;
          }
          
          // Merge openHouse data from rawProperty into property
          const propertyWithOpenHouse = {
            ...foundProperty,
            openHouse: rawListing?.openHouse || foundProperty.openHouse
          };
          setProperty(propertyWithOpenHouse);
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

    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading property details..." />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Property not found'}</p>
          {error && error.includes('not found') && (
            <button
              onClick={() => router.push('/rent')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Rentals
            </button>
          )}
        </div>
      </div>
    );
  }

  // Define navigation sections for rent (no history section)
  const navigationSections = [
    { id: 'description', label: 'Description' },
    { id: 'listing-details', label: 'Listing Details' },
    { id: 'features', label: 'Neighborhood' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'market-analytics', label: 'Market Analytics' },
    { id: 'calculators', label: 'Calculators' }
  ];

  return (
    <div className='bg-background'>
      {/* Sticky Property Bar */}
      <StickyPropertyBar property={property} bannerRef={bannerRef} />
      <div className='container-1400 mt-20 mb-4'>
        {/* Breadcrumbs */}
        <Breadcrumbs property={property} isPreCon={false} isRent={true} />
        <BannerGallery property={property} />
      </div>
      {/* Sticky Navigation Panel */}
      <SectionNavigation sections={navigationSections} property={property} />
      <div className='container-1400'>
          
        <div className='flex flex-row gap-8'>
          <div className='w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef} data-banner-section>
              <Banner property={property} rawProperty={rawProperty} isPreCon={false} isRent={true} />
            </div>
            <ItemBody property={property} isPreCon={false} isRent={true} />
          </div>
          <div className='w-[30%] flex flex-col gap-4 items-start gap-0 sticky top-[130px] self-start'>
            <BasicInfo property={property} rawProperty={rawProperty} isPreCon={false} isRent={true} />
            <PropertyAlerts 
              propertyId={property.mlsNumber} 
              cityName={property.address.city || 'this area'}
              propertyType={property.details.propertyType || 'property'}
              neighborhood={property.address.neighborhood || undefined}
            />
          </div>
        </div>
        <div className='mt-6'>
          
        </div>
      </div>

      <div className='container-1400 mt-20 mb-4'>
        <ContactSection />
      </div>
      <div className='container-1400 mt-20 mb-4'>
        <SimilarListings currentProperty={property} />
      </div>
    </div>
  )
}

export default ItemRent

