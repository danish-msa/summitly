import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface GooglePlaceDetail {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
    profile_photo_url?: string;
  }>;
  types?: string[];
  editorial_summary?: {
    overview: string;
  };
}

interface GooglePlaceDetailsResponse {
  result: GooglePlaceDetail;
  status: string;
}

function parseHours(weekdayText: string[]): { day: string; hours: string }[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return weekdayText.map((text, index) => {
    const match = text.match(/^[^:]+:\s*(.+)$/);
    return {
      day: days[index] || `Day ${index + 1}`,
      hours: match ? match[1] : text.split(':').slice(1).join(':').trim() || 'Closed',
    };
  });
}

function getPriceLevel(level?: number): string {
  if (!level) return '';
  return '$'.repeat(level);
}

function getPhotoUrl(photoReference: string): string {
  if (!GOOGLE_MAPS_API_KEY) return '';
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('placeId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    // Fetch place details from Google Places API
    const fields = [
      'name',
      'formatted_address',
      'formatted_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'price_level',
      'opening_hours',
      'geometry',
      'photos',
      'reviews',
      'types',
      'editorial_summary',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data: GooglePlaceDetailsResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const place = data.result;

    // Calculate distance if lat/lng provided
    let distance = '';
    if (lat && lng && place.geometry?.location) {
      const distanceKm = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      if (distanceKm < 1) {
        distance = `${(distanceKm * 1000).toFixed(0)} m`;
      } else {
        distance = `${distanceKm.toFixed(1)} km`;
      }
    }

    // Format hours
    const hours = place.opening_hours?.weekday_text
      ? parseHours(place.opening_hours.weekday_text)
      : [];

    // Format features from types
    const features: string[] = [];
    if (place.types) {
      const featureMap: Record<string, string> = {
        wheelchair_accessible_entrance: 'Wheelchair accessible',
        outdoor_seating: 'Outdoor seating',
        takeout: 'Takeout',
        delivery: 'Delivery',
        reservations: 'Reservations',
        parking: 'Parking',
        wifi: 'WiFi',
      };

      place.types.forEach((type) => {
        const feature = featureMap[type];
        if (feature && !features.includes(feature)) {
          features.push(feature);
        }
      });
    }

    // Format photos
    const photos = place.photos
      ? place.photos.slice(0, 5).map((photo) => getPhotoUrl(photo.photo_reference))
      : [];

    // Format reviews
    const reviews = place.reviews
      ? place.reviews.slice(0, 3).map((review, index) => ({
          id: `review-${index}`,
          author: review.author_name,
          avatar: review.author_name.charAt(0).toUpperCase(),
          rating: review.rating,
          date: review.relative_time_description,
          text: review.text,
          helpful: Math.floor(Math.random() * 20), // Mock helpful count
        }))
      : [];

    const result = {
      id: place.place_id,
      name: place.name,
      category: place.types?.[0]?.replace(/_/g, ' ') || 'Place',
      address: place.formatted_address || '',
      distance: distance,
      walkTime: '', // Will be calculated on client if needed
      rating: place.rating || 0,
      totalReviews: place.user_ratings_total || 0,
      priceLevel: getPriceLevel(place.price_level),
      isOpen: place.opening_hours?.open_now ?? true,
      hours: hours,
      phone: place.formatted_phone_number,
      website: place.website,
      description: place.editorial_summary?.overview || `${place.name} is a ${place.types?.[0]?.replace(/_/g, ' ') || 'place'} located in the area.`,
      features: features,
      photos: photos,
      reviews: reviews,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching amenity details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch amenity details' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

