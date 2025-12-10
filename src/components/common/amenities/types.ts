export interface Amenity {
  id: string;
  name: string;
  type: string;
  types?: string[]; // Full types array for filtering
  rating?: number;
  walkTime: string;
  driveTime: string;
  distance: string;
  latitude?: number; // For Google Directions
  longitude?: number; // For Google Directions
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

export interface AmenitiesSectionProps {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  categories: Array<{ id: string; label: string }>;
  apiEndpoint: string;
  descriptionText: string;
  showDirections?: boolean; // Whether to show directions icon (for transit)
}

