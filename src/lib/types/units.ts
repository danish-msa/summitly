// Unit listing types for pre-construction properties
export interface UnitListing {
  id: string;
  name: string;
  beds: number;
  baths: number;
  sqft?: number;
  images: string[]; // Array of image URLs (replaces single floorplanImage)
  status: 'for-sale' | 'sold-out';
  maintenanceFee: number;
  price?: number;
  description?: string;
  features?: string[];
  amenities?: string[];
}

