// Unit listing types for pre-construction properties
export interface UnitListing {
  id: string;
  name: string;
  beds: number;
  baths: number;
  sqft?: number;
  floorplanImage: string;
  status: 'for-sale' | 'sold-out';
  maintenanceFee: number;
  price?: number;
  description?: string;
  features?: string[];
  amenities?: string[];
}

