"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getListings } from '@/lib/api/properties';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/lib/types';
import ListingFilters from './ListingFilters';
import { LOCATIONS, REGIONS } from '@/lib/types/filters';
import SellRentToggle from '@/components/common/filters/SellRentToggle';
import { useHiddenProperties } from '@/hooks/useHiddenProperties';
import GlobalFilters from '../common/filters/GlobalFilters';
import { PropertyCardSkeleton } from '@/components/skeletons';

const Listings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
  const [filters, setFilters] = useState({
    location: 'all',
    locationArea: 'all',
    minPrice: 0,
    maxPrice: 1000000,
    bedrooms: 0,
    bathrooms: 0,
    propertyType: 'all',
    community: 'all',
    listingType: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const resultsPerPage = 12;
  const observerTarget = useRef<HTMLDivElement>(null);

  // Use hidden properties hook
  const { hideProperty, getVisibleProperties } = useHiddenProperties();

  // Get visible properties (properties minus hidden ones)
  const visibleProperties = getVisibleProperties(properties);

  // Load properties function
  const loadProperties = useCallback(async (page: number, append: boolean = false) => {
    if (isLoadingMore && append) return; // Prevent multiple simultaneous loads
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Build API parameters based on filters
      // Note: The API accepts both 'page' and 'pageNum', but we'll use 'pageNum' for consistency with other components
      const params: Record<string, string | number> = {
        resultsPerPage,
        pageNum: page, // API accepts pageNum parameter
        status: "A" // Active listings
      };
      
      // Only add filters if they have values
      if (filters.minPrice > 0) params.minPrice = filters.minPrice;
      if (filters.maxPrice < 1000000) params.maxPrice = filters.maxPrice;
      if (filters.bedrooms > 0) params.minBedrooms = filters.bedrooms;
      if (filters.bathrooms > 0) params.minBaths = filters.bathrooms;
      if (filters.propertyType !== 'all') params.propertyType = filters.propertyType;
      if (filters.community !== 'all') params.community = filters.community;
      
      // Add listing type filter (Sale or Lease) - use the listingType state
      if (listingType === 'sell') {
        params.type = 'Sale';
      } else if (listingType === 'rent') {
        params.type = 'Lease';
      }
      
      // Add location filter - send city parameter to Repliers API
      // If a specific city is selected (locationArea), use that; otherwise use the region name
      if (filters.location !== 'all') {
        // If a specific city is selected, use the city name
        if (filters.locationArea && filters.locationArea !== 'all') {
          params.city = filters.locationArea;
          console.log('City filter applied (API level):', {
            locationId: filters.location,
            cityName: filters.locationArea,
            params
          });
        } else {
          // If only region is selected, use the region name
          const selectedRegion = REGIONS.find(reg => reg.id === filters.location);
          if (selectedRegion) {
            params.city = selectedRegion.name;
            console.log('Region filter applied (API level):', {
              locationId: filters.location,
              regionName: selectedRegion.name,
              params
            });
          }
        }
      }
      
      console.log('Fetching with params:', params);
      
      // Call the API with the parameters
      const data = await getListings(params);
      console.log('API response:', data);
      
      if (data && data.listings) {
        // The API has already filtered by city, so we just need to filter by area if specified
        let filteredListings = data.listings;
        
        // City filtering is already done by the API via params.city
        // No additional client-side city filtering needed since API handles it
        
        // Apply listing type filter client-side as well (in case API doesn't filter correctly)
        filteredListings = filteredListings.filter(listing => 
          listingType === 'rent' ? listing.type === 'Lease' : listing.type === 'Sale'
        );
        
        if (append) {
          // Append new listings to existing ones
          setProperties(prev => [...prev, ...filteredListings]);
        } else {
          // Replace listings (initial load or filter change)
          setProperties(filteredListings);
        }
        
        // Update pagination info - use the total count from API response
        // The API returns the total count of matching listings in data.count
        const totalCountFromAPI = data.count || data.listings?.length || 0;
        setTotalResults(totalCountFromAPI);
        
        // Note: hasMore logic might need adjustment if area filtering reduces results
        // For now, we'll use the original API pagination info, but check if we have filtered results
        const hasFilteredResults = filters.locationArea && filters.locationArea !== 'all';
        setHasMore(hasFilteredResults ? filteredListings.length > 0 && page < (data.numPages || 1) : page < (data.numPages || 1));
        
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
        if (!append) {
          setProperties([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      if (!append) {
        setProperties([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, listingType, communities.length, isLoadingMore]);

  // Initial load and when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    // Reset properties when filters change
    setProperties([]);
    loadProperties(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Load more when scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          loadProperties(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, loading, currentPage, loadProperties]);

  // Handle property card click
  const handlePropertyClick = (property: PropertyListing) => {
    setSelectedProperty(property);
  };

  // Update filters
  const handleFilterChange = (e: { target: { name: string; value: string | number | string[] | { location: string; area: string } } }) => {
    const { name, value } = e.target;
    
    // Handle location and area updates together
    if (name === 'locationAndArea' && typeof value === 'object' && 'location' in value && 'area' in value) {
      setFilters({
        ...filters,
        location: value.location,
        locationArea: value.area
      });
    } else {
      // Handle individual field updates
      setFilters({
        ...filters,
        [name]: ['propertyType', 'community', 'listingType', 'location', 'locationArea', 'features'].includes(name) ? value : Number(value)
      });
    }
    
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      location: 'all',
      locationArea: 'all',
      minPrice: 0,
      maxPrice: 1000000,
      bedrooms: 0,
      bathrooms: 0,
      propertyType: 'all',
      community: 'all',
      listingType: 'all'
    });
  };

  // Handle listing type change
  const handleListingTypeChange = (type: 'sell' | 'rent') => {
    setListingType(type);
    // Update filters to trigger a refetch
    setFilters(prev => ({
      ...prev,
      listingType: type === 'sell' ? 'sell' : 'rent'
    }));
  };

  return (
    <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 mt-20">
      
      {/* Use the separated filter component */}
      <GlobalFilters
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          communities={communities}
          locations={LOCATIONS}
          showLocation={true}
          showPropertyType={true}
          showCommunity={true}
          showPrice={false}
          showBedrooms={false}
          showBathrooms={false}
          layout="horizontal"
          className="w-full md:w-auto"
        />
      
      {/* Results Header */}
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center mb-4">
        <div className="mb-4 sm:mb-0 flex items-center gap-4">
          <span className="text-gray-700 font-medium text-sm">
            Active Listings ({totalResults > 0 ? `${totalResults.toLocaleString()}` : `${properties.length}`} results)
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <SellRentToggle 
            listingType={listingType}
            onListingTypeChange={handleListingTypeChange}
          />
        </div>
      </div>
      
      {/* Property Listings */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {[...Array(12)].map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {visibleProperties.length > 0 ? (
            visibleProperties.map((property, index) => (
              <div 
                key={`${property.mlsNumber}-${index}`}
                className={`cursor-pointer transition-all ${selectedProperty?.mlsNumber === property.mlsNumber ? 'ring-2 ring-secondary' : ''}`}
                onClick={() => handlePropertyClick(property)}
              >
                <PropertyCard 
                  property={property} 
                  onHide={() => hideProperty(property.mlsNumber)}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 text-lg">No properties match your current filters.</p>
              <button 
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Infinite Scroll Observer Target */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isLoadingMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10 w-full">
            {[...Array(4)].map((_, index) => (
              <PropertyCardSkeleton key={`loading-${index}`} />
            ))}
          </div>
        )}
        {!hasMore && visibleProperties.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No more listings to load.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings