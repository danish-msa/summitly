"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { fetchPropertyListings } from '@/lib/api/properties'
import { PropertyListing } from '@/lib/types'
import AgentCTA from './ItemBody/AgentCTA'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// Remove the local Property interface definition

const Item: React.FC = () => {
  const params = useParams();
  const propertyId = params?.id as string || '';
  
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
      <div className='container-1400 mt-28 mb-28'>
        <div className='flex flex-row gap-6'>
          <div className='w-[70%] flex flex-col gap-6'>
            <Banner property={property} />
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