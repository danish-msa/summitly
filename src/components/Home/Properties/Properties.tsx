import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import SectionHeading from '@/components/Helper/SectionHeading';
import { RepliersAPI } from '@/lib/api/repliers';
import PropertyCard from '@/components/Helper/PropertyCard';
import PropertyFilters from './PropertyFilters';
import SellRentToggle from '@/components/common/filters/SellRentToggle';
import { PropertyListing } from '@/data/types'; // Import the interface from types.ts
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useHiddenProperties } from '@/hooks/useHiddenProperties';
import { FilterChangeEvent, LOCATIONS } from '@/lib/types/filters';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PropertyCardSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const Properties = () => {
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();
  
  // Use hidden properties hook
  const { hideProperty, getVisibleProperties } = useHiddenProperties();
  
  // Location detection
  const { location } = useLocationDetection();

  // Function to match detected location with available locations
  const matchLocationWithFilters = (detectedLocation: { city: string; area: string; fullLocation: string }) => {
    // Use the same LOCATIONS data as the filter components
    for (const loc of LOCATIONS) {
      // Check if the detected city matches any location name
      if (detectedLocation.city.toLowerCase().includes(loc.name.toLowerCase()) || 
          loc.name.toLowerCase().includes(detectedLocation.city.toLowerCase())) {
        return { location: loc.id, area: loc.areas?.[0] || 'all' };
      }
      
      // Check if any area matches
      if (loc.areas) {
        for (const area of loc.areas) {
          if (detectedLocation.area.toLowerCase().includes(area.toLowerCase()) ||
              area.toLowerCase().includes(detectedLocation.area.toLowerCase())) {
            return { location: loc.id, area };
          }
        }
      }
    }
    
    return null; // No match found
  };

  // Auto-populate filters when location is detected
  useEffect(() => {
    if (location && filters.location === 'all') {
      const matchedLocation = matchLocationWithFilters(location);
      if (matchedLocation) {
        const event = {
          target: {
            name: 'locationAndArea',
            value: { location: matchedLocation.location, area: matchedLocation.area }
          }
        } as FilterChangeEvent;
        handleFilterChange(event);
      }
    }
  }, [location, filters.location, handleFilterChange]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch only 30 properties initially for homepage performance
        // Use API limit instead of fetching all then slicing
        const result = await RepliersAPI.listings.getFiltered({
          status: 'A',
          resultsPerPage: 30,
          page: 1,
        });
        
        if (!isMounted || controller.signal.aborted) return;
        
        // Result already contains transformed PropertyListing[]
        const limitedListings = result.listings || [];
        
        setAllProperties(limitedListings);
        setFilteredProperties(limitedListings);
        
        // Extract unique communities from limited data
        const uniqueCommunities = Array.from(
          new Set(
            limitedListings
              .map(listing => listing.address.neighborhood)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (err) {
        if (!controller.signal.aborted && isMounted) {
          setError('Failed to load property listings');
          console.error('Error loading properties:', err);
        }
      } finally {
        if (!controller.signal.aborted && isMounted) {
          setLoading(false);
        }
      }
    };

    loadProperties();
    
    // Cleanup: abort fetch on unmount
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Filter properties based on current filters
  useEffect(() => {
    let filtered = [...allProperties];
    
    // First filter by listing type (sell/rent)
    // Based on the API response, we check the 'type' field
    // For rent: type === "Lease", For sell: type !== "Lease" (or type === "Sale")
    filtered = filtered.filter(property => {
      const propertyType = property.type;
      
      if (listingType === 'rent') {
        return propertyType === 'Lease' || propertyType?.toLowerCase().includes('lease');
      } else {
        return propertyType !== 'Lease' && !propertyType?.toLowerCase().includes('lease');
      }
    });
    
    // Debug: Log some sample property data to understand the structure
    if (allProperties.length > 0 && filters.location !== 'all') {
      console.log('Sample property data:', {
        city: allProperties[0].address.city,
        neighborhood: allProperties[0].address.neighborhood,
        area: allProperties[0].address.area,
        location: filters.location,
        locationArea: filters.locationArea,
        listingType: listingType,
        propertyType: allProperties[0].type
      });
    }

    // Filter by property type
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(property => 
        property.details.propertyType.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    // Filter by community
    if (filters.community !== 'all') {
      filtered = filtered.filter(property => 
        property.address.neighborhood === filters.community
      );
    }

    // Filter by location
    if (filters.location !== 'all') {
      const locationAreas = {
        'gta': ['toronto', 'durham', 'halton', 'peel', 'york'],
        'toronto': ['etobicoke', 'north york', 'scarborough', 'toronto & east york', 'toronto'],
        'durham': ['ajax', 'pickering', 'whitby', 'oshawa', 'durham'],
        'halton': ['burlington', 'oakville', 'milton', 'halton'],
        'peel': ['brampton', 'mississauga', 'caledon', 'peel'],
        'york': ['markham', 'vaughan', 'richmond hill', 'aurora', 'york'],
        'outside-gta': ['hamilton', 'niagara', 'barrie', 'kitchener-waterloo', 'kitchener', 'waterloo']
      };

      const areas = locationAreas[filters.location as keyof typeof locationAreas] || [];
      
      if (filters.locationArea !== 'all' && filters.locationArea) {
        // Filter by specific area - more flexible matching
        filtered = filtered.filter(property => {
          const city = property.address.city?.toLowerCase() || '';
          const neighborhood = property.address.neighborhood?.toLowerCase() || '';
          const area = property.address.area?.toLowerCase() || '';
          const areaToMatch = filters.locationArea.toLowerCase();
          
          // Remove common words for better matching
          const cleanAreaToMatch = areaToMatch.replace(/^(all of|all)\s+/i, '').trim();
          
          return city.includes(cleanAreaToMatch) || 
                 neighborhood.includes(cleanAreaToMatch) ||
                 area.includes(cleanAreaToMatch) ||
                 cleanAreaToMatch.includes(city) ||
                 cleanAreaToMatch.includes(neighborhood) ||
                 cleanAreaToMatch.includes(area);
        });
      } else {
        // Filter by region (all areas in that region) - more flexible matching
        filtered = filtered.filter(property => {
          const city = property.address.city?.toLowerCase() || '';
          const neighborhood = property.address.neighborhood?.toLowerCase() || '';
          const area = property.address.area?.toLowerCase() || '';
          
          // First try exact matching
          const exactMatch = areas.some(areaName => {
            const cleanAreaName = areaName.replace(/^(all of|all)\s+/i, '').trim();
            return city.includes(cleanAreaName) || 
                   neighborhood.includes(cleanAreaName) ||
                   area.includes(cleanAreaName) ||
                   cleanAreaName.includes(city) ||
                   cleanAreaName.includes(neighborhood) ||
                   cleanAreaName.includes(area);
          });
          
          // If no exact match, try partial matching for common variations
          if (!exactMatch) {
            return areas.some(areaName => {
              const cleanAreaName = areaName.replace(/^(all of|all)\s+/i, '').trim();
              // Try partial word matching
              const cityWords = city.split(' ');
              const neighborhoodWords = neighborhood.split(' ');
              const areaWords = area.split(' ');
              
              return cityWords.some(word => cleanAreaName.includes(word)) ||
                     neighborhoodWords.some(word => cleanAreaName.includes(word)) ||
                     areaWords.some(word => cleanAreaName.includes(word)) ||
                     cleanAreaName.split(' ').some(word => city.includes(word)) ||
                     cleanAreaName.split(' ').some(word => neighborhood.includes(word)) ||
                     cleanAreaName.split(' ').some(word => area.includes(word));
            });
          }
          
          return exactMatch;
        });
      }
    }

    // Filter by price range
    if (filters.minPrice > 0 || filters.maxPrice < 2000000) {
      filtered = filtered.filter(property => {
        const price = property.listPrice;
        return price >= filters.minPrice && price <= filters.maxPrice;
      });
    }

    // Filter by bedrooms
    if (filters.bedrooms > 0) {
      filtered = filtered.filter(property => {
        const bedrooms = property.details.numBedrooms || 0;
        if (filters.bedrooms === 5) {
          return bedrooms >= 5; // 5+ bedrooms
        }
        return bedrooms === filters.bedrooms;
      });
    }

    // Filter by bathrooms
    if (filters.bathrooms > 0) {
      filtered = filtered.filter(property => {
        const bathrooms = property.details.numBathrooms || 0;
        if (filters.bathrooms === 4) {
          return bathrooms >= 4; // 4+ bathrooms
        }
        return bathrooms === filters.bathrooms;
      });
    }

    // Debug: Log filtering results
    if (filters.location !== 'all') {
      console.log('Current filter state:', filters);
      console.log('Filtering results:', {
        originalCount: allProperties.length,
        filteredCount: filtered.length,
        location: filters.location,
        locationArea: filters.locationArea,
        sampleFiltered: filtered.slice(0, 3).map(p => ({
          city: p.address.city,
          neighborhood: p.address.neighborhood,
          area: p.address.area
        }))
      });
    }
    
    setFilteredProperties(filtered);
  }, [allProperties, filters, listingType]);

  // Handle listing type change (sell/rent)
  const handleListingTypeChange = (type: 'sell' | 'rent') => {
    setListingType(type);
  };

  // Get visible properties (filtered properties minus hidden ones)
  const visibleProperties = getVisibleProperties(filteredProperties);

  // Handle carousel API updates
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);


  if (loading) return (
    <div className='pt-12 sm:pt-16 pb-12 sm:pb-16'>
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'>
        <SectionHeading 
          heading='Browse the Latest Properties' 
          subheading='Latest Properties' 
          description='Explore our latest property listings to find your perfect home, investment opportunity, or commercial space.' 
        />
        
        <div className='flex flex-col lg:flex-row gap-4 mt-6 sm:mt-8 mb-2 sm:mb-4 sm:gap-5'>
          {/* Filters skeleton */}
          <div className="flex-1 w-full lg:w-auto">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center lg:items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Properties Carousel Skeleton */}
        <div className="mt-8 sm:mt-2 relative">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1 md:-ml-2">
              {[...Array(8)].map((_, index) => (
                <CarouselItem 
                  key={index}
                  className="pl-1 md:pl-2 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <PropertyCardSkeleton />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="pt-12 sm:pt-16 pb-12 sm:pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Properties</h3>
          <p className="text-sm text-red-600 text-center mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='pt-12 sm:pt-16 pb-12 sm:pb-16'>
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'>
        <SectionHeading 
          heading='Browse the Latest Properties' 
          subheading='Latest Properties' 
          description='Explore our latest property listings to find your perfect home, investment opportunity, or commercial space.' 
          
        />
        
         <div className='flex flex-col lg:flex-row gap-4 mt-6 sm:mt-8 mb-2 sm:mb-4 sm:gap-5'>
           {/* Left side - Property Filters */}
           <div className="flex-1 w-full lg:w-auto">
             <PropertyFilters 
               filters={filters}
               handleFilterChange={handleFilterChange}
               resetFilters={resetFilters}
               communities={communities}
               locations={LOCATIONS}
               showAdvanced={false}
             />
           </div>
           
           {/* Right side - Sell/Rent Toggle and Results count */}
           <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center lg:items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
             {/* Sell/Rent Toggle */}
              <SellRentToggle 
                listingType={listingType}
                onListingTypeChange={handleListingTypeChange}
              />
           </div>
         </div>

        {/* Properties Carousel */}
        {visibleProperties.length > 0 ? (
          <div className="mt-8 sm:mt-2 relative">
            {/* Navigation Buttons - Positioned above the carousel */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-12 -right-12 flex gap-1 justify-between items-center z-10 pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => carouselApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
                aria-label="Previous slide"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => carouselApi?.scrollNext()}
                disabled={!canScrollNext}
                className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
                aria-label="Next slide"
              >
                <ArrowRight className="h-6 w-6" />
              </Button>
            </div>

            <Carousel
              setApi={setCarouselApi}
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-1 md:-ml-2">
                {visibleProperties.map((property) => (
                  <CarouselItem 
                    key={property.mlsNumber}
                    className="pl-1 md:pl-2 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <PropertyCard 
                      property={property} 
                      onHide={() => hideProperty(property.mlsNumber)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-10 mt-8 sm:mt-10">
            <p className="text-gray-500 text-lg">No properties match your current filters.</p>
            <button 
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* View All Properties Button */}
        {visibleProperties.length > 0 && (
          <div className="text-center mt-8 sm:mt-10">
            <Link
              href="/listings"
              className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/90 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
            >
              View All Properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;