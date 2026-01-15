"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { PropertyListing } from '@/lib/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import StickyPropertyBar from '../Item/StickyPropertyBar'
import Breadcrumbs from '../Item/Breadcrumbs'
import ModernBannerGallery from '../Item/Banner/ModernBannerGallery'
import NewItemBody, { NewItemBodyRef } from '../Item/NewItemBody/NewItemBody'
import PropertyHeader from '../Item/NewItemBody/PropertyHeader'
import PriceCard from '../Item/NewItemBody/PriceCard'
import Description from '../Item/ItemBody/Description'
import RightSidebar from './PreConItemBody/RightSidebar'
import { PreConFAQ } from '../PreCon/FAQ/FAQ'
import { PreConContactSection } from '../PreConItem/PreConItemBody/PreConContactSection'

const PreConItem: React.FC = () => {
  const params = useParams();
  const propertyId = params?.slug as string || '';
  const bannerRef = useRef<HTMLDivElement>(null);
  const newItemBodyRef = useRef<NewItemBodyRef>(null);
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        // Fetch from API using mlsNumber (slug)
        const response = await fetch(`/api/pre-con-projects/${propertyId}`);
        if (!response.ok) {
          setError('Property not found');
          return;
        }
        
        const data = await response.json();
        if (data.project) {
          setProperty(data.project);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
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

  // Pre-con specific flags
  const isPreCon = true;
  const isRental = false;

  return (
    
    <>
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
      <Breadcrumbs property={property} isPreCon={isPreCon} isRent={isRental} />
      
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
        </div>
        <div className='w-[30%] flex flex-col gap-4 items-start gap-0 sticky top-2 self-start'>
          <PriceCard property={property} rawProperty={null} isPreCon={isPreCon} isRent={isRental} />
          <RightSidebar property={property} />
        </div>
      </div>
      
      <NewItemBody 
        ref={newItemBodyRef}
        property={property} 
        rawProperty={null} 
        isPreCon={isPreCon} 
        isRent={isRental} 
      />
      <PreConFAQ />
      <PreConContactSection />
    </div>
    

    </>
  )
}

export default PreConItem

