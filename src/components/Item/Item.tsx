"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { fetchPropertyListings, getRawListingDetails, getListingDetails } from '@/lib/api/properties'
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
import { parsePropertyUrl } from '@/lib/utils/propertyUrl'

const Item: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  // For property pages, citySlug is the city name (without -real-estate suffix)
  const citySlug = (params?.citySlug || params?.cityName) as string; // Support both for backward compatibility
  const cityName = citySlug; // For property pages, citySlug is just the city name (no -real-estate)
  const propertyAddress = (params?.slug || params?.propertyAddress) as string; // Use slug as primary, support propertyAddress for backward compatibility
  const propertyId = params?.id as string; // Fallback for old URL structure
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [rawProperty, setRawProperty] = useState<SinglePropertyListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRental, setIsRental] = useState<boolean>(false);

  console.log('[Item Component] Mounted with params:', {
    citySlug,
    cityName,
    propertyAddress,
    propertyId,
    allParams: params,
  });

  useEffect(() => {
    console.log('[Item useEffect] Effect triggered with:', {
      cityName,
      propertyAddress,
      propertyId,
    });

    const fetchPropertyDetails = async () => {
      let mlsNumber: string | undefined;
      
      try {
        console.log('[Property Fetch] Starting fetch...');
        
        // Extract MLS number from URL
        if (cityName && propertyAddress) {
          console.log('[Property Fetch] Parsing URL:', {
            cityName,
            propertyAddress,
          });
          
          // New URL structure: /{citySlug}/{streetNumber}-{streetName}-{mlsNumber}
          const parsed = parsePropertyUrl(cityName, propertyAddress);
          
          console.log('[Property Fetch] Parsed result:', parsed);
          
          if (!parsed) {
            console.error('[Property Fetch] Failed to parse URL');
            setError('Invalid property URL');
            setLoading(false);
            return;
          }

          // Extract MLS number from URL - this is the primary method
          if (parsed.mlsNumber) {
            mlsNumber = parsed.mlsNumber;
            console.log('[Property Fetch] ✅ MLS number extracted:', mlsNumber);
          } else {
            // If MLS number is not in URL, show error
            console.error('[Property Fetch] ❌ MLS number not found in parsed URL:', parsed);
            setError('Property URL must include MLS number');
            setLoading(false);
            return;
          }
        } else if (propertyId) {
          // Fallback to old URL structure (using MLS number directly)
          mlsNumber = propertyId;
          console.log('[Property Fetch] Using propertyId as MLS number:', mlsNumber);
        } else {
          console.error('[Property Fetch] ❌ No valid URL parameters found');
          setError('Invalid URL - MLS number required');
          setLoading(false);
          return;
        }

        // Fetch property directly from Repliers API using MLS number
        if (!mlsNumber) {
          console.error('[Property Fetch] ❌ MLS number is undefined');
          setError('MLS number not found in URL');
          setLoading(false);
          return;
        }

        console.log('[Property Fetch] 🚀 Fetching property from Repliers API with MLS number:', mlsNumber);

        const foundProperty = await getListingDetails(mlsNumber);
        
        if (!foundProperty) {
          console.error('[Property Fetch] ❌ Property not found for MLS number:', mlsNumber);
          setError(`Property not found for MLS number: ${mlsNumber}`);
          setLoading(false);
          return;
        }

        console.log('[Property Fetch] ✅ Property found:', {
          mlsNumber: foundProperty.mlsNumber,
          boardId: foundProperty.boardId,
          address: foundProperty.address?.location,
          type: foundProperty.type,
        });

        // Detect if this is a rental property (no redirect - keep SEO-friendly URL)
        const isRentalProperty = foundProperty.type === 'Lease' || foundProperty.type?.toLowerCase().includes('lease');
        setIsRental(isRentalProperty);
        
        // Fetch raw listing for imageInsights
        console.log('[Property Fetch] Fetching raw listing data for:', mlsNumber);
        let rawListing: SinglePropertyListingResponse | null = null;
        try {
          rawListing = await getRawListingDetails(mlsNumber);
        } catch (rawError) {
          console.warn('[Property Fetch] Failed to fetch raw listing (non-critical):', rawError);
          // Continue without raw listing - it's not critical
        }
        
        // Merge openHouse data from rawProperty into property
        const propertyWithOpenHouse = {
          ...foundProperty,
          openHouse: rawListing?.openHouse || foundProperty.openHouse
        };
        setProperty(propertyWithOpenHouse);
        setRawProperty(rawListing);

        console.log('[Property Fetch] ✅ Property loaded successfully:', mlsNumber);
      } catch (err) {
        // Enhanced error logging
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : undefined;
        const errorName = err instanceof Error ? err.name : undefined;
        
        console.error('[Property Fetch] Error details:', {
          message: errorMessage,
          name: errorName,
          stack: errorStack,
          error: err,
          mlsNumber: mlsNumber || 'NOT EXTRACTED',
          params: {
            cityName,
            propertyAddress,
            propertyId,
          },
        });
        
        setError(`Failed to load property details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (cityName && propertyAddress) {
      fetchPropertyDetails();
    } else if (propertyId) {
      fetchPropertyDetails();
    } else {
      setLoading(false);
      setError('Invalid URL');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityName, propertyAddress, propertyId, router]);

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
              onClick={() => router.push('/listings')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Properties
            </button>
          )}
        </div>
      </div>
    );
  }

  // Define navigation sections - rentals don't have history section
  const navigationSections = isRental
    ? [
        { id: 'description', label: 'Description' },
        { id: 'listing-details', label: 'Listing Details' },
        { id: 'available-units', label: 'Available Units' },
        { id: 'features', label: 'Neighborhood' },
        { id: 'lifestyle', label: 'Lifestyle' },
        { id: 'demographics', label: 'Demographics' },
        { id: 'calculators', label: 'Calculators' }
      ]
    : [
        { id: 'description', label: 'Description' },
        { id: 'listing-details', label: 'Listing Details' },
        { id: 'history', label: 'History' },
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
      <div className='container-1400 mt-5 mb-4'>
        {/* Breadcrumbs */}
        <Breadcrumbs property={property} isPreCon={false} isRent={isRental} />
        <BannerGallery property={property} />
      </div>
      {/* Sticky Navigation Panel */}
      <SectionNavigation sections={navigationSections} property={property} />
      <div className='container-1400'>
          
        <div className='flex flex-row gap-8'>
          <div className='w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef} data-banner-section>
              <Banner property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            </div>
            <ItemBody property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
          </div>
          <div className='w-[30%] flex flex-col gap-4 items-start gap-0 sticky top-[130px] self-start'>
            <BasicInfo property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
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

export default Item