"use client";

import React, { useState, useEffect } from 'react';
import { getListings } from '@/lib/api/properties';
import { FaMapMarkerAlt, FaList } from 'react-icons/fa';
import PropertyCard from '@/components/Helper/PropertyCard';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import dynamic from 'next/dynamic';
import { PropertyListing } from '@/lib/types';

// Dynamically import the Google Maps component with no SSR to avoid hydration issues
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

// Remove the local PropertyListing interface since we're importing it from types.ts

const Listings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [mapFilterEnabled] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 20
  });

  // Use global filters
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();

  // Load properties with filters applied
  useEffect(() => {
    const loadProperties = async () => {
      // Only show loading indicator on initial load, not when filtering
      if (properties.length === 0) {
        setLoading(true);
      }
      
      try {
        // Build API parameters based on filters
        const params: Record<string, string | number> = {
          resultsPerPage: pagination.resultsPerPage,
          pageNum: pagination.currentPage,
          status: "A" // Active listings
        };
        
        // Only add filters if they have values
        if (filters.minPrice > 0) params.minPrice = filters.minPrice;
        if (filters.maxPrice < 2000000) params.maxPrice = filters.maxPrice;
        if (filters.bedrooms > 0) params.minBedrooms = filters.bedrooms;
        if (filters.bathrooms > 0) params.minBaths = filters.bathrooms;
        if (filters.propertyType !== 'all') params.propertyType = filters.propertyType;
        if (filters.community !== 'all') params.community = filters.community;
        if (filters.listingType !== 'all') params.listingType = filters.listingType;
        
        console.log('Fetching with params:', params);
        
        // Call the API with the parameters
        const data = await getListings(params);
        console.log('API response:', data);
        
        if (data && data.listings) {
          setProperties(data.listings);
          
          // Update pagination info
          setPagination({
            ...pagination,
            totalPages: data.numPages || 1,
            totalResults: data.count || data.listings.length
          });
          
          // Extract unique communities from the data
          if (communities.length === 0) {
            const uniqueCommunities = Array.from(
              new Set(
                data.listings
                  .map(listing => listing.address.neighborhood)
                  .filter(Boolean) as string[]
              )
            ).sort();
            setCommunities(uniqueCommunities);
          }
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [filters, pagination.currentPage, pagination.resultsPerPage]);

  // Handle property card click
  const handlePropertyClick = (property: PropertyListing) => {
    setSelectedProperty(property);
  };


  // Handle map bounds change
  const handleMapBoundsChange = (bounds: {north: number; south: number; east: number; west: number}) => {
    setMapBounds(bounds);
  };


  // Filter properties based on map bounds if enabled
  const filteredProperties = mapFilterEnabled && mapBounds 
    ? properties.filter(property => {
        return property.map.latitude && property.map.longitude &&
          property.map.latitude <= mapBounds.north &&
          property.map.latitude >= mapBounds.south &&
          property.map.longitude <= mapBounds.east &&
          property.map.longitude >= mapBounds.west;
      })
    : properties;

  if (loading) {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-10 pb-24 px-4">
      {/* Global Filters */}
      <div className="bg-white rounded-lg p-4 flex flex-col md:flex-row md:flex-wrap justify-between items-start md:items-center mt-8 mb-2 gap-4">
        <GlobalFilters
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          communities={communities}
          locations={LOCATIONS}
          showLocation={true}
          showPropertyType={true}
          showCommunity={true}
          showPrice={true}
          showBedrooms={true}
          showBathrooms={true}
          layout="horizontal"
          className="w-full md:w-auto"
        />
        {/* View Mode Toggles */}
        <div className="flex border rounded-md overflow-hidden">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <FaList />
            </button>
            <button 
              onClick={() => setViewMode('split')}
              className={`px-3 py-2 ${viewMode === 'split' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <div className="flex gap-1">
                <FaList className="w-3" />
                <FaMapMarkerAlt className="w-3" />
              </div>
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 ${viewMode === 'map' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <FaMapMarkerAlt />
            </button>
          </div>
      </div>


      <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
        {/* Property Listings */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'split' ? 'calc(100vh - 200px)' : 'auto' }}>
            {/* Results Count */}
            <div className="hidden sm:flex items-center mb-2">
              <span className="text-gray-700 font-medium text-sm">
                {filteredProperties.length} results
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <div 
                    key={property.mlsNumber}
                    className={`cursor-pointer transition-all ${selectedProperty?.mlsNumber === property.mlsNumber ? 'ring-2 ring-secondary' : ''}`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <PropertyCard property={property} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 text-lg">No properties match your current filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} style={{ height: viewMode === 'split' ? 'calc(100vh - 200px)' : '70vh' }}>
            <GooglePropertyMap 
              properties={filteredProperties}
              selectedProperty={selectedProperty}
              onPropertySelect={handlePropertyClick}
              onBoundsChange={handleMapBoundsChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings