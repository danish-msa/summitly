"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Banner from '../Item/Banner/Banner'
import PreConItemBody from './PreConItemBody/PreConItemBody'
import { PropertyListing } from '@/lib/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import BannerGallery from '../Item/Banner/BannerGallery'
import SectionNavigation from '../Item/ItemBody/SectionNavigation'
import StickyPropertyBar from '../Item/StickyPropertyBar'
import Breadcrumbs from './Breadcrumbs'
import RightSidebar from './PreConItemBody/RightSidebar'
import PreConFAQ from '../PreCon/FAQ/FAQ'
import { getPreConProject } from '@/data/mockPreConData'

const PreConItem: React.FC = () => {
  const params = useParams();
  const propertyId = params?.id as string || '';
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        // For pre-con projects, use mock data
        // TODO: Replace with actual API call
        const mockProperty = getPreConProject(propertyId);
        if (mockProperty) {
          setProperty(mockProperty);
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
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Property not found'}</div>;
  }

  // Define navigation sections for pre-con (different from regular property pages)
  const navigationSections = [
    { id: 'description', label: 'Description' },
    { id: 'project-details', label: 'Details' },
    { id: 'pricing-incentives', label: 'Pricing & Incentives' },
    { id: 'deposit-structure', label: 'Deposit Structure' },
    { id: 'available-units', label: 'Available Units' },
    { id: 'amenities-neighborhood-lifestyle', label: 'Amenities & Lifestyle' },
    { id: 'documents', label: 'Documents (PDFs)' }
  ];

  return (
    <div className='bg-background'>
      {/* Sticky Property Bar */}
      <StickyPropertyBar property={property} bannerRef={bannerRef} />
      <div className='container-1400 mt-5 mb-4'>
        {/* Breadcrumbs */}
        <Breadcrumbs property={property} />
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
            <PreConItemBody property={property} />
          </div>
          <div className='w-[30%] flex flex-col gap-4 items-start gap-0 sticky top-[130px] self-start'>
            <RightSidebar property={property} />
          </div>
        </div>
      </div>
      <div className='container-1400 mt-20 mb-4'>
        <PreConFAQ />
      </div>
    </div>
  )
}

export default PreConItem

