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
import NewItemBody, { NewItemBodyRef } from './NewItemBody/NewItemBody'
import PropertyHeader from './NewItemBody/PropertyHeader'
import ModernBannerGallery from './Banner/ModernBannerGallery'
import PriceCard from './NewItemBody/PriceCard'
import Description from './ItemBody/Description'
import Sidebar from './ItemBody/Sidebar'
import PropertiesComparison from './PropertiesComparison/PropertiesComparison'

const Item: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const newItemBodyRef = useRef<NewItemBodyRef>(null);
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

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      let mlsNumber: string | undefined;
      
      try {
        // Extract MLS number from URL
        if (cityName && propertyAddress) {
          // New URL structure: /{citySlug}/{streetNumber}-{streetName}-{mlsNumber}
          const parsed = parsePropertyUrl(cityName, propertyAddress);
          
          if (!parsed) {
            setError('Invalid property URL');
            setLoading(false);
            return;
          }

          // Extract MLS number from URL - this is the primary method
          if (parsed.mlsNumber) {
            mlsNumber = parsed.mlsNumber;
          } else {
            setError('Property URL must include MLS number');
            setLoading(false);
            return;
          }
        } else if (propertyId) {
          // Fallback to old URL structure (using MLS number directly)
          mlsNumber = propertyId;
        } else {
          setError('Invalid URL - MLS number required');
          setLoading(false);
          return;
        }

        // Fetch property directly from Repliers API using MLS number
        if (!mlsNumber) {
          setError('MLS number not found in URL');
          setLoading(false);
          return;
        }

        const foundProperty = await getListingDetails(mlsNumber);
        
        if (!foundProperty) {
          setError(`Property not found for MLS number: ${mlsNumber}`);
          setLoading(false);
          return;
        }

        // Detect if this is a rental property (no redirect - keep SEO-friendly URL)
        const isRentalProperty = foundProperty.type === 'Lease' || foundProperty.type?.toLowerCase().includes('lease');
        setIsRental(isRentalProperty);
        
        // Fetch raw listing for imageInsights
        let rawListing: SinglePropertyListingResponse | null = null;
        try {
          rawListing = await getRawListingDetails(mlsNumber);
        } catch (rawError) {
          // Continue without raw listing - it's not critical
        }
        
        // Merge openHouse data from rawProperty into property
        const propertyWithOpenHouse = {
          ...foundProperty,
          openHouse: rawListing?.openHouse || foundProperty.openHouse
        };
        setProperty(propertyWithOpenHouse);
        setRawProperty(rawListing);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
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

  // Determine if this is a pre-construction property
  const isPreCon = !!property.preCon;

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
    <div>
      {/* Sticky Property Bar */}
      {/* <StickyPropertyBar property={property} bannerRef={bannerRef} /> */}
      {/* <div className='container-1400 mt-10 mb-4'>
        <Breadcrumbs property={property} isPreCon={false} isRent={isRental} />
        <BannerGallery property={property} />
      </div> */}
      
      {/* <div className='container-1400'>
      <SectionNavigation sections={navigationSections} property={property} />
        <div className='flex flex-row gap-8'>
          <div className='w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef} data-banner-section>
              <Banner property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            </div>
            <NewItemBody property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} /> */}
            {/* <ItemBody property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} /> */}
          {/* </div>
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
      </div> */}

      <div className='container-1400 px-4 sm:px-6 lg:px-8 mt-10 mb-4'>

        <StickyPropertyBar 
          property={property} 
          bannerRef={bannerRef}
          onCalculatorClick={() => {
            newItemBodyRef.current?.setActiveTab('calculators');
            setTimeout(() => {
              newItemBodyRef.current?.scrollToSection();
            }, 100);
          }}
        />
        {/* Breadcrumbs */}
        <Breadcrumbs property={property} isPreCon={false} isRent={isRental} />
        <PropertyHeader 
          property={property}
          onCalculatorClick={() => {
            newItemBodyRef.current?.setActiveTab('calculators');
            setTimeout(() => {
              newItemBodyRef.current?.scrollToSection();
            }, 100);
          }}
        />
        
        <div className='flex flex-row gap-8 mt-6 mb-10'>
          <div className='w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef} data-banner-section>
              <ModernBannerGallery property={property} />
            </div>
            <Description property={property} isPreCon={isPreCon} />

            {/* <div ref={bannerRef} data-banner-section>
              <Banner property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            </div> */}
            
          </div>
          <div className='w-[30%] flex flex-col gap-4 items-start gap-0 sticky top-2 self-start'>
            <PriceCard property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            <BasicInfo property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            <Sidebar isPreCon={isPreCon} isRent={isRental} property={property} />
          </div>
        </div>
        <NewItemBody 
          ref={newItemBodyRef}
          property={property} 
          rawProperty={rawProperty} 
          isPreCon={isPreCon} 
          isRent={isRental} 
        />
        <PropertiesComparison currentProperty={property} />
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