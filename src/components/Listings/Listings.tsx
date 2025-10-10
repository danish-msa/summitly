"use client";

import React, { useState, useEffect } from 'react';
import { getListings } from '@/data/data';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/data/types';
import { FaSort } from 'react-icons/fa';
import ListingFilters from './ListingFilters';

const Listings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000000,
    bedrooms: 0,
    bathrooms: 0,
    propertyType: 'all',
    community: 'all',
    listingType: 'all'
  });
  const [sortOption, setSortOption] = useState('newest');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 12
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

  // Update filters
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: ['propertyType', 'community', 'listingType'].includes(name) ? value : Number(value)
    });
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 1000000,
      bedrooms: 0,
      bathrooms: 0,
      propertyType: 'all',
      community: 'all',
      listingType: 'all'
    });
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    
    // Sort the properties based on the selected option
    const sortedProperties = [...properties];
    
    switch(e.target.value) {
      case 'price-asc':
        sortedProperties.sort((a, b) => a.listPrice - b.listPrice);
        break;
      case 'price-desc':
        sortedProperties.sort((a, b) => b.listPrice - a.listPrice);
        break;
      case 'beds-desc':
        sortedProperties.sort((a, b) => b.details.numBedrooms - a.details.numBedrooms);
        break;
      case 'baths-desc':
        sortedProperties.sort((a, b) => b.details.numBathrooms - a.details.numBathrooms);
        break;
      case 'sqft-desc':
        sortedProperties.sort((a, b) => {
          // Convert sqft values to numbers for comparison
          const sqftA = typeof a.details.sqft === 'string' ? parseInt(a.details.sqft) || 0 : a.details.sqft;
          const sqftB = typeof b.details.sqft === 'string' ? parseInt(b.details.sqft) || 0 : b.details.sqft;
          return sqftB - sqftA;
        });
        break;
      case 'newest':
      default:
        // Assuming newer listings have higher MLS numbers or using a timestamp if available
        sortedProperties.sort((a, b) => b.mlsNumber.localeCompare(a.mlsNumber));
        break;
    }
    
    setProperties(sortedProperties);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({
        ...pagination,
        currentPage: newPage
      });
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    <div className="container mx-auto py-16 px-4">
      
      {/* Use the separated filter component */}
      <ListingFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        resetFilters={resetFilters}
        communities={communities}
      />
      
      {/* Results Header */}
      <div className="w-[95%] mx-auto flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="mb-4 sm:mb-0">
          <span className="text-gray-700 font-medium">
            Active Listings ({pagination.totalResults > 0 ? `${pagination.totalResults.toLocaleString()})` : `${properties.length} results`}
          </span>
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center">
          <FaSort className="mr-2 text-gray-600" />
          <label className="mr-2 text-gray-700">Sort by:</label>
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="beds-desc">Most Bedrooms</option>
            <option value="baths-desc">Most Bathrooms</option>
            <option value="sqft-desc">Largest Size</option>
          </select>
        </div>
      </div>
      
      {/* Property Listings */}
      <div className="w-[95%] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {properties.length > 0 ? (
          properties.map((property) => (
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
            <button 
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-10">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`px-3 py-1 rounded-l-md border ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                // Show pages around current page
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 border-t border-b ${
                      pagination.currentPage === pageNum 
                        ? 'bg-primary text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`px-3 py-1 rounded-r-md border ${pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Listings