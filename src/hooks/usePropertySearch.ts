import { useState, useEffect } from 'react';

// Define the shape of a single property suggestion
export interface PropertySuggestion {
  id: string;
  address: string;
  city: string;
  region: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: string;
  yearBuilt: number;
}

// Define the shape of the suggestions state
export interface SuggestionsState {
  properties: PropertySuggestion[];
  totalCount: number;
}

// Custom hook for property search
export const usePropertySearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionsState>({
    properties: [],
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);

  // Debounce search term to avoid excessive API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const getPropertySuggestions = async (term: string) => {
      if (!term || term.length < 2) {
        setSuggestions({ properties: [], totalCount: 0 });
        return;
      }
      
      setLoading(true);
      try {
        // Fetch from your data source
        const { fetchPropertyListings } = await import('@/data/data');
        const allProperties = await fetchPropertyListings();
        
        // Filter properties based on search term
        const filteredProperties = allProperties.filter(property => {
          const addressString = `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.city || ''} ${property.address.state || ''}`.toLowerCase();
          return addressString.includes(term.toLowerCase());
        });
        
        // Map to the expected format
        const formattedProperties = filteredProperties.map(property => ({
          id: property.mlsNumber,
          address: `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}`,
          city: property.address.city || '',
          region: property.address.state || '',
          bedrooms: property.details.numBedrooms,
          bathrooms: property.details.numBathrooms,
          sqft: typeof property.details.sqft === 'number' ? property.details.sqft : 0,
          propertyType: property.details.propertyType || '',
          yearBuilt: 2000 // Default value if not available
        }));
        
        setSuggestions({
          properties: formattedProperties.slice(0, 5), // Limit to 5 results
          totalCount: filteredProperties.length
        });
      } catch (error) {
        console.error('Error fetching property suggestions:', error);
        setSuggestions({ properties: [], totalCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (debouncedSearchTerm) {
      getPropertySuggestions(debouncedSearchTerm);
    } else {
      setSuggestions({ properties: [], totalCount: 0 });
    }
  }, [debouncedSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    loading,
  };
};