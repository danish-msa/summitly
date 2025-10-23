"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useRouter } from 'next/navigation';
import { PropertyListing } from '@/lib/types';
import MapSearchBox from './MapSearchBox';

interface GooglePropertyMapProps {
  properties: PropertyListing[];
  selectedProperty: PropertyListing | null;
  onPropertySelect: (property: PropertyListing) => void;
  onBoundsChange: (bounds: {north: number; south: number; east: number; west: number}) => void;
}

// Map container styles
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (Toronto area)
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832
};

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const GooglePropertyMap: React.FC<GooglePropertyMapProps> = ({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  onBoundsChange
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const router = useRouter();
  const [infoWindow, setInfoWindow] = useState<{
    property: PropertyListing;
    position: google.maps.LatLng;
  } | null>(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Initialize marker clusterer
  const initializeClusterer = useCallback((map: google.maps.Map) => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    clustererRef.current = new MarkerClusterer({
      map,
      markers: markersRef.current
    });
  }, []);

  // Create property markers
  const createMarkers = useCallback((map: google.maps.Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    if (validProperties.length === 0) return;

    // Create markers for each property
    validProperties.forEach(property => {
      if (!property.map.latitude || !property.map.longitude) return;

      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'property-marker';
      markerElement.innerHTML = `
        <div style="
          background: ${selectedProperty?.mlsNumber === property.mlsNumber ? '#e74c3c' : '#4a60a1'};
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        ">
          $${(property.listPrice / 1000).toFixed(0)}k
        </div>
      `;

      const marker = new google.maps.Marker({
        position: {
          lat: property.map.latitude,
          lng: property.map.longitude
        },
        map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="${selectedProperty?.mlsNumber === property.mlsNumber ? '#e74c3c' : '#4a60a1'}" stroke="white" stroke-width="2"/>
              <text x="20" y="25" text-anchor="middle" fill="white" font-size="10" font-weight="bold">$${(property.listPrice / 1000).toFixed(0)}k</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        title: `${property.details.propertyType} - $${property.listPrice.toLocaleString()}`
      });

      // Add click event to marker
      marker.addListener('click', () => {
        onPropertySelect(property);
        setInfoWindow({
          property,
          position: marker.getPosition()!
        });
      });

      markersRef.current.push(marker);
    });

    // Initialize clusterer with new markers
    initializeClusterer(map);
  }, [properties, selectedProperty, onPropertySelect, initializeClusterer]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // Add bounds change listener
    map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChange({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng()
        });
      }
    });

    // Create initial markers
    createMarkers(map);
  }, [createMarkers, onBoundsChange]);

  // Update markers when properties change
  useEffect(() => {
    if (mapRef.current) {
      createMarkers(mapRef.current);
    }
  }, [createMarkers]);

  // Center map on selected property
  useEffect(() => {
    if (!mapRef.current || !selectedProperty || !selectedProperty.map.latitude || !selectedProperty.map.longitude) return;

        const position = {
          lat: selectedProperty.map.latitude!,
          lng: selectedProperty.map.longitude!
        };

    mapRef.current.panTo(position);
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || 10, 12));

    // Show info window for selected property
    setInfoWindow({
      property: selectedProperty,
      position: new google.maps.LatLng(position.lat, position.lng)
    });
  }, [selectedProperty]);

  // Fit map to show all properties
  useEffect(() => {
    if (!mapRef.current || properties.length === 0) return;

    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    if (validProperties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    validProperties.forEach(property => {
      bounds.extend({
        lat: property.map.latitude!,
        lng: property.map.longitude!
      });
    });

    mapRef.current.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    });
  }, [properties]);

  const handleInfoWindowClose = () => {
    setInfoWindow(null);
  };

  const handleViewProperty = (property: PropertyListing) => {
    router.push(`/property/${property.mlsNumber}`);
  };

  // Handle search place selection
  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult) => {
    if (!mapRef.current || !place.geometry?.location) return;

    const location = place.geometry.location;
    const position = {
      lat: location.lat(),
      lng: location.lng()
    };

    // Pan to the selected place
    mapRef.current.panTo(position);
    mapRef.current.setZoom(15);

    // Update bounds
    const bounds = mapRef.current.getBounds();
    if (bounds) {
      onBoundsChange({
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      });
    }
  }, [onBoundsChange]);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    // Reset to show all properties
    if (mapRef.current && properties.length > 0) {
      const validProperties = properties.filter(
        p => p.map.latitude && p.map.longitude
      );

      if (validProperties.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        validProperties.forEach(property => {
          bounds.extend({
            lat: property.map.latitude!,
            lng: property.map.longitude!
          });
        });

        mapRef.current.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        });
      }
    }
  }, [properties]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Search Box */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <MapSearchBox
          onPlaceSelect={handlePlaceSelect}
          onClear={handleSearchClear}
          className="max-w-md"
        />
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onMapLoad}
        options={mapOptions}
      >
        {/* Info Window */}
        {infoWindow && (
          <InfoWindow
            position={infoWindow.position}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="property-info-window" style={{ width: '280px', padding: '0' }}>
              <div className="relative">
                <img 
                  src={infoWindow.property.images.imageUrl} 
                  alt={infoWindow.property.details.propertyType}
                  style={{
                    width: '100%',
                    height: '160px',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">
                    {infoWindow.property.details.propertyType} in {infoWindow.property.address.city}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {infoWindow.property.address.location}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-primary">
                      ${infoWindow.property.listPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {infoWindow.property.details.numBedrooms} bd | {infoWindow.property.details.numBathrooms} ba | {infoWindow.property.details.sqft} sqft
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewProperty(infoWindow.property)}
                    className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary transition-colors font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default GooglePropertyMap;
