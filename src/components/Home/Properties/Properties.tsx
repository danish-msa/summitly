import { useEffect, useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';
import { fetchPropertyListings } from '@/data/data';
import PropertyCard from '@/components/Helper/PropertyCard';
import PropertyFilters from './PropertyFilters';
import SellRentToggle from './SellRentToggle';
import { PropertyListing } from '@/data/types'; // Import the interface from types.ts
import { useLocationDetection } from '@/hooks/useLocationDetection';

// Custom type for filter change events
type FilterChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | {
  target: {
    name: string;
    value: { location: string; area: string } | string;
  };
};

const Properties = () => {
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
  const [filters, setFilters] = useState({
    propertyType: 'all',
    community: 'all',
    location: 'all',
    locationArea: 'all'
  });
  
  // Location detection
  const { location } = useLocationDetection();

  // Function to match detected location with available locations
  const matchLocationWithFilters = (detectedLocation: { city: string; area: string; fullLocation: string }) => {
    // Define the available locations (same as in PropertyFilters)
    const availableLocations = [
      { id: "gta", name: "Greater Toronto Area", areas: ["All of GTA", "Toronto", "Durham", "Halton", "Peel", "York"] },
      { id: "toronto", name: "Toronto", areas: ["All of Toronto", "Etobicoke", "North York", "Scarborough", "Toronto & East York"] },
      { id: "durham", name: "Durham", areas: ["All of Durham", "Ajax", "Pickering", "Whitby", "Oshawa"] },
      { id: "halton", name: "Halton", areas: ["All of Halton", "Burlington", "Oakville", "Milton"] },
      { id: "peel", name: "Peel", areas: ["All of Peel", "Brampton", "Mississauga", "Caledon"] },
      { id: "york", name: "York", areas: ["All of York", "Markham", "Vaughan", "Richmond Hill", "Aurora"] },
      { id: "outside-gta", name: "Outside GTA", areas: ["All Outside GTA", "Hamilton", "Niagara", "Barrie", "Kitchener-Waterloo"] }
    ];

    // Try to find a match
    for (const loc of availableLocations) {
      // Check if the detected city matches any location name
      if (detectedLocation.city.toLowerCase().includes(loc.name.toLowerCase()) || 
          loc.name.toLowerCase().includes(detectedLocation.city.toLowerCase())) {
        return { location: loc.id, area: loc.areas[0] || 'all' };
      }
      
      // Check if any area matches
      for (const area of loc.areas) {
        if (detectedLocation.area.toLowerCase().includes(area.toLowerCase()) ||
            area.toLowerCase().includes(detectedLocation.area.toLowerCase())) {
          return { location: loc.id, area };
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
        setFilters(prev => ({
          ...prev,
          location: matchedLocation.location,
          locationArea: matchedLocation.area
        }));
      }
    }
  }, [location, filters.location]);

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

  // Handle filter changes
  const handleFilterChange = (e: FilterChangeEvent) => {
    const { name, value } = e.target;
    
    // Handle special case for location and area selection
    if (name === 'locationAndArea' && typeof value === 'object' && 'location' in value && 'area' in value) {
      console.log('Setting location and area:', { location: value.location, area: value.area });
      setFilters({
        ...filters,
        location: value.location,
        locationArea: value.area
      });
    } else if (typeof value === 'string') {
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };

  // Handle listing type change (sell/rent)
  const handleListingTypeChange = (type: 'sell' | 'rent') => {
    setListingType(type);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      propertyType: 'all',
      community: 'all',
      location: 'all',
      locationArea: 'all'
    });
  };

  if (loading) return <div className="text-center py-10">Loading properties...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

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