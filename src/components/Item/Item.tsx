"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { fetchPropertyListings } from '@/lib/api/properties'
import { PropertyListing } from '@/lib/types'
import AgentCTA from './ItemBody/AgentCTA'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import StickyPropertyBar from './StickyPropertyBar'

// Remove the local Property interface definition

const Item: React.FC = () => {
  const params = useParams();
  const propertyId = params?.id as string || '';
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const listings = await fetchPropertyListings();
        const foundProperty = listings.find(p => p.mlsNumber === propertyId);
        
        if (foundProperty) {
          setProperty(foundProperty);
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

  return (
    <div className='bg-background'>
      {/* Sticky Property Bar */}
      <StickyPropertyBar property={property} bannerRef={bannerRef} />
      
      <div className='container-1400 mt-28 mb-28'>
        <div className='flex flex-row gap-6'>
          <div className='w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef}>
              <Banner property={property} />
            </div>
            <ItemBody property={property} />
          </div>
          <div className='w-[30%] flex flex-col items-start gap-6'>
            <BasicInfo property={property} />
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