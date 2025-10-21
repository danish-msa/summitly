// API Response Interfaces
export interface PropertyTypesResponse {
  boards: {
    classes: {
      [className: string]: {
        propertyTypes: Array<{
          [typeName: string]: {
            activeCount: number;
            [key: string]: unknown;
          };
        }>;
      };
    };
  }[];
}

export interface ListingsResponse {
  listings: ApiListing[];
  count?: number;
  numPages?: number;
}

export interface ApiListing {
  mlsNumber?: string;
  status?: string;
  class?: string;
  listPrice?: number;
  listDate?: string;
  lastStatus?: string;
  soldPrice?: string;
  soldDate?: string;
  legalDescription?: string;
  publicRemarks?: string;
  updatedOn?: string;
  boardId?: number;
  
  address?: {
    area?: string;
    city?: string;
    country?: string;
    district?: string;
    majorIntersection?: string;
    neighborhood?: string;
    streetDirection?: string;
    streetName?: string;
    streetNumber?: string;
    streetSuffix?: string;
    unitNumber?: string;
    zip?: string;
    state?: string;
    communityCode?: string;
    streetDirectionPrefix?: string;
    addressKey?: string;
  };
  
  map?: {
    latitude?: number;
    longitude?: number;
    point?: string;
  };
  
  details?: {
    propertyType?: string;
    numBedrooms?: number;
    numBedroomsPlus?: number | string;
    numBathrooms?: number;
    numBathroomsPlus?: number;
    sqft?: number | string;
  };
  
  lot?: {
    acres?: number;
    depth?: number | string;
    irregular?: number | string;
    legalDescription?: string;
    measurement?: string;
    width?: number;
    size?: number;
    source?: string;
    dimensionsSource?: string;
    dimensions?: string;
    squareFeet?: number;
    features?: string;
    taxLot?: number | string;
  };
  
  media?: {
    photos?: {
      url: string;
      [key: string]: unknown;
    }[];
  };
  
  images?: string[];
  acres?: number | string;
  [key: string]: unknown;
}

// Application Data Interfaces
export interface PropertyListing {
    mlsNumber: string;
    status: string;
    class: string;
    type: string; // "Lease" for rentals, "Sale" for sales
    listPrice: number; // Note: this is lowercase 'p' in listprice
    listDate: string;
    lastStatus: string;
    soldPrice: string;
    soldDate: string;

    address: {
        area: string | null;
        city: string | null;
        country: string | null;
        district: string | null;
        majorIntersection: string | null;
        neighborhood: string | null;
        streetDirection: string | null;
        streetName: string | null;
        streetNumber: string | null;
        streetSuffix: string | null;
        unitNumber: string | null;
        zip: string | null;
        state: string | null;
        communityCode: string | null;
        streetDirectionPrefix: string | null;
        addressKey: string | null;
        location: string; // Full formatted address
    };
    map: {
        latitude: number | null;
        longitude: number | null;
        point: string | null;
    };
    details: {
        numBathrooms: number;
        numBathroomsPlus: number;
        numBedrooms: number;
        numBedroomsPlus: number | string;
        propertyType: string;
        sqft: number | string;
    };
    updatedOn: string;
    lot: {
        acres: number;
        depth: number | string;
        irregular: number | string;
        legalDescription: string;
        measurement: string;
        width: number;
        size: number;
        source: string;
        dimensionsSource: string;
        dimensions: string;
        squareFeet: number;
        features: string;
        taxLot: number | string;
    }
    boardId: number;
    images: {
        imageUrl: string;
        allImages: string[];
    };
}

// Update City interface to better match the property data
export interface City {
  id: number;
  image: string;
  cityName: string;
  numberOfProperties: number;
  region?: string; // Adding region for better location context
}

// Update PropertyType interface to better match API data
export interface PropertyType {
  id: number;
  icon: string;
  type: string;
  number: number; // Number of properties of this type
  class: string;  // Property class (residential, commercial, etc.)
}

// Update PropertyClass interface to better match API data
export interface PropertyClass {
  id: number;
  icon: string;
  type: string;
  number: number; // Number of properties in this class
}

// Add a new interface for search filters
export interface PropertyFilters {
  class?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  city?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Blog interfaces
export interface BlogPost {
  id: number;
  image: string;
  date: string;
  title: string;
  excerpt: string;
  tags: string[];
  large?: boolean;
  content?: string;
  author?: string;
  readTime?: string;
  featured?: boolean;
}

export interface BlogFilters {
  tag?: string;
  author?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}