import React from 'react'
import Link from 'next/link';
import { FaMapMarkerAlt, FaBed, FaBath, FaRuler } from 'react-icons/fa';

interface Property {
    id: string;
    propertyName: string;
    description: string;
    class: string;
    type: string;
    price: number;
    address: {
      area: string | null;
      city: string | null;
      country: string | null;
      district: string | null;
      majorIntersection: string | null;
      neighborhood: string | null;
      streetDirection: string | null;
      streetName: string | null;
      streetNumber: string | null;
      streetSuffix: string | null;
      unitNumber: string | null;
      zip: string | null;
      state: string | null;
      communityCode: string | null;
      streetDirectionPrefix: string | null;
      addressKey: string | null;
      location: string;
    };
    map: {
      latitude: number | null;
      longitude: number | null;
      point: string | null;
    };
    details: {
      bedrooms: number;
      bathrooms: number;
      size: number;
      landSize: number | string;
    };
    images: {
      imageUrl: string;
      allImages: string[];
    };
  }
  
interface ItemBodyProps {
  property: Property;
}

const ListingGrid: React.FC<ItemBodyProps> = ({ property }) => {
  // Helper function to get a valid image URL
  const getImageUrl = () => {
    // Check if imageUrl exists and is not empty
    if (property.images && property.images.imageUrl) {
      return property.images.imageUrl;
    }
    
    // Check if we have any images in the allImages array
    if (property.images && property.images.allImages && property.images.allImages.length > 0) {
      return property.images.allImages[0];
    }
    
    // Default fallback image
    return '/images/p1.jpg';
  };

  // Format price with commas
  const formatPrice = (price: number) => {
    return price ? price.toLocaleString() : '0';
  };

  // Helper function to safely get property name
  const getPropertyName = () => {
    if (property.propertyName) return property.propertyName;
    
    // Try to construct a name from address if available
    if (property.address) {
      const parts = [];
      if (property.address.streetNumber) parts.push(property.address.streetNumber);
      if (property.address.streetName) parts.push(property.address.streetName);
      if (parts.length > 0) return parts.join(' ');
      
      // If we have a location string, use that
      if (property.address.location) return property.address.location;
    }
    
    // Last resort
    return `Property ${property.id}`;
  };

  return (
    <Link target='_blank' href={`/property/${property.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="md:flex">
          <div className="md:w-1/3 h-48 md:h-auto relative">
            <img 
              src={getImageUrl()} 
              alt={getPropertyName()}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/p1.jpg';
              }}
            />
          </div>
          <div className="p-4 md:w-2/3">
            <div className="flex justify-between items-start">
              <h3 className="text-xl text-gray-800 mb-2">{getPropertyName()}</h3>
              <p className="text-xl font-bold text-secondary">
                ${formatPrice(property.price)}
              </p>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {property.description || `Beautiful property located in ${property.address?.city || 'a great area'}`}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FaBed className="mr-1 text-secondary" />
                <span className="font-semibold">{property.details?.bedrooms || 0}</span> Beds
              </div>
              <div className="flex items-center">
                <FaBath className="mr-1 text-secondary" />
                <span className="font-semibold">{property.details?.bathrooms || 0}</span> Baths
              </div>
              <div className="flex items-center">
                <FaRuler className="mr-1 text-secondary" />
                <span className="font-semibold">{property.details?.size ? formatPrice(property.details.size) : 'N/A'}</span> sqft
              </div>
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-1 text-secondary" />
                <span>
                  {property.address?.city || ''}{property.address?.city && property.address?.state ? ', ' : ''}
                  {property.address?.state || 'Location unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ListingGrid