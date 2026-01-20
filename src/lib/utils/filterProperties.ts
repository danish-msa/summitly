import { PropertyListing } from '@/lib/types';
import { FilterState, REGIONS } from '@/lib/types/filters';

/**
 * Filter properties based on filter state
 * This function applies all filters from the FilterState to a list of properties
 */
export function filterPropertiesByState(
  properties: PropertyListing[],
  filters: FilterState
): PropertyListing[] {
  let filtered = [...properties];

  // Filter by property type
  if (filters.propertyType && filters.propertyType !== 'all') {
    filtered = filtered.filter(property => {
      const propType = property.details?.propertyType?.toLowerCase() || '';
      const filterType = filters.propertyType.toLowerCase();
      
      // Exact match
      if (propType === filterType) return true;
      
      // Handle variations
      if (filterType === 'condominium' || filterType === 'condo') {
        return propType.includes('condo');
      }
      if (filterType === 'single family detached' || filterType === 'detached') {
        return propType.includes('detached');
      }
      if (filterType === 'townhouse') {
        return propType.includes('townhouse') || propType.includes('att/row');
      }
      if (filterType === 'multifamily') {
        return propType.includes('multi') || propType.includes('duplex') || propType.includes('triplex');
      }
      
      // Partial match
      return propType.includes(filterType) || filterType.includes(propType);
    });
  }

  // Filter by price range
  if (filters.minPrice > 0) {
    filtered = filtered.filter(property => property.listPrice >= filters.minPrice);
  }
  if (filters.maxPrice && filters.maxPrice < 2000000) {
    filtered = filtered.filter(property => property.listPrice <= filters.maxPrice);
  }

  // Filter by bedrooms
  if (filters.bedrooms > 0) {
    filtered = filtered.filter(property => {
      const bedrooms = property.details?.numBedrooms || 0;
      return bedrooms >= filters.bedrooms;
    });
  }

  // Filter by bathrooms
  if (filters.bathrooms > 0) {
    filtered = filtered.filter(property => {
      const bathrooms = property.details?.numBathrooms || 0;
      return bathrooms >= filters.bathrooms;
    });
  }

  // Filter by square feet
  if (filters.minSquareFeet && filters.minSquareFeet > 0) {
    filtered = filtered.filter(property => {
      const sqft = typeof property.details?.sqft === 'string' 
        ? parseInt(property.details.sqft.replace(/,/g, '')) || 0
        : (property.details?.sqft as number) || 0;
      return sqft >= filters.minSquareFeet!;
    });
  }
  if (filters.maxSquareFeet && filters.maxSquareFeet > 0) {
    filtered = filtered.filter(property => {
      const sqft = typeof property.details?.sqft === 'string' 
        ? parseInt(property.details.sqft.replace(/,/g, '')) || 0
        : (property.details?.sqft as number) || 0;
      return sqft <= filters.maxSquareFeet!;
    });
  }

  // Filter by community/neighborhood
  if (filters.community && filters.community !== 'all') {
    filtered = filtered.filter(property => {
      const neighborhood = property.address?.neighborhood?.toLowerCase() || '';
      const community = filters.community.toLowerCase();
      return neighborhood.includes(community) || community.includes(neighborhood);
    });
  }

  // Filter by location (region and/or city)
  if (filters.location && filters.location !== 'all') {
    const selectedRegion = REGIONS.find(reg => reg.id === filters.location);
    
    if (filters.locationArea && filters.locationArea !== 'all') {
      // Filter by specific city/area within the region
      filtered = filtered.filter(property => {
        const area = property.address?.area?.toLowerCase() || '';
        const neighborhood = property.address?.neighborhood?.toLowerCase() || '';
        const city = property.address?.city?.toLowerCase() || '';
        const locationArea = filters.locationArea.toLowerCase();
        
        // Check if property matches the selected city/area
        const matchesArea = area.includes(locationArea) || 
                           neighborhood.includes(locationArea) || 
                           city.includes(locationArea) ||
                           locationArea.includes(city) ||
                           locationArea.includes(neighborhood) ||
                           locationArea.includes(area);
        
        // Also verify it's in the selected region
        if (selectedRegion && matchesArea) {
          return selectedRegion.cities.some(regionCity => {
            const regionCityLower = regionCity.toLowerCase();
            return city === regionCityLower || 
                   city.includes(regionCityLower) || 
                   regionCityLower.includes(city);
          });
        }
        
        return matchesArea;
      });
    } else {
      // Filter by region only (all cities in that region)
      if (selectedRegion) {
        filtered = filtered.filter(property => {
          const city = property.address?.city?.toLowerCase() || '';
          const area = property.address?.area?.toLowerCase() || '';
          const neighborhood = property.address?.neighborhood?.toLowerCase() || '';
          
          // Check if property city matches any city in the selected region
          return selectedRegion.cities.some(regionCity => {
            const regionCityLower = regionCity.toLowerCase();
            return city === regionCityLower || 
                   city.includes(regionCityLower) || 
                   regionCityLower.includes(city) ||
                   area.includes(regionCityLower) ||
                   neighborhood.includes(regionCityLower);
          });
        });
      }
    }
  } else if (filters.locationArea && filters.locationArea !== 'all') {
    // If only locationArea is set (without region), filter by city/area
    filtered = filtered.filter(property => {
      const area = property.address?.area?.toLowerCase() || '';
      const neighborhood = property.address?.neighborhood?.toLowerCase() || '';
      const city = property.address?.city?.toLowerCase() || '';
      const locationArea = filters.locationArea.toLowerCase();
      
      return area.includes(locationArea) || 
             neighborhood.includes(locationArea) || 
             city.includes(locationArea) ||
             locationArea.includes(city) ||
             locationArea.includes(neighborhood) ||
             locationArea.includes(area);
    });
  }

  // Filter by listing type
  if (filters.listingType && filters.listingType !== 'all') {
    filtered = filtered.filter(property => {
      if (filters.listingType === 'sell') {
        return property.type === 'Sale';
      } else if (filters.listingType === 'rent') {
        return property.type === 'Lease';
      }
      return true;
    });
  }

  // Filter by year built (if provided as string like "2020" or "all")
  if (filters.yearBuilt && filters.yearBuilt !== 'all') {
    const yearBuilt = parseInt(filters.yearBuilt);
    if (!isNaN(yearBuilt)) {
      filtered = filtered.filter(property => {
        const propYear = property.details?.yearBuilt;
        if (!propYear) return false;
        return propYear >= yearBuilt;
      });
    }
  }

  // Filter by pre-construction status
  if (filters.preConStatus && filters.preConStatus !== 'all') {
    // This would need to be implemented based on your pre-construction data structure
    // For now, we'll skip this as it's specific to pre-construction properties
  }

  // Filter by construction status
  if (filters.constructionStatus && filters.constructionStatus !== 'all') {
    // This would need to be implemented based on your construction status data structure
  }

  return filtered;
}
