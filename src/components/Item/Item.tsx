"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import { fetchPropertyListings } from '@/data/data'
import { PropertyListing } from '@/data/types' // Import the interface from types.ts

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
    return <div className="min-h-screen flex items-center justify-center">Loading property details...</div>;
  }

  if (error || !property) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Property not found'}</div>;
  }

  return (
    <div className='overflow-hidden bg-white'>
      <Banner property={property} />
      <ItemBody property={property} />
    </div>
  )
}

export default Item