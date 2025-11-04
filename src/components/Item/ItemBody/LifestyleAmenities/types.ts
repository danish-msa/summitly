export interface Amenity {
  id: string;
  name: string;
  type: string;
  rating?: number;
  walkTime: string;
  driveTime: string;
  distance: string;
}

export interface AmenityFilter {
  label: string;
  count: number;
}

export interface AmenityCategory {
  id: string;
  label: string;
  items: Amenity[];
  filters: AmenityFilter[];
}

export interface LifestyleAmenitiesProps {
  address?: string;
}

