import React from 'react'
import { PropertyListing } from '@/data/types' // Import the interface from types.ts

interface LocationProps {
  property: PropertyListing;
}

const Location: React.FC<LocationProps> = ({ property }) => {
  // Create a formatted address string for the map query
  const getMapQuery = () => {
    // If we have latitude and longitude, use those for precise location
    if (property.map.latitude && property.map.longitude) {
      return `&center=${property.map.latitude},${property.map.longitude}&q=${property.map.latitude},${property.map.longitude}`;
    }
    
    // Otherwise build an address query from available address components
    const addressParts = [];
    
    if (property.address.streetNumber) addressParts.push(property.address.streetNumber);
    if (property.address.streetName) addressParts.push(property.address.streetName);
    if (property.address.streetSuffix) addressParts.push(property.address.streetSuffix);
    if (property.address.city) addressParts.push(property.address.city);
    if (property.address.state) addressParts.push(property.address.state);
    if (property.address.zip) addressParts.push(property.address.zip);
    if (property.address.country) addressParts.push(property.address.country);
    
    // If we have address parts, use them
    if (addressParts.length > 0) {
      return `&q=${encodeURIComponent(addressParts.join(' '))}`;
    }
    
    // Fallback to the location string if available
    if (property.address.location) {
      return `&q=${encodeURIComponent(property.address.location)}`;
    }
    
    // Ultimate fallback
    return "&q=Property+Location";
  };

  return (
    <div className="space-y-6">
      {/* Map Section */}
      <div className="w-full h-80 bg-gray-200 rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyB0KWOeJWvvAoo5pbLcqYTnqhCv1mp3X5U${getMapQuery()}`}
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="flex flex-col space-y-2">
          <span className="text-gray-500">Street Address</span>
          <span className="text-gray-900 font-semibold">{property.address.streetNumber} {property.address.streetName} {property.address.streetSuffix}</span>
        </div>
        <div className="flex flex-col space-y-2">
          <span className="text-gray-500">City</span>
          <span className="text-gray-900 font-semibold">{property.address.city}</span>
        </div>
        <div className="flex flex-col space-y-2">
          <span className="text-gray-500">District</span>
          <span className="text-gray-900 font-semibold">{property.address.district}</span>
        </div>
        <div className="flex flex-col space-y-2">
          <span className="text-gray-500">Neighborhood</span>
          <span className="text-gray-900 font-semibold">{property.address.neighborhood}</span>
        </div>
        <div className="flex flex-col space-y-2">
          <span className="text-gray-500">State</span>
          <span className="text-gray-900 font-semibold">{property.address.state}</span>
        </div>
        <div className="flex flex-col space-y-2">
          <span className="text-gray-500">Country</span>
          <span className="text-gray-900 font-semibold">{property.address.country}</span>
        </div>
      </div>
    </div>
  )
}

export default Location