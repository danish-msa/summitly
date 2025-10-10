"use client";

import React, { useState, useEffect } from 'react';
import { getListings } from '@/data/data';
import { FaMapMarkerAlt, FaList } from 'react-icons/fa';
import PropertyCard from '@/components/Helper/PropertyCard';
import ListingFilters from './ListingFilters';
import dynamic from 'next/dynamic';
import { PropertyListing } from '@/data/types'; // Import the interface from types.ts

// Dynamically import the Map component with no SSR to avoid hydration issues
const PropertyMap = dynamic(() => import('@/components/MapSearch/PropertyMap'), { ssr: false });

// Remove the local PropertyListing interface since we're importing it from types.ts

const Listings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000000,
    bedrooms: 0,
    bathrooms: 0,
    propertyType: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [mapFilterEnabled, setMapFilterEnabled] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 20
  });

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
        if (filters.maxPrice < 1000000) params.maxPrice = filters.maxPrice;
        if (filters.bedrooms > 0) params.minBedrooms = filters.bedrooms;
        if (filters.bathrooms > 0) params.minBaths = filters.bathrooms;
        if (filters.propertyType !== 'all') params.propertyType = filters.propertyType;
        
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

  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Update filters
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'propertyType' ? value : Number(value)
    });
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };

  // Handle map bounds change
  const handleMapBoundsChange = (bounds: {north: number; south: number; east: number; west: number}) => {
    setMapBounds(bounds);
  };

  // Toggle map filtering
  const toggleMapFiltering = () => {
    setMapFilterEnabled(!mapFilterEnabled);
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
    <div className="container mx-auto py-24 px-4">
      <div className="flex justify-between items-center mb-6">
        {/* Filters Panel */}
        <ListingFilters 
          filters={filters}
          showFilters={showFilters}
          toggleFilters={toggleFilters}
          handleFilterChange={handleFilterChange}
        />
        <div className="flex space-x-4">
          {/* Results Count */}
          <div className="hidden sm:flex items-center">
            <span className="text-gray-700 font-medium">
              {pagination.totalResults > 0 ? `${pagination.totalResults.toLocaleString()} properties found` : `${filteredProperties.length} results`}
            </span>
          </div>
          
          {/* Map Filter Toggle */}
          {(viewMode === 'map' || viewMode === 'split') && (
            <button 
              onClick={toggleMapFiltering}
              className={`px-3 py-2 rounded border ${mapFilterEnabled ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              {mapFilterEnabled ? 'Map Filter On' : 'Map Filter Off'}
            </button>
          )}
          
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
      </div>

      <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
        {/* Property Listings */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'split' ? 'calc(100vh - 200px)' : 'auto' }}>
            {/* Results Count */}
            <div className="hidden sm:flex items-center mb-4">
              <span className="text-gray-700 font-medium">
                {filteredProperties.length} results
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
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
            <PropertyMap 
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