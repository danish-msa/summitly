import { getGeocode, getLatLng } from 'use-places-autocomplete';

// Interface for location suggestion items
export interface LocationSuggestionItem {
  id: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

// Interface for grouped suggestions
export interface GroupedSuggestions {
  [category: string]: LocationSuggestionItem[];
}

// This represents the structure of a single suggestion from the Places API
interface PlaceSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

/**
 * Groups location suggestions by their types (Cities, Neighborhoods, etc.)
 * @param data - The suggestions data from Google Places API
 * @returns An object with categories as keys and arrays of suggestions as values
 */
export const groupSuggestionsByType = (data: PlaceSuggestion[]): GroupedSuggestions => {
  return data.reduce((acc: GroupedSuggestions, suggestion) => {
    // Extract the main text and secondary text from the suggestion
    const mainText = suggestion.structured_formatting.main_text;
    const secondaryText = suggestion.structured_formatting.secondary_text;
    
    // Determine the category based on the place types
    const type = getLocationType(suggestion.types);
    
    // Initialize the category array if it doesn't exist
    if (!acc[type]) {
      acc[type] = [];
    }
    
    // Add the suggestion to the appropriate category
    acc[type].push({
      id: suggestion.place_id,
      mainText,
      secondaryText,
      description: suggestion.description
    });
    
    return acc;
  }, {});
};

/**
 * Determines the location type based on Google Places API types
 * @param types - Array of place types from Google Places API
 * @returns A user-friendly category name
 */
export const getLocationType = (types: string[]): string => {
  if (types.includes('neighborhood')) return 'Neighborhoods';
  if (types.includes('locality')) return 'Cities';
  if (types.includes('street_address')) return 'Addresses';
  if (types.includes('sublocality')) return 'Districts';
  if (types.includes('administrative_area_level_1')) return 'States';
  if (types.includes('country')) return 'Countries';
  return 'Other Locations';
};

/**
 * Gets coordinates (latitude and longitude) for a location
 * @param address - The location address
 * @returns A promise that resolves to the coordinates
 */
export const getCoordinates = async (address: string): Promise<{lat: number, lng: number} | null> => {
  try {
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    return { lat, lng };
  } catch (error) {
    console.error("Error getting coordinates:", error);
    return null;
  }
};