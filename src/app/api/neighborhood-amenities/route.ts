import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Google Places API types
interface GooglePlace {
  place_id: string;
  name: string;
  types: string[];
  rating?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
}

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
      status: string;
    }>;
  }>;
  status: string;
}

// Filter function type
type FilterFunction = (place: GooglePlace) => boolean;

// Category configuration
const CATEGORY_CONFIG = {
  schools: {
    types: ['school'],
    radius: 5000, // 5km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Assigned': (place: GooglePlace) => place.types.includes('school'),
      'Elementary': (place: GooglePlace) => 
        place.name.toLowerCase().includes('elementary') || 
        place.name.toLowerCase().includes('primary') ||
        place.name.toLowerCase().includes('public school'),
      'Secondary': (place: GooglePlace) => 
        place.name.toLowerCase().includes('secondary') || 
        place.name.toLowerCase().includes('high school') ||
        place.name.toLowerCase().includes('collegiate'),
      'French Immersion': (place: GooglePlace) => 
        place.name.toLowerCase().includes('french') || 
        place.name.toLowerCase().includes('immersion'),
    },
  },
  parks: {
    types: ['park'],
    radius: 3000, // 3km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Playgrounds': (place: GooglePlace) => 
        place.types.includes('playground') || 
        place.name.toLowerCase().includes('playground'),
      'Dog Parks': (place: GooglePlace) => 
        place.types.includes('park') && 
        (place.name.toLowerCase().includes('dog') || place.name.toLowerCase().includes('off-leash')),
    },
  },
  safety: {
    types: ['fire_station', 'police'],
    radius: 5000, // 5km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Fire Stations': (place: GooglePlace) => place.types.includes('fire_station'),
      'Police Stations': (place: GooglePlace) => place.types.includes('police'),
    },
  },
  transit: {
    types: ['transit_station', 'bus_station', 'subway_station'],
    radius: 2000, // 2km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Bus Stops': (place: GooglePlace) => 
        place.types.includes('bus_station') || 
        (place.types.includes('transit_station') && !place.types.includes('subway_station')),
      'Subway': (place: GooglePlace) => place.types.includes('subway_station'),
    },
  },
  // Lifestyle amenities
  entertainment: {
    types: ['casino', 'movie_theater', 'amusement_park', 'bowling_alley', 'night_club'],
    radius: 5000, // 5km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Casinos': (place: GooglePlace) => place.types.includes('casino'),
      'Cinemas': (place: GooglePlace) => place.types.includes('movie_theater'),
      'Theaters': (place: GooglePlace) => 
        place.types.includes('amusement_park') || 
        place.name.toLowerCase().includes('theater') || 
        place.name.toLowerCase().includes('theatre'),
    },
  },
  shopping: {
    types: ['shopping_mall', 'supermarket', 'department_store', 'grocery_or_supermarket', 'store'],
    radius: 3000, // 3km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Malls': (place: GooglePlace) => place.types.includes('shopping_mall'),
      'Department Stores': (place: GooglePlace) => place.types.includes('department_store'),
      'Grocery': (place: GooglePlace) => 
        place.types.includes('supermarket') || 
        place.types.includes('grocery_or_supermarket'),
    },
  },
  worship: {
    types: ['church', 'hindu_temple', 'mosque', 'synagogue', 'place_of_worship'],
    radius: 5000, // 5km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Churches': (place: GooglePlace) => place.types.includes('church'),
      'Temples': (place: GooglePlace) => 
        place.types.includes('hindu_temple') || 
        place.name.toLowerCase().includes('temple'),
      'Mosques': (place: GooglePlace) => 
        place.types.includes('mosque') || 
        place.name.toLowerCase().includes('mosque'),
    },
  },
  sports: {
    types: ['gym', 'stadium', 'sports_complex', 'park'],
    radius: 3000, // 3km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Arenas': (place: GooglePlace) => 
        place.types.includes('stadium') || 
        place.name.toLowerCase().includes('arena'),
      'Gyms': (place: GooglePlace) => 
        place.types.includes('gym') || 
        place.name.toLowerCase().includes('fitness') ||
        place.name.toLowerCase().includes('gym'),
      'Parks': (place: GooglePlace) => place.types.includes('park'),
    },
  },
  food: {
    types: ['restaurant', 'cafe', 'food', 'meal_takeaway', 'bakery'],
    radius: 2000, // 2km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Restaurants': (place: GooglePlace) => 
        place.types.includes('restaurant') && 
        !place.types.includes('meal_takeaway'),
      'Fast Food': (place: GooglePlace) => 
        place.types.includes('meal_takeaway') || 
        place.name.toLowerCase().includes('mcdonald') ||
        place.name.toLowerCase().includes('burger') ||
        place.name.toLowerCase().includes('pizza'),
      'Cafes': (place: GooglePlace) => 
        place.types.includes('cafe') || 
        place.name.toLowerCase().includes('coffee') ||
        place.name.toLowerCase().includes('tim hortons') ||
        place.name.toLowerCase().includes('starbucks'),
    },
  },
  miscellaneous: {
    types: ['library', 'bank', 'post_office', 'pharmacy', 'hospital', 'gas_station', 'atm'],
    radius: 3000, // 3km
    filters: {
      'All': (_place: GooglePlace) => true,
      'Services': (place: GooglePlace) => 
        place.types.includes('library') || 
        place.types.includes('post_office') ||
        place.types.includes('pharmacy'),
      'Utilities': (place: GooglePlace) => 
        place.types.includes('bank') || 
        place.types.includes('atm') ||
        place.types.includes('gas_station'),
      'Other': (place: GooglePlace) => 
        place.types.includes('hospital') || 
        (!place.types.includes('library') && 
         !place.types.includes('post_office') && 
         !place.types.includes('pharmacy') &&
         !place.types.includes('bank') &&
         !place.types.includes('atm') &&
         !place.types.includes('gas_station')),
    },
  },
};

