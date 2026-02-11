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
  occupancyDate?: string; // e.g., 'Q4 2025'
  constructionStatus?: string; // '0' = Pre-construction, '1' = Construction, '2' = Complete
  
  // Advanced pre-construction filters
  unitTypes?: string[]; // ['Den', 'Studio', 'Loft', 'Work/Live Loft']
  ownershipType?: string;
  garage?: string; // 'single', 'double', 'triple', 'other'
  basement?: string; // 'finished', 'unfinished'
  availableUnits?: number; // Minimum available units
  suites?: number; // Number of suites
  storeys?: number; // Number of storeys
  locker?: string; // 'all', 'has', 'no'
  balcony?: string; // 'all', 'has', 'no'
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
  listingType: 'sell', // Default to 'sell' (For Sale) instead of 'all'
  developer: 'all',
  preConStatus: 'all',
  subPropertyType: 'all',
  occupancyDate: 'all',
  constructionStatus: 'all',
  unitTypes: [],
  ownershipType: 'all',
  garage: 'all',
  basement: 'all',
  locker: 'all',
  balcony: 'all'
};

// Region structure with cities
export interface Region {
  id: string;
  name: string;
  cities: string[];
}

// Location data - Hierarchical structure with regions and cities
export const REGIONS: Region[] = [
  {
    id: "gta",
    name: "Greater Toronto Area (GTA)",
    cities: [
      "Toronto",
      "Mississauga",
      "Brampton",
      "Markham",
      "Vaughan",
      "Richmond Hill",
      "Oakville",
      "Burlington",
      "Oshawa",
      "Whitby",
      "Ajax",
      "Pickering",
      "Aurora",
      "Newmarket",
      "Milton",
      "Caledon",
      "Halton Hills",
      "Georgina",
      "Uxbridge",
      "Scugog",
      "Clarington",
      "Brock",
      "East Gwillimbury",
      "King",
      "Whitchurch-Stouffville"
    ],
  },
  {
    id: "ottawa-eastern",
    name: "Ottawa/Eastern Ontario",
    cities: [
      "Ottawa",
      "Kingston",
      "Cornwall",
      "Belleville",
      "Peterborough",
      "Brockville",
      "Pembroke",
      "Hawkesbury",
      "Gananoque",
      "Smiths Falls",
      "Carleton Place",
      "Arnprior",
      "Renfrew",
      "Perth",
      "Almonte"
    ],
  },
  {
    id: "southwestern",
    name: "Southwestern Ontario",
    cities: [
      "London",
      "Windsor",
      "Kitchener",
      "Waterloo",
      "Cambridge",
      "Guelph",
      "Hamilton",
      "St. Catharines",
      "Niagara Falls",
      "Barrie",
      "Sarnia",
      "Chatham",
      "Brantford",
      "Woodstock",
      "Stratford",
      "Owen Sound",
      "Collingwood",
      "Orillia",
      "Wasaga Beach",
      "Midland",
      "Penetanguishene"
    ],
  },
  {
    id: "northern",
    name: "Northern Ontario",
    cities: [
      "Sudbury",
      "Thunder Bay",
      "North Bay",
      "Sault Ste. Marie",
      "Timmins",
      "Sault Ste Marie",
      "Elliot Lake",
      "Kapuskasing",
      "Cochrane",
      "Kenora",
      "Dryden",
      "Fort Frances",
      "Parry Sound",
      "Bracebridge",
      "Huntsville",
      "Gravenhurst"
    ],
  },
];

// Legacy LOCATIONS structure for backward compatibility
// This maps regions to their cities for the existing Location interface
export const LOCATIONS: Location[] = REGIONS.map(region => ({
  id: region.id,
  name: region.name,
  areas: ["All of " + region.name, ...region.cities],
}));

// Property type options - using exact Repliers API property types
export const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'Detached', label: 'Detached' },
  { value: 'Condo Apartment', label: 'Condo Apartment' },
  { value: 'Office', label: 'Office' },
  { value: 'Att/Row/Townhouse', label: 'Att/Row/Townhouse' },
  { value: 'Commercial Retail', label: 'Commercial Retail' },
  { value: 'Condo Townhouse', label: 'Condo Townhouse' },
  { value: 'Vacant Land', label: 'Vacant Land' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Semi-Detached', label: 'Semi-Detached' },
  { value: 'Sale Of Business', label: 'Sale Of Business' },
  { value: 'Land', label: 'Land' },
  { value: 'Multiplex', label: 'Multiplex' },
  { value: 'Duplex', label: 'Duplex' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Farm', label: 'Farm' },
  { value: 'Common Element Condo', label: 'Common Element Condo' },
  { value: 'Other', label: 'Other' },
  { value: 'Store W Apt/Office', label: 'Store W Apt/Office' },
  { value: 'Triplex', label: 'Triplex' },
  { value: 'Mobiletrailer', label: 'Mobiletrailer' },
  { value: 'Lower Level', label: 'Lower Level' },
  { value: 'Rural Residential', label: 'Rural Residential' },
  { value: 'Link', label: 'Link' },
  { value: 'Upper Level', label: 'Upper Level' },
  { value: 'Co-Op Apartment', label: 'Co-Op Apartment' },
  { value: 'Modular Home', label: 'Modular Home' },
  { value: 'Parking Space', label: 'Parking Space' },
  { value: 'Vacant Land Condo', label: 'Vacant Land Condo' },
  { value: 'Detached Condo', label: 'Detached Condo' },
  { value: 'Semi-Detached Condo', label: 'Semi-Detached Condo' },
  { value: 'Room', label: 'Room' },
  { value: 'Leasehold Condo', label: 'Leasehold Condo' },
  { value: 'Co-Ownership Apartment', label: 'Co-Ownership Apartment' },
  { value: 'Locker', label: 'Locker' },
  { value: 'Timeshare', label: 'Timeshare' },
  { value: 'Shared Room', label: 'Shared Room' }
];

// Listing type options
export const LISTING_TYPES = [
  { value: 'all', label: 'All Listings' },
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' }
];
