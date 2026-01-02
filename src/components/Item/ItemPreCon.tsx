"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { PropertyListing } from '@/lib/types'
import PropertyAlerts from './ItemBody/PropertyAlerts'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import BannerGallery from './Banner/BannerGallery'
import SectionNavigation from './ItemBody/SectionNavigation'
import StickyPropertyBar from './StickyPropertyBar'
import Breadcrumbs from './Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

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

const ItemPreCon: React.FC = () => {
  const params = useParams();
  const propertyId = params?.id as string || '';
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPropertyAlertsOpen, setIsPropertyAlertsOpen] = useState(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        // For pre-con projects, use mock data
        const mockProperty = createMockPreConProperty(propertyId);
        setProperty(mockProperty);
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
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Property not found'}</div>;
  }

  // Define navigation sections for pre-con (no history section)
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
      <div className='container-1400 mt-5 mb-4'>
        {/* Breadcrumbs */}
        <Breadcrumbs property={property} isPreCon={true} />
        <BannerGallery property={property} />
      </div>
      {/* Sticky Navigation Panel */}
      <SectionNavigation sections={navigationSections} property={property} />
      <div className='container-1400'>
          
        <div className='flex flex-row gap-8'>
          <div className='w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef} data-banner-section>
              <Banner property={property} rawProperty={null} isPreCon={true} />
            </div>
            <ItemBody property={property} isPreCon={true} />
          </div>
          <div className='w-[30%] flex flex-col gap-4 items-start gap-0 sticky top-[130px] self-start'>
            <BasicInfo property={property} rawProperty={null} isPreCon={true} />
            <Button
              variant="outline"
              onClick={() => setIsPropertyAlertsOpen(true)}
              className="w-full justify-start gap-2"
            >
              <Bell className="h-4 w-4" />
              Set Property Alerts
            </Button>
            <PropertyAlerts 
              open={isPropertyAlertsOpen}
              onOpenChange={setIsPropertyAlertsOpen}
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
    </div>
  )
}

export default ItemPreCon

