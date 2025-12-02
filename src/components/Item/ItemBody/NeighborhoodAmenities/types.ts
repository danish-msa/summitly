export interface Amenity {
  id: string;
  name: string;
  type: string;
  types?: string[]; // Full types array for filtering
  rating?: number;
  walkTime: string;
  driveTime: string;
  distance: string;
}

export interface AmenityFilter {
  label: string;
  count: number;
  types?: string[]; // Type(s) this filter matches (for dynamic filters)
  isPredefined?: boolean; // Whether this is a predefined filter with complex logic
}

export interface AmenityCategory {
  id: string;
  label: string;
  items: Amenity[];
  filters: AmenityFilter[];
}

export interface NeighborhoodAmenitiesProps {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

