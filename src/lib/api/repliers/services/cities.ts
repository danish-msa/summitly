/**
 * Cities Service
 * 
 * Handles city-related data:
 * - Top cities by property count
 * - City statistics
 */

import { repliersClient, API_CONFIG } from '../client';
import type { City, ListingsResponse, ApiListing } from '@/lib/types';

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Fetch top cities by property count
 */
export async function fetchTopCities(limit: number = 6): Promise<City[]> {
  const response = await repliersClient.request<ListingsResponse>({
    endpoint: '/listings',
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.cities,
    priority: 'normal',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch cities:', response.error?.message);
    return [];
  }

  // Count properties by city
  const cityCounts: Record<string, number> = {};

  response.data.listings.forEach((listing: ApiListing) => {
    const city = listing.address?.city;
    if (city) {
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  });

  // Sort and limit
  const sortedCities = Object.entries(cityCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, limit)
    .map(([cityName, count], index) => ({
      id: index + 1,
      image: `/images/c${(index % 6) + 1}.jpg`,
      cityName,
      numberOfProperties: count,
      region: '', // Could be enhanced with region mapping
    }));

  return sortedCities;
}

