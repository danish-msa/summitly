import { useEffect, useState, useRef } from 'react';
import { fetchPropertyListings } from '@/data/data';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/data/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimilarListingsProps {
  currentProperty: PropertyListing;
}

const SimilarListings = ({ currentProperty }: SimilarListingsProps) => {
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingType, setListingType] = useState<'sale' | 'sold'>('sale');
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const listings = await fetchPropertyListings();
        setAllProperties(listings);
      } catch (err) {
        setError('Failed to load similar listings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Filter properties based on listing type and exclude current property
  useEffect(() => {
    let filtered = [...allProperties];
    
    // Exclude current property
    filtered = filtered.filter(property => property.mlsNumber !== currentProperty.mlsNumber);
    
    // Filter by listing type
    if (listingType === 'sale') {
      // For sale: type !== "Lease" (or type === "Sale")
      filtered = filtered.filter(property => {
        const propertyType = property.type;
        return propertyType !== 'Lease' && !propertyType?.toLowerCase().includes('lease');
      });
    } else {
      // Similar sold: properties that are sold - try multiple possible statuses
      filtered = filtered.filter(property => {
        const propertyType = property.type?.toLowerCase() || '';
        const propertyStatus = property.status?.toLowerCase() || '';
        
        // Check for various sold/closed statuses
        return propertyType.includes('sold') || 
               propertyType.includes('closed') ||
               propertyStatus.includes('sold') ||
               propertyStatus.includes('closed') ||
               propertyStatus.includes('completed') ||
               propertyStatus.includes('finalized');
      });
    }
    
    // Limit to 12 properties for performance
    filtered = filtered.slice(0, 12);
    
    setFilteredProperties(filtered);
  }, [allProperties, listingType, currentProperty]);

  // Handle listing type change
  const handleListingTypeChange = (type: 'sale' | 'sold') => {
    setListingType(type);
  };

  // Slider navigation functions
  const nextSlide = () => {
    const slidesPerView = getSlidesPerView();
    const maxPosition = Math.max(0, filteredProperties.length - slidesPerView);
    setCurrentSlide(prev => prev < maxPosition ? prev + 1 : 0);
  };

  const prevSlide = () => {
    const slidesPerView = getSlidesPerView();
    const maxPosition = Math.max(0, filteredProperties.length - slidesPerView);
    setCurrentSlide(prev => prev > 0 ? prev - 1 : maxPosition);
  };

  // Get number of slides per view based on screen size
  const getSlidesPerView = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1; // sm
    if (window.innerWidth < 1024) return 2; // lg
    if (window.innerWidth < 1280) return 3; // xl
    return 3; // 2xl+
  };

  // Calculate total possible positions
  const getTotalPositions = () => {
    const slidesPerView = getSlidesPerView();
    return Math.max(1, filteredProperties.length - slidesPerView + 1);
  };

  // Reset slide when filtered properties change
  useEffect(() => {
    setCurrentSlide(0);
  }, [filteredProperties]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading similar listings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (filteredProperties.length === 0) {
    return (
      <div className="py-8">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Similar Properties</h3>
          
          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleListingTypeChange('sale')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                listingType === 'sale'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Sale
            </button>
            <button
              onClick={() => handleListingTypeChange('sold')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                listingType === 'sold'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Similar Sold
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No {listingType === 'sale' ? 'Properties for Sale' : 'Recently Sold Properties'} Found
          </h4>
          <p className="text-gray-500 mb-4">
            {listingType === 'sale' 
              ? 'There are currently no similar properties available for sale in this area.'
              : 'There are currently no recently sold properties similar to this one.'
            }
          </p>
          <button
            onClick={() => handleListingTypeChange('sale')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            View Properties for Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Similar Properties</h3>
        
        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleListingTypeChange('sale')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              listingType === 'sale'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            For Sale
          </button>
          <button
            onClick={() => handleListingTypeChange('sold')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              listingType === 'sold'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Similar Sold
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredProperties.length} {listingType === 'sale' ? 'properties for sale' : 'recently sold properties'}
        </p>
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
          disabled={currentSlide >= getTotalPositions() - 1}
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>

        {/* Slider */}
        <div 
          ref={sliderRef}
          className="overflow-hidden"
        >
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * (100 / getSlidesPerView())}%)`,
            }}
          >
            {filteredProperties.map((property, index) => (
              <div 
                key={property.mlsNumber} 
                className="flex-shrink-0"
                style={{ width: `${100 / getSlidesPerView()}%` }}
              >
                <div className="px-2">
                  <PropertyCard property={property} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarListings;
