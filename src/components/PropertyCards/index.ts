// Export all property card components from a centralized location
export { default as PropertyCard } from '@/components/Helper/PropertyCard';
export { default as PreConstructionPropertyCard } from './PreConstructionPropertyCard';

// Export types for better type safety
export type { PropertyListing } from '@/data/types';
export type { PreConstructionProperty, PreConstructionPropertyCardProps } from './types';

