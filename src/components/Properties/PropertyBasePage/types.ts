export type PropertyPageType = 
  | 'by-location' 
  | 'propertyType' 
  | 'price-range' 
  | 'bedrooms' 
  | 'bathrooms'
  | 'sqft'
  | 'lot-size'
  | 'year-built'
  | 'ownership'
  | 'feature'
  | 'status'
  | 'propertyType-price' 
  | 'propertyType-bedrooms' 
  | 'propertyType-bathrooms'
  | 'propertyType-sqft'
  | 'propertyType-lot-size'
  | 'propertyType-year-built'
  | 'propertyType-ownership'
  | 'propertyType-feature'
  | 'price-bedrooms' 
  | 'price-bathrooms'
  | 'price-sqft'
  | 'price-lot-size'
  | 'price-year-built'
  | 'price-feature'
  | 'propertyType-price-bedrooms'
  | 'propertyType-price-bathrooms'
  | 'propertyType-price-sqft'
  | 'propertyType-price-feature';

export interface PropertyBasePageProps {
  slug: string;
  pageType: PropertyPageType;
  citySlug?: string; // First segment: city slug or zipcode
  /** When first segment is a zipcode, pass normalized value (e.g. M5H2N2) for API filter. */
  zipcode?: string | null;
  listingType?: 'sell' | 'rent'; // 'sell' for /buy, 'rent' for /rent
  locationType?: 'city' | 'neighbourhood' | 'intersection' | null;
  locationName?: string | null; // Neighbourhood or intersection name
}

export interface PropertyPageInfo {
  title: string;
  numberOfProperties: number;
  province?: string;
  description?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface PriceRange {
  min?: number;
  max?: number;
  label: string; // e.g., "Under $500,000", "$400,000-$600,000"
}

