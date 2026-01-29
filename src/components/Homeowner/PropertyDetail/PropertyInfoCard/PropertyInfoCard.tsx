"use client";

import React, { useState } from 'react';
import { Edit, MoreVertical, MapPin, Bed, Bath, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import EditHomeModal from './EditHomeModal';
import AuthModal from '@/components/Auth/AuthModal';
import { useSession } from 'next-auth/react';

interface PropertyInfoCardProps {
  propertySlug?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  lotSize?: string;
  garage?: number | string;
  yearBuilt?: number | string;
  latitude?: number;
  longitude?: number;
  propertyImage?: string;
}

const PropertyInfoCard: React.FC<PropertyInfoCardProps> = ({
  propertySlug,
  streetNumber,
  streetName,
  city,
  state,
  zip,
  beds,
  baths,
  sqft,
  lotSize,
  garage,
  yearBuilt,
  latitude,
  longitude,
  propertyImage,
}) => {
  const { data: session } = useSession();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingOpenEdit, setPendingOpenEdit] = useState(false);

  const humanize = (value?: string) => {
    if (!value) return value;
    return value.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  };

  const displayStreetNumber = humanize(streetNumber);
  const displayStreetName = humanize(streetName);

  React.useEffect(() => {
    if (session && pendingOpenEdit) {
      setPendingOpenEdit(false);
      setIsAuthModalOpen(false);
      setIsEditOpen(true);
    }
  }, [session, pendingOpenEdit]);

  const primaryAddress = displayStreetNumber && displayStreetName 
    ? `${displayStreetNumber} ${displayStreetName}`
    : 'Address not available';
  
  const fullAddress = [streetNumber, streetName, city, state, zip]
    .filter(Boolean)
    .join(', ');

  // Generate static map URL (using Mapbox static images API)
  // Note: Mapbox token should be NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (fallback: NEXT_PUBLIC_MAPBOX_TOKEN)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapUrl = latitude && longitude && mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${longitude},${latitude})/${longitude},${latitude},15,0/300x300?access_token=${mapboxToken}`
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex gap-6">
        {/* Property Image or Map Thumbnail */}
        <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
          {propertyImage ? (
            <Image
              src={propertyImage}
              alt="Property"
              width={192}
              height={192}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                // Fallback to map if image fails
                if (mapUrl) {
                  (e.target as HTMLImageElement).src = mapUrl;
                } else {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('.fallback-placeholder')) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-gray-100';
                    placeholder.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
                    parent.appendChild(placeholder);
                  }
                }
              }}
            />
          ) : mapUrl ? (
            <Image
              src={mapUrl}
              alt="Property location"
              width={192}
              height={192}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent && !parent.querySelector('.fallback-placeholder')) {
                  const placeholder = document.createElement('div');
                  placeholder.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-gray-100';
                  placeholder.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
                  parent.appendChild(placeholder);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {primaryAddress}
              </h2>
              <p className="text-sm text-gray-500">
                {[city, state].filter(Boolean).join(', ') || 'Location not available'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (!session) {
                    setPendingOpenEdit(true);
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setIsEditOpen(true);
                }}
                className="px-3 py-1.5 text-secondary border border-secondary rounded-lg hover:bg-secondary/10 transition-colors flex items-center gap-1.5 text-sm font-medium"
                aria-label="Edit home"
              >
                <Edit className="w-4 h-4" />
                <span>Edit home</span>
              </button>
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <EditHomeModal
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            propertySlug={propertySlug}
            addressLine={fullAddress}
            streetNumber={streetNumber}
            streetName={streetName}
            city={city}
            state={state}
            zip={zip}
            beds={beds}
            baths={baths}
            sqft={sqft}
            lotSize={lotSize}
            garage={garage}
            yearBuilt={yearBuilt}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            redirectTo={false}
            onClose={() => {
              setIsAuthModalOpen(false);
            }}
          />

          {/* Property Attributes */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-gray-500" />
              <span>{beds || '-'} bed</span>
            </div>
            <span className="text-gray-300">-</span>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-gray-500" />
              <span>{baths || '-'} bath</span>
            </div>
            <span className="text-gray-300">-</span>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-gray-500" />
              <span>
                {sqft 
                  ? typeof sqft === 'number' 
                    ? `${sqft.toLocaleString()}` 
                    : sqft
                  : '-'} sqft
              </span>
            </div>
            {lotSize && (
              <>
                <span className="text-gray-300">-</span>
                <span>{lotSize} acre lot</span>
              </>
            )}
            {garage && (
              <>
                <span className="text-gray-300">-</span>
                <span>{garage} car garage</span>
              </>
            )}
            {yearBuilt && (
              <>
                <span className="text-gray-300">-</span>
                <span>{yearBuilt} year built</span>
              </>
            )}
          </div>

          {/* Value Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              We don't have enough information to calculate a value for this property.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInfoCard;
