import { ChevronDown } from "lucide-react";
import { AmenityCategory, Amenity } from './types';
import { FiltersSection } from './FiltersSection';
import { AmenityCard } from './AmenityCard';

interface CategoryContentProps {
  category: AmenityCategory;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}

// Filter function to match API filter logic
const filterAmenity = (
  amenity: Amenity, 
  filterLabel: string, 
  categoryId: string,
  filterTypes?: string[]
): boolean => {
  if (filterLabel === 'All') {
    return true;
  }

  const name = amenity.name.toLowerCase();
  const types = amenity.types || [amenity.type.toLowerCase()];
  const hasType = (typeToCheck: string) => {
    const checkLower = typeToCheck.toLowerCase();
    return types.some(t => {
      const tLower = t.toLowerCase();
      // Exact match is preferred
      if (tLower === checkLower) return true;
      // Also check if type contains the check string (for compound types)
      // But be careful - 'park' should match 'park' but not 'amusement_park' unless explicitly checking for 'park'
      if (checkLower.includes('_')) {
        // If checking for compound type like 'movie_theater', require exact match
        return tLower === checkLower;
      }
      // For simple types, check if it's the exact word (not substring)
      // e.g., 'park' should match 'park' but not 'amusement_park'
      return tLower === checkLower || tLower.split('_').includes(checkLower);
    });
  };

  // If filter has types information from API, use that directly (most accurate)
  if (filterTypes && filterTypes.length > 0) {
    // Use exact type matching for API-provided types
    const amenityTypesLower = types.map(t => t.toLowerCase());
    return filterTypes.some(filterType => {
      const filterTypeLower = filterType.toLowerCase();
      return amenityTypesLower.includes(filterTypeLower);
    });
  }

  // Map filter labels back to type names for dynamic filters
  // This must match the API's typeNameMap
  const labelToTypeMap: Record<string, string | string[]> = {
    'Movie Theaters': 'movie_theater',
    'Shopping Malls': 'shopping_mall',
    'Grocery Stores': 'grocery_or_supermarket',
    'Department Stores': 'department_store',
    'Hindu Temples': 'hindu_temple',
    'Places of Worship': 'place_of_worship',
    'Sports Complexes': 'sports_complex',
    'Fast Food': 'meal_takeaway',
    'Gas Stations': 'gas_station',
    'Post Offices': 'post_office',
    'Transit Stations': 'transit_station',
    'Bus Stations': 'bus_station',
    'Subway Stations': 'subway_station',
    'Fire Stations': 'fire_station',
    'Restaurants': 'restaurant',
    'Cafes': 'cafe',
    'Bakeries': 'bakery',
    'Gyms': 'gym',
    'Stadiums': 'stadium',
    'Parks': 'park',
    'Playgrounds': 'playground',
    'Libraries': 'library',
    'Banks': 'bank',
    'Pharmacies': 'pharmacy',
    'Hospitals': 'hospital',
    'ATMs': 'atm',
    'Casinos': 'casino',
    'Amusement Parks': 'amusement_park',
    'Bowling Alleys': 'bowling_alley',
    'Night Clubs': 'night_club',
    'Supermarkets': 'supermarket',
    'Churches': 'church',
    'Mosques': 'mosque',
    'Synagogues': 'synagogue',
    'Schools': 'school',
    'Police Stations': 'police',
  };

  // Check if it's a dynamic filter (type-based)
  const typeFromLabel = labelToTypeMap[filterLabel];
  if (typeFromLabel) {
    const typesToCheck = Array.isArray(typeFromLabel) ? typeFromLabel : [typeFromLabel];
    return typesToCheck.some(type => hasType(type));
  }

  // Handle predefined filters
  switch (categoryId) {
    case 'entertainment':
      switch (filterLabel) {
        case 'Casinos':
          return hasType('casino');
        case 'Cinemas':
          return hasType('movie_theater');
        case 'Theaters':
          return hasType('amusement_park') || 
                 name.includes('theater') || 
                 name.includes('theatre');
        default:
          // Try to match by type name if it's a formatted type name
          const entTypeName = filterLabel.toLowerCase().replace(/\s+/g, '_');
          return hasType(entTypeName);
      }
    case 'shopping':
      switch (filterLabel) {
        case 'Malls':
          return hasType('shopping_mall');
        case 'Department Stores':
          return hasType('department_store');
        case 'Grocery':
          return hasType('supermarket') || hasType('grocery_or_supermarket');
        default:
          const shopTypeName = filterLabel.toLowerCase().replace(/\s+/g, '_');
          return hasType(shopTypeName);
      }
    case 'worship':
      switch (filterLabel) {
        case 'Churches':
          return hasType('church');
        case 'Temples':
          return hasType('hindu_temple') || name.includes('temple');
        case 'Mosques':
          return hasType('mosque') || name.includes('mosque');
        default:
          const worshipTypeName = filterLabel.toLowerCase().replace(/\s+/g, '_');
          return hasType(worshipTypeName);
      }
    case 'sports':
      switch (filterLabel) {
        case 'Arenas':
          return hasType('stadium') || name.includes('arena');
        case 'Gyms':
          return hasType('gym') || name.includes('fitness') || name.includes('gym');
        case 'Parks':
          return hasType('park');
        default:
          const sportsTypeName = filterLabel.toLowerCase().replace(/\s+/g, '_');
          return hasType(sportsTypeName);
      }
    case 'food':
      switch (filterLabel) {
        case 'Restaurants':
          return hasType('restaurant') && !hasType('meal_takeaway');
        case 'Fast Food':
          return hasType('meal_takeaway') || 
                 name.includes('mcdonald') ||
                 name.includes('burger') ||
                 name.includes('pizza');
        case 'Cafes':
          return hasType('cafe') || 
                 name.includes('coffee') ||
                 name.includes('tim hortons') ||
                 name.includes('starbucks');
        default:
          const foodTypeName = filterLabel.toLowerCase().replace(/\s+/g, '_');
          return hasType(foodTypeName);
      }
    case 'miscellaneous':
      switch (filterLabel) {
        case 'Services':
          return hasType('library') || 
                 hasType('post_office') ||
                 hasType('pharmacy');
        case 'Utilities':
          return hasType('bank') || 
                 hasType('atm') ||
                 hasType('gas_station');
        case 'Other':
          return hasType('hospital') || 
                 (!hasType('library') && 
                  !hasType('post_office') && 
                  !hasType('pharmacy') &&
                  !hasType('bank') &&
                  !hasType('atm') &&
                  !hasType('gas_station'));
        default:
          const miscTypeName = filterLabel.toLowerCase().replace(/\s+/g, '_');
          return hasType(miscTypeName);
      }
    default:
      // Fallback: try to match by converting filter label to type format
      const fallbackTypeName = filterLabel.toLowerCase().replace(/\s+/g, '_');
      return hasType(fallbackTypeName);
  }
};

export const CategoryContent = ({
  category,
  activeFilter,
  onFilterChange,
  showAll,
  onToggleShowAll,
}: CategoryContentProps) => {
  // Find the active filter object to get its types and predefined status
  const activeFilterObj = category.filters.find(f => f.label === activeFilter);
  
  // Filter items based on active filter
  // If it's a predefined filter, use complex logic; otherwise use types from API
  const filteredItems = category.items.filter(item => {
    // For predefined filters, always use the complex logic (don't rely on types)
    if (activeFilterObj?.isPredefined) {
      return filterAmenity(item, activeFilter, category.id);
    }
    // For dynamic filters, use types from API if available
    return filterAmenity(item, activeFilter, category.id, activeFilterObj?.types);
  });

  const displayItems = showAll ? filteredItems : filteredItems.slice(0, 5);

  return (
    <div className="space-y-6">
      <FiltersSection
        category={category}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No {category.label.toLowerCase()} found for the selected filter</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {displayItems.map((item) => (
              <AmenityCard key={item.id} amenity={item} categoryId={category.id} />
            ))}
          </div>

          {filteredItems.length > 5 && (
            <button
              onClick={onToggleShowAll}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {showAll ? "Show less" : `Show all ${filteredItems.length} ${category.label.toLowerCase()}`}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAll ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </>
      )}
    </div>
  );
};

