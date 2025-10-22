import { useEffect, useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';
import { fetchPropertyListings } from '@/data/data';
import PropertyCard from '@/components/Helper/PropertyCard';
import PropertyFilters from './PropertyFilters';
import SellRentToggle from './SellRentToggle';
import { PropertyListing } from '@/data/types'; // Import the interface from types.ts
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { FilterChangeEvent, LOCATIONS } from '@/lib/types/filters';

const Properties = () => {
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();
  
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
    const loadProperties = async () => {
      try {
        const listings = await fetchPropertyListings();
        setAllProperties(listings);
        setFilteredProperties(listings);
        
        // Extract unique communities from the data
        const uniqueCommunities = Array.from(
          new Set(
            listings
              .map(listing => listing.address.neighborhood)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (err) {
        setError('Failed to load property listings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
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

  if (loading) return (
    <div className="pt-12 sm:pt-16 pb-12 sm:pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            {/* Property-themed loading spinner */}
            <div className="relative w-16 h-16">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full animate-spin-slow"></div>
              
              {/* Middle ring */}
              <div className="absolute inset-2 border-3 border-gray-300 rounded-full animate-spin-reverse"></div>
              
              {/* Inner ring */}
              <div className="absolute inset-4 border-2 border-secondary rounded-full animate-spin animate-pulse-glow"></div>
              
              {/* Center house icon */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-secondary rounded-sm animate-pulse-glow"></div>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2 animate-fade-in">
            Loading Properties...
          </h3>
          <p className="text-sm text-gray-600 mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Fetching the latest listings for you
          </p>
          
          {/* Progress indicator */}
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-secondary via-blue-500 to-secondary rounded-full animate-progress-fill"></div>
          </div>
          
          {/* Loading steps */}
          <div className="mt-4 space-y-2 text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div>
              <span className="font-medium">Searching properties</span>
            </div>
            <div className="flex items-center justify-center space-x-2 animate-fade-in" style={{ animationDelay: '1s' }}>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Loading images</span>
            </div>
            <div className="flex items-center justify-center space-x-2 animate-fade-in" style={{ animationDelay: '1.5s' }}>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Preparing results</span>
            </div>
          </div>
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
        
         <div className='flex flex-col lg:flex-row gap-4 mt-8 sm:gap-5'>
           {/* Left side - Property Filters */}
           <div className="flex-1">
             <PropertyFilters 
               filters={filters}
               handleFilterChange={handleFilterChange}
               resetFilters={resetFilters}
               communities={communities}
               locations={LOCATIONS}
             />
           </div>
           
           {/* Right side - Sell/Rent Toggle and Results count */}
           <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
             {/* Sell/Rent Toggle */}
             <SellRentToggle 
               listingType={listingType}
               onListingTypeChange={handleListingTypeChange}
             />
             
             {/* Results count */}
             <div className="flex items-center relative">
               <span className="text-gray-600 text-xs w-48 absolute top-8 right-0 text-right">
                 Showing {filteredProperties.length} of {allProperties.length} properties
               </span>
             </div>
           </div>
         </div>

         
        
        {/* Properties Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10'>
          {filteredProperties.length > 0 ? (
            filteredProperties.slice(0, 8).map((property) => (
              <PropertyCard key={property.mlsNumber} property={property} />
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
      </div>
    </div>
  );
};

export default Properties;