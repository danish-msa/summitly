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

// Category configuration
const CATEGORY_CONFIG = {
  schools: {
    types: ['school'],
    radius: 5000, // 5km
    filters: {
      'All': () => true,
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
      'All': () => true,
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
      'All': () => true,
      'Fire Stations': (place: GooglePlace) => place.types.includes('fire_station'),
      'Police Stations': (place: GooglePlace) => place.types.includes('police'),
    },
  },
  transit: {
    types: ['transit_station', 'bus_station', 'subway_station'],
    radius: 2000, // 2km
    filters: {
      'All': () => true,
      'Bus Stops': (place: GooglePlace) => 
        place.types.includes('bus_station') || 
        (place.types.includes('transit_station') && !place.types.includes('subway_station')),
      'Subway': (place: GooglePlace) => place.types.includes('subway_station'),
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

    // Calculate filter counts using original place objects
    const filters = Object.keys(config.filters).map(filterLabel => {
      const filterFn = config.filters[filterLabel as keyof typeof config.filters];
      const count = amenitiesWithPlaces.filter(({ place }) => {
        try {
          // Handle "All" filter separately (it doesn't take arguments)
          if (filterLabel === 'All') {
            return true;
          }
          
          // Ensure place.types exists for other filters
          if (!place.types || !Array.isArray(place.types) || place.types.length === 0) {
            return false; // No types means it doesn't match any specific filter
          }
          
          // Call filter function with place object
          return filterFn(place);
        } catch (error) {
          console.error(`Error in filter ${filterLabel}:`, error);
          return false;
        }
      }).length;
      return {
        label: filterLabel,
        count,
      };
    });

    return NextResponse.json({
      category: {
        id: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        items: amenities,
        filters,
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

