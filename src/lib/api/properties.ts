/**
 * Properties API (Legacy Compatibility Layer)
 * 
 * This file maintains backward compatibility with existing code.
 * It re-exports functions from the new unified Repliers API.
 * 
 * @deprecated Use @/lib/api/repliers directly instead
 */

import { RepliersAPI } from './repliers';

// Re-export for backward compatibility
export const fetchPropertyTypes = RepliersAPI.propertyTypes.fetch;
export const fetchPropertyClasses = RepliersAPI.propertyTypes.fetchClasses;
export const fetchPropertyListings = RepliersAPI.listings.fetch;
export const fetchTopCities = RepliersAPI.cities.fetchTop;
export const getListings = RepliersAPI.listings.getFiltered;

// Export types
export type { ListingsParams, ListingsResult } from './repliers';