// Fetch nearby places from Google Places API
async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  types: string[],
  radius: number
): Promise<GooglePlace[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  // Google Places API only accepts one type per request, so we need to make multiple requests
  const allPlaces: GooglePlace[] = [];
  const seenPlaceIds = new Set<string>();

  for (const type of types) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Google Places API error for type ${type}: ${response.statusText}`);
        continue; // Continue with other types even if one fails
      }

      const data: GooglePlacesResponse = await response.json();
      
      if (data.status === 'ZERO_RESULTS') {
        continue; // No results for this type, continue
      }
      
      if (data.status !== 'OK') {
        console.error(`Google Places API error for type ${type}: ${data.status}`);
        continue; // Continue with other types
      }

      // Add unique places (avoid duplicates)
      for (const place of data.results) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          // Ensure types array exists
          if (!place.types || !Array.isArray(place.types) || place.types.length === 0) {
            place.types = [type]; // Use the type we searched for
          }
          allPlaces.push(place);
        }
      }
    } catch (error) {
      console.error(`Error fetching places for type ${type}:`, error);
      // Continue with other types
    }
  }

  return allPlaces;
}

// Calculate distance and travel times using Distance Matrix API
async function calculateTravelTimes(
  origin: { lat: number; lng: number },
  destinations: Array<{ lat: number; lng: number }>
): Promise<Array<{ walkTime: string; driveTime: string; distance: string }>> {
  if (!GOOGLE_MAPS_API_KEY || destinations.length === 0) {
    return destinations.map(() => ({
      walkTime: 'N/A',
      driveTime: 'N/A',
      distance: 'N/A',
    }));
  }

  // Distance Matrix API has a limit of 25 destinations per request
  const batchSize = 25;
  const results: Array<{ walkTime: string; driveTime: string; distance: string }> = [];

  for (let i = 0; i < destinations.length; i += batchSize) {
    const batch = destinations.slice(i, i + batchSize);
    const destString = batch.map(d => `${d.lat},${d.lng}`).join('|');
    
    // Get walking time
    try {
      const walkUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destString}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;
      const walkResponse = await fetch(walkUrl);
      const walkData: DistanceMatrixResponse = await walkResponse.json();

      // Get driving time
      const driveUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destString}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      const driveResponse = await fetch(driveUrl);
      const driveData: DistanceMatrixResponse = await driveResponse.json();

      // Process results
      for (let j = 0; j < batch.length; j++) {
        const walkElement = walkData.rows[0]?.elements[j];
        const driveElement = driveData.rows[0]?.elements[j];

        const walkTime = walkElement?.duration?.text || 'N/A';
        const driveTime = driveElement?.duration?.text || 'N/A';
        const distance = walkElement?.distance?.text || driveElement?.distance?.text || 'N/A';

        results.push({ walkTime, driveTime, distance });
      }
    } catch (error) {
      console.error('Error calculating travel times:', error);
      // Fallback: use calculated distance only
      for (let j = 0; j < batch.length; j++) {
        const distance = calculateDistance(
          origin.lat,
          origin.lng,
          batch[j].lat,
          batch[j].lng
        );
        results.push({
          walkTime: 'N/A',
          driveTime: 'N/A',
          distance: formatDistance(distance),
        });
      }
    }
  }

  return results;
}

// Calculate distance using Haversine formula (fallback)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const category = searchParams.get('category') || 'schools';

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Fetch nearby places
    const places = await fetchNearbyPlaces(lat, lng, config.types, config.radius);

    // If no places found, return empty results
    if (places.length === 0) {
      return NextResponse.json({
        category: {
          id: category,
          label: category.charAt(0).toUpperCase() + category.slice(1),
          items: [],
          filters: Object.keys(config.filters).map(filterLabel => ({
            label: filterLabel,
            count: 0,
          })),
        },
      });
    }

    // Sort by distance
    places.sort((a, b) => {
      const distA = calculateDistance(
        lat,
        lng,
        a.geometry.location.lat,
        a.geometry.location.lng
      );
      const distB = calculateDistance(
        lat,
        lng,
        b.geometry.location.lat,
        b.geometry.location.lng
      );
      return distA - distB;
    });

    // Limit to top 20 results
    const limitedPlaces = places.slice(0, 20);

    // Calculate travel times
    const destinations = limitedPlaces.map(p => ({
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
    }));

    const travelTimes = await calculateTravelTimes({ lat, lng }, destinations);

    // Transform to amenity format and keep place reference for filtering
    const amenitiesWithPlaces = limitedPlaces.map((place, index) => {
      const travel = travelTimes[index];
      const distance = calculateDistance(
        lat,
        lng,
        place.geometry.location.lat,
        place.geometry.location.lng
      );

      // Ensure types array exists and has values
      const placeTypes = Array.isArray(place.types) && place.types.length > 0 
        ? place.types 
        : ['establishment'];

      return {
        amenity: {
          id: place.place_id,
          name: place.name || 'Unnamed Place',
          type: placeTypes[0]?.replace(/_/g, ' ') || 'Unknown',
          types: placeTypes, // Include full types array for filtering
          rating: place.rating,
          walkTime: travel.walkTime,
          driveTime: travel.driveTime,
          distance: travel.distance !== 'N/A' ? travel.distance : formatDistance(distance),
        },
        place, // Keep original place for filtering
      };
    });

    // Extract amenities for response
    const amenities = amenitiesWithPlaces.map(item => item.amenity);

    // Generate dynamic filters based on actual places found
    const generateDynamicFilters = (places: GooglePlace[]): Array<{ label: string; count: number }> => {
      const mergedFilters = new Map<string, { label: string; count: number }>();
      
      // Always include "All" filter first
      mergedFilters.set('All', { label: 'All', count: places.length });

      // Calculate predefined filters first (they take priority)
      Object.keys(config.filters).forEach(filterLabel => {
        if (filterLabel === 'All') return; // Skip "All" as we already have it
        
        const filterFn = config.filters[filterLabel as keyof typeof config.filters] as FilterFunction;
        const count = amenitiesWithPlaces.filter(({ place }) => {
          try {
            if (!place.types || !Array.isArray(place.types) || place.types.length === 0) {
              return false;
            }
            return filterFn(place);
          } catch (error) {
            console.error(`Error in predefined filter ${filterLabel}:`, error);
            return false;
          }
        }).length;

        if (count > 0) {
          mergedFilters.set(filterLabel, { label: filterLabel, count });
        }
      });

      // Collect all unique types from places for dynamic filters
      const typeCounts = new Map<string, Set<string>>(); // Map<type, Set<place_ids>>

      places.forEach(place => {
        if (place.types && Array.isArray(place.types)) {
          place.types.forEach(type => {
            // Skip generic types that aren't useful for filtering
            const skipTypes = ['establishment', 'point_of_interest', 'store', 'food'];
            if (skipTypes.includes(type)) return;

            // Track unique places per type
            if (!typeCounts.has(type)) {
              typeCounts.set(type, new Set());
            }
            typeCounts.get(type)!.add(place.place_id);
          });
        }
      });

      // Format type names to be more user-friendly
      const typeNameMap: Record<string, string> = {
        'movie_theater': 'Movie Theaters',
        'shopping_mall': 'Shopping Malls',
        'grocery_or_supermarket': 'Grocery Stores',
        'department_store': 'Department Stores',
        'hindu_temple': 'Hindu Temples',
        'place_of_worship': 'Places of Worship',
        'sports_complex': 'Sports Complexes',
        'meal_takeaway': 'Fast Food',
        'gas_station': 'Gas Stations',
        'post_office': 'Post Offices',
        'transit_station': 'Transit Stations',
        'bus_station': 'Bus Stations',
        'subway_station': 'Subway Stations',
        'fire_station': 'Fire Stations',
        'restaurant': 'Restaurants',
        'cafe': 'Cafes',
        'bakery': 'Bakeries',
        'gym': 'Gyms',
        'stadium': 'Stadiums',
        'park': 'Parks',
        'playground': 'Playgrounds',
        'library': 'Libraries',
        'bank': 'Banks',
        'pharmacy': 'Pharmacies',
        'hospital': 'Hospitals',
        'atm': 'ATMs',
        'casino': 'Casinos',
        'amusement_park': 'Amusement Parks',
        'bowling_alley': 'Bowling Alleys',
        'night_club': 'Night Clubs',
        'supermarket': 'Supermarkets',
        'church': 'Churches',
        'mosque': 'Mosques',
        'synagogue': 'Synagogues',
        'school': 'Schools',
        'police': 'Police Stations',
      };

      // Add dynamic filters for types that aren't already covered by predefined filters
      typeCounts.forEach((placeIds, type) => {
        const count = placeIds.size;
        if (count > 0) {
          // Use mapped name if available, otherwise format the type name
          const formattedLabel = typeNameMap[type] || type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          // Only add if not already in predefined filters
          if (!mergedFilters.has(formattedLabel)) {
            mergedFilters.set(formattedLabel, { label: formattedLabel, count });
          }
        }
      });

      // Sort by count (descending), but keep "All" first
      const sortedFilters = Array.from(mergedFilters.values()).sort((a, b) => {
        if (a.label === 'All') return -1;
        if (b.label === 'All') return 1;
        return b.count - a.count;
      });

      return sortedFilters;
    };

    // Generate dynamic filters
    const filters = generateDynamicFilters(limitedPlaces);

    // Enhance filters with type information for accurate frontend filtering
    const enhancedFilters = filters.map(filter => {
      // Find the corresponding type(s) for this filter label
      let filterTypes: string[] = [];
      
      // Check if it's a predefined filter
      const predefinedFilterFn = config.filters[filter.label as keyof typeof config.filters];
      if (predefinedFilterFn) {
        // For predefined filters, extract the types they're likely to match
        // by analyzing the filter function or using the category's types
        // The frontend will use complex logic for predefined filters
        return { 
          ...filter, 
          isPredefined: true,
          // Provide category types as a hint, but frontend will use complex logic
          types: config.types
        };
      }
      
      // For dynamic filters, find the type from the reverse map
      const reverseTypeMap: Record<string, string> = {
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
      
      const typeFromLabel = reverseTypeMap[filter.label];
      if (typeFromLabel) {
        filterTypes = [typeFromLabel];
      } else {
        // Try to reverse-engineer from formatted label
        const possibleType = filter.label.toLowerCase().replace(/\s+/g, '_');
        filterTypes = [possibleType];
      }
      
      return { ...filter, types: filterTypes, isPredefined: false };
    });

    return NextResponse.json({
      category: {
        id: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        items: amenities,
        filters: enhancedFilters,
      },
    });
  } catch (error) {
    console.error('Error fetching neighborhood amenities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}

