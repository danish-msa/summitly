// Global filter types and interfaces

export interface Location {
  id: string;
  name: string;
  areas?: string[];
}

export interface FilterState {
  // Location filters
  location: string;
  locationArea: string;
  
  // Property filters
  propertyType: string;
  community: string;
  
  // Price filters
  minPrice: number;
  maxPrice: number;
  
  // Property details
  bedrooms: number;
  bathrooms: number;
  
  // Listing type
  listingType: string;
  
  // Advanced filters
  minSquareFeet?: number;
  maxSquareFeet?: number;
  yearBuilt?: string;
  features?: string[];
  listingDate?: string;
  
  // Pre-construction specific filters
  developer?: string;
  preConStatus?: string;
  subPropertyType?: string; // For house/condo sub-types
  completionDate?: string; // e.g., 'Q4 2025'
  constructionStatus?: string; // '0' = Pre-construction, '1' = Construction, '2' = Complete
  
  // Advanced pre-construction filters
  unitTypes?: string[]; // ['Den', 'Studio', 'Loft', 'Work/Live Loft']
  ownershipType?: string;
  garage?: string; // 'single', 'double', 'triple', 'other'
  basement?: string; // 'finished', 'unfinished'
  availableUnits?: number; // Minimum available units
  suites?: number; // Number of suites
  storeys?: number; // Number of storeys
}

export interface FilterChangeEvent {
  target: {
    name: string;
    value: string | number | string[] | { location: string; area: string };
  };
}

export interface FilterComponentProps {
  filters: FilterState;
  handleFilterChange: (e: FilterChangeEvent) => void;
  resetFilters: () => void;
  communities: string[];
  locations?: Location[];
}

export interface IndividualFilterProps {
  filters: FilterState;
  handleFilterChange: (e: FilterChangeEvent) => void;
  communities: string[];
  locations?: Location[];
}

// Default filter state
export const DEFAULT_FILTER_STATE: FilterState = {
  location: 'all',
  locationArea: 'all',
  propertyType: 'all',
  community: 'all',
  minPrice: 0,
  maxPrice: 2000000,
  bedrooms: 0,
  bathrooms: 0,
  listingType: 'all',
  developer: 'all',
  preConStatus: 'all',
  subPropertyType: 'all',
  completionDate: 'all',
  constructionStatus: 'all',
  unitTypes: [],
  ownershipType: 'all',
  garage: 'all',
  basement: 'all'
};

// Location data
export const LOCATIONS: Location[] = [
  {
    id: "gta",
    name: "Greater Toronto Area",
    areas: ["All of GTA", "Toronto", "Durham", "Halton", "Peel", "York"],
  },
  {
    id: "toronto",
    name: "Toronto",
    areas: ["All of Toronto", "Etobicoke", "North York", "Scarborough", "Toronto & East York"],
  },
  {
    id: "durham",
    name: "Durham",
    areas: ["All of Durham", "Ajax", "Pickering", "Whitby", "Oshawa"],
  },
  {
    id: "halton",
    name: "Halton",
    areas: ["All of Halton", "Burlington", "Oakville", "Milton"],
  },
  {
    id: "peel",
    name: "Peel",
    areas: ["All of Peel", "Brampton", "Mississauga", "Caledon"],
  },
  {
    id: "york",
    name: "York",
    areas: ["All of York", "Markham", "Vaughan", "Richmond Hill", "Aurora"],
  },
  {
    id: "outside-gta",
    name: "Outside GTA",
    areas: ["All Outside GTA", "Hamilton", "Niagara", "Barrie", "Kitchener-Waterloo"],
  },
];

// Property type options
export const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' }
];

// Listing type options
export const LISTING_TYPES = [
  { value: 'all', label: 'All Listings' },
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' }
];
