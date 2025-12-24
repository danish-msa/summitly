/**
 * API functions for property ratings (works for all property types)
 */

export interface RatingData {
  average: number;
  total: number;
  userRating: number | null;
  ratings: number[];
}

export interface SaveRatingResponse {
  success: boolean;
  rating: number;
  average: number;
  total: number;
}

export type PropertyType = 'regular' | 'pre-construction';

/**
 * Get rating statistics for a property (works for all property types)
 * Uses the generic /api/properties route for regular properties
 * Falls back to /api/projects for pre-construction (backward compatibility)
 */
export async function getPropertyRating(
  propertyId: string, 
  propertyType: PropertyType = 'regular'
): Promise<RatingData> {
  try {
    // Use generic properties API for all types
    const apiRoute = propertyType === 'pre-construction' 
      ? `/api/projects/${propertyId}/ratings?propertyType=${propertyType}`
      : `/api/properties/${propertyId}/ratings?propertyType=${propertyType}`;
    
    // Check in-memory cache first (client-side only)
    if (typeof window !== 'undefined') {
      const cacheKey = `rating_${propertyId}_${propertyType}`;
      if ((window as any).__ratingCache?.[cacheKey]) {
        const cached = (window as any).__ratingCache[cacheKey];
        // Check if cache is still valid (5 minutes)
        if (cached.timestamp && Date.now() - cached.timestamp < 300000) {
          return cached.data;
        }
      }
    }

    const response = await fetch(apiRoute, {
      method: 'GET',
      cache: 'default' // Use browser's default cache
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ratings');
    }

    const data = await response.json();
    
    // Cache the result (client-side only)
    if (typeof window !== 'undefined') {
      const cacheKey = `rating_${propertyId}_${propertyType}`;
      if (!(window as any).__ratingCache) {
        (window as any).__ratingCache = {};
      }
      (window as any).__ratingCache[cacheKey] = {
        data,
        timestamp: Date.now()
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching property rating:', error);
    return {
      average: 0,
      total: 0,
      userRating: null,
      ratings: []
    };
  }
}

/**
 * Save or update a rating for a property (works for all property types)
 * Uses the generic /api/properties route for regular properties
 * Falls back to /api/projects for pre-construction (backward compatibility)
 */
export async function savePropertyRating(
  propertyId: string,
  rating: number,
  propertyType: PropertyType = 'regular'
): Promise<SaveRatingResponse> {
  try {
    // Use generic properties API for all types
    const apiRoute = propertyType === 'pre-construction'
      ? `/api/projects/${propertyId}/ratings`
      : `/api/properties/${propertyId}/ratings`;
    
    const response = await fetch(apiRoute, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rating, propertyType })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save rating');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving property rating:', error);
    throw error;
  }
}

/**
 * @deprecated Use getPropertyRating instead
 * Get rating statistics for a project (backward compatibility)
 */
export async function getProjectRating(projectId: string): Promise<RatingData> {
  return getPropertyRating(projectId, 'pre-construction');
}

/**
 * @deprecated Use savePropertyRating instead
 * Save or update a rating for a project (backward compatibility)
 */
export async function saveProjectRating(
  projectId: string,
  rating: number
): Promise<SaveRatingResponse> {
  return savePropertyRating(projectId, rating, 'pre-construction');
}

