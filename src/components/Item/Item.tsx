"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { fetchPropertyListings, getRawListingDetails } from '@/lib/api/properties'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import AgentCTA from './ItemBody/AgentCTA'
import PropertyAlerts from './ItemBody/PropertyAlerts'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import BannerGallery from './Banner/BannerGallery'
import SectionNavigation from './ItemBody/SectionNavigation'
import SimilarListings from './ItemBody/SimilarListings'
import StickyPropertyBar from './StickyPropertyBar'

// Mock pre-construction data
const getMockPreConData = () => ({
  projectName: 'Luxury Heights Condominiums',
  developer: 'Premium Developments Inc.',
  startingPrice: 450000,
  status: 'selling' as const,
  completion: {
    date: 'Q4 2025',
    progress: 35
  },
  details: {
    bedroomRange: '1-3',
    bathroomRange: '1-2',
    sqftRange: '650-1,200',
    totalUnits: 150,
    availableUnits: 45
  },
  features: ['Rooftop Terrace', 'Gym', 'Pool', 'Concierge'],
  depositStructure: '5% on signing, 10% within 6 months',
  description: 'Experience luxury living at its finest. Luxury Heights Condominiums offers a perfect blend of modern design and premium amenities. Located in the heart of the city, this pre-construction project features spacious units with stunning views, world-class amenities, and a prime location close to shopping, dining, and entertainment. Don\'t miss this opportunity to own a piece of luxury before completion.'
});

// Create mock property for pre-con projects
const createMockPreConProperty = (propertyId: string): PropertyListing => {
  const mockPreConData = getMockPreConData();
  
  return {
    mlsNumber: propertyId,
    status: mockPreConData.status,
    class: 'residential',
    type: 'Sale',
    listPrice: mockPreConData.startingPrice,
    listDate: new Date().toISOString(),
    lastStatus: mockPreConData.status,
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: 'Toronto',
      country: 'Canada',
      district: null,
      majorIntersection: null,
      neighborhood: 'Downtown',
      streetDirection: null,
      streetName: 'Main Street',
      streetNumber: '123',
      streetSuffix: null,
      unitNumber: null,
      zip: 'M5H 2N2',
      state: 'Ontario',
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: '123 Main Street, Toronto, Ontario M5H 2N2'
    },
    map: {
      latitude: 43.6532,
      longitude: -79.3832,
      point: null
    },
    details: {
      numBathrooms: 2,
      numBathroomsPlus: 2,
      numBedrooms: 2,
      numBedroomsPlus: 2,
      propertyType: mockPreConData.details.bedroomRange ? 'Condominium' : 'Condo',
      sqft: 850
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0,
      depth: 0,
      irregular: 0,
      legalDescription: mockPreConData.description,
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 850,
      features: '',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: '/images/p1.jpg',
      allImages: ['/images/p1.jpg', '/images/p2.jpg', '/images/p3.jpg', '/images/p3.jpg', '/images/p1.jpg']
    },
    preCon: mockPreConData
  };
};

// Remove the local Property interface definition

const Item: React.FC = () => {
  const params = useParams();
  const pathname = usePathname();
  const propertyId = params?.id as string || '';
  const bannerRef = useRef<HTMLDivElement>(null);
  
  // Check if this is a pre-construction project based on route
  const isPreCon = pathname?.includes('/pre-construction/') || false;
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [rawProperty, setRawProperty] = useState<SinglePropertyListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        if (isPreCon) {
          // For pre-con projects, use mock data
          const mockProperty = createMockPreConProperty(propertyId);
          setProperty(mockProperty);
          setRawProperty(null);
        } else {
          // Fetch both regular listing and raw listing for imageInsights
          const [listings, rawListing] = await Promise.all([
            fetchPropertyListings(),
            getRawListingDetails(propertyId)
          ]);
          
          const foundProperty = listings.find(p => p.mlsNumber === propertyId);
          
          if (foundProperty) {
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
        }
      } catch (err) {
        setError('Failed to load property details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, isPreCon]);

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
  // Hide 'history' section for pre-con projects
  const navigationSections = [
    { id: 'description', label: 'Description' },
    { id: 'listing-details', label: 'Listing Details' },
    ...(isPreCon ? [] : [{ id: 'history', label: 'History' }]),
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
        <BannerGallery property={property} />
      </div>
      {/* Sticky Navigation Panel */}
      <SectionNavigation sections={navigationSections} property={property} />
      <div className='container-1400'>
          
        
        
        <div className='flex flex-row gap-8'>
          <div className='w-[75%] flex flex-col gap-6'>
            <div ref={bannerRef}>
              <Banner property={property} rawProperty={rawProperty} isPreCon={isPreCon} />
            </div>
            <ItemBody property={property} isPreCon={isPreCon} />
          </div>
          <div className='w-[25%] flex flex-col items-start gap-6'>
            <BasicInfo property={property} rawProperty={rawProperty} isPreCon={isPreCon} />
            {/* <AgentCTA /> */}
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

      {!isPreCon && (
        <div className='container-1400 mt-20 mb-4'>
          <SimilarListings currentProperty={property} />
        </div>
      )}
    </div>
  )
}

export default Item