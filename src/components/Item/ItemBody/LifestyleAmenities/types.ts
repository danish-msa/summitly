// Re-export shared types
export type { Amenity, AmenityFilter, AmenityCategory } from '@/components/common/amenities/types';

export interface LifestyleAmenitiesProps {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}
