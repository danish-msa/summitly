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
  // Core fields
  mlsNumber?: string;
  resource?: string;
  status?: string;
  class?: string;
  type?: string;
  listPrice?: number;
  listDate?: string;
  lastStatus?: string;
  soldPrice?: number | string | null;
  soldDate?: string | null;
  originalPrice?: number;
  assignment?: string | null;
  legalDescription?: string;
  publicRemarks?: string;
  updatedOn?: string;
  boardId?: number;
  daysOnMarket?: number;
  occupancy?: string | null;
  photoCount?: number;
  simpleDaysOnMarket?: number;
  standardStatus?: string;
  
  address?: {
    area?: string | null;
    city?: string | null;
    country?: string | null;
    district?: string | null;
    majorIntersection?: string | null;
    neighborhood?: string | null;
    streetDirection?: string | null;
    streetName?: string | null;
    streetNumber?: string | null;
    streetSuffix?: string | null;
    unitNumber?: string | null;
    zip?: string | null;
    state?: string | null;
    communityCode?: string | null;
    streetDirectionPrefix?: string | null;
    addressKey?: string | null;
  };
  
  map?: {
    latitude?: number;
    longitude?: number;
    point?: string;
  };
  
  permissions?: {
    displayAddressOnInternet?: string;
    displayPublic?: string;
    displayInternetEntireListing?: string;
  };
  
  details?: {
    airConditioning?: string | null;
    basement1?: string | null;
    basement2?: string | null;
    centralVac?: string | null;
    den?: string | null;
    description?: string | null;
    elevator?: string | null;
    exteriorConstruction1?: string | null;
    exteriorConstruction2?: string | null;
    extras?: string | null;
    furnished?: string | null;
    garage?: string | null;
    heating?: string | null;
    numBathrooms?: number | null;
    numBathroomsPlus?: number | null;
    numBedrooms?: number | null;
    numBedroomsPlus?: number | null;
    numFireplaces?: number | null;
    numGarageSpaces?: number | null;
    numParkingSpaces?: number | null;
    numRooms?: number | null;
    numRoomsPlus?: number | null;
    patio?: string | null;
    propertyType?: string | null;
    sqft?: number | string | null;
    minSqft?: string | null;
    maxSqft?: string | null;
    style?: string | null;
    swimmingPool?: string | null;
    virtualTourUrl?: string | null;
    yearBuilt?: string | null;
    landAccessType?: string | null;
    landSewer?: string | null;
    viewType?: string | null;
    zoningDescription?: string | null;
    analyticsClick?: string | null;
    moreInformationLink?: string | null;
    alternateURLVideoLink?: string | null;
    flooringType?: string | null;
    foundationType?: string | null;
    landscapeFeatures?: string | null;
    fireProtection?: string | null;
    roofMaterial?: string | null;
    farmType?: string | null;
    zoningType?: string | null;
    businessType?: string | null;
    businessSubType?: string | null;
    landDisposition?: string | null;
    storageType?: string | null;
    constructionStyleSplitLevel?: string | null;
    constructionStatus?: string | null;
    loadingType?: string | null;
    ceilingType?: string | null;
    liveStreamEventURL?: string | null;
    energuideRating?: string | null;
    amperage?: string | null;
    sewer?: string | null;
    familyRoom?: string | null;
    zoning?: string | null;
    driveway?: string | null;
    leaseTerms?: string | null;
    centralAirConditioning?: string | null;
    certificationLevel?: string | null;
    energyCertification?: string | null;
    parkCostMonthly?: string | null;
    commonElementsIncluded?: string | null;
    greenPropertyInformationStatement?: string | null;
    handicappedEquipped?: string | null;
    laundryLevel?: string | null;
    balcony?: string | null;
    numKitchens?: number | null;
    numKitchensPlus?: number | null;
    sqftRange?: string | null;
    numDrivewaySpaces?: number | null;
    HOAFee?: string | null;
    HOAFee2?: string | null;
    HOAFee3?: string | null;
    waterSource?: string | null;
    livingAreaMeasurement?: string | null;
    waterfront?: string | null;
    bathrooms?: unknown[];
    numBathroomsHalf?: number | null;
  };
  
  lot?: {
    acres?: number | null;
    depth?: number | string | null;
    irregular?: number | string | null;
    legalDescription?: string | null;
    measurement?: string | null;
    width?: number | null;
    size?: number | string | null;
    source?: string | null;
    dimensionsSource?: string | null;
    dimensions?: string | null;
    squareFeet?: number | null;
    features?: string | null;
    taxLot?: string | null;
  };
  
  condominium?: {
    buildingInsurance?: string | null;
    condoCorp?: string | null;
    condoCorpNum?: string | null;
    exposure?: string | null;
    lockerNumber?: string | null;
    locker?: string | null;
    parkingType?: string | null;
    pets?: string | null;
    propertyMgr?: string | null;
    stories?: string | null;
    fees?: {
      cableInlc?: string | null;
      heatIncl?: string | null;
      hydroIncl?: string | null;
      maintenance?: number | null;
      parkingIncl?: string | null;
      taxesIncl?: string | null;
      waterIncl?: string | null;
    };
    lockerUnitNumber?: string | null;
    ensuiteLaundry?: string | null;
    sharesPercentage?: string | null;
    lockerLevel?: string | null;
    unitNumber?: string | null;
    amenities?: string[];
  } | null;
  
  coopCompensation?: unknown | null;
  
  nearby?: {
    amenities?: string[];
  };
  
  office?: {
    brokerageName?: string;
  };
  
  openHouse?: Array<{
    date?: string;
    startTime?: string;
    endTime?: string;
    type?: string;
    status?: string;
  }>;
  
  rooms?: Array<{
    description?: string;
    features?: string | null;
    features2?: string | null;
    features3?: string | null;
    length?: number | string | null;
    width?: number | string | null;
    level?: string;
  }>;
  
  taxes?: {
    annualAmount?: number | null;
    assessmentYear?: string | null;
  };
  
  timestamps?: {
    idxUpdated?: string | null;
    listingUpdated?: string | null;
    photosUpdated?: string | null;
    conditionalExpiryDate?: string | null;
    terminatedDate?: string | null;
    suspendedDate?: string | null;
    listingEntryDate?: string | null;
    closedDate?: string | null;
    unavailableDate?: string | null;
    expiryDate?: string | null;
    extensionEntryDate?: string | null;
    possessionDate?: string | null;
    repliersUpdatedOn?: string | null;
    imageInsightsUpdatedOn?: string | null;
  };
  
  agents?: Array<{
    agentId?: string;
    boardAgentId?: string;
    officeId?: string;
    updatedOn?: string;
    name?: string;
    board?: string | null;
    boardOfficeId?: string;
    position?: string;
    email?: string;
    phones?: string[];
    social?: unknown[];
    website?: string | null;
    photo?: {
      small?: string | null;
      large?: string | null;
      updatedOn?: string | null;
    };
    brokerage?: {
      name?: string;
      address?: {
        address1?: string;
        address2?: string | null;
        city?: string;
        state?: string;
        postal?: string;
        country?: string | null;
      };
    };
  }>;
  
  history?: Array<{
    mlsNumber?: string;
    type?: string;
    listPrice?: number;
    listDate?: string;
    lastStatus?: string;
    soldPrice?: number | null;
    soldDate?: string | null;
    images?: string[];
    photoCount?: number;
    office?: {
      brokerageName?: string;
    };
    timestamps?: {
      idxUpdated?: string | null;
      listingUpdated?: string | null;
      photosUpdated?: string | null;
      conditionalExpiryDate?: string | null;
      terminatedDate?: string | null;
      suspendedDate?: string | null;
      listingEntryDate?: string | null;
      closedDate?: string | null;
      unavailableDate?: string | null;
      expiryDate?: string | null;
      extensionEntryDate?: string | null;
      possessionDate?: string | null;
      repliersUpdatedOn?: string | null;
      imageInsightsUpdatedOn?: string | null;
    };
  }>;
  
  comparables?: Array<{
    mlsNumber?: string;
    type?: string;
    listPrice?: number;
    listDate?: string;
    lastStatus?: string;
    soldPrice?: number | null;
    soldDate?: string | null;
    address?: {
      area?: string | null;
      city?: string | null;
      country?: string | null;
      district?: string | null;
      majorIntersection?: string | null;
      neighborhood?: string | null;
      streetDirection?: string | null;
      streetName?: string | null;
      streetNumber?: string | null;
      streetSuffix?: string | null;
      unitNumber?: string | null;
      zip?: string | null;
      state?: string | null;
      communityCode?: string | null;
      streetDirectionPrefix?: string | null;
    };
    details?: {
      airConditioning?: string | null;
      basement1?: string | null;
      basement2?: string | null;
      centralVac?: string | null;
      den?: string | null;
      description?: string | null;
      elevator?: string | null;
      exteriorConstruction1?: string | null;
      exteriorConstruction2?: string | null;
      extras?: string | null;
      furnished?: string | null;
      garage?: string | null;
      heating?: string | null;
      numBathrooms?: number | null;
      numBathroomsPlus?: number | null;
      numBedrooms?: number | null;
      numBedroomsPlus?: number | null;
      numFireplaces?: number | null;
      numGarageSpaces?: number | null;
      numParkingSpaces?: number | null;
      numRooms?: number | null;
      numRoomsPlus?: number | null;
      patio?: string | null;
      propertyType?: string | null;
      sqft?: number | string | null;
      minSqft?: string | null;
      maxSqft?: string | null;
      style?: string | null;
      swimmingPool?: string | null;
      virtualTourUrl?: string | null;
      yearBuilt?: string | null;
      landAccessType?: string | null;
      landSewer?: string | null;
      viewType?: string | null;
      zoningDescription?: string | null;
      analyticsClick?: string | null;
      moreInformationLink?: string | null;
      alternateURLVideoLink?: string | null;
      flooringType?: string | null;
      foundationType?: string | null;
      landscapeFeatures?: string | null;
      fireProtection?: string | null;
      roofMaterial?: string | null;
      farmType?: string | null;
      zoningType?: string | null;
      businessType?: string | null;
      businessSubType?: string | null;
      landDisposition?: string | null;
      storageType?: string | null;
      constructionStyleSplitLevel?: string | null;
      constructionStatus?: string | null;
      loadingType?: string | null;
      ceilingType?: string | null;
      liveStreamEventURL?: string | null;
      energuideRating?: string | null;
      amperage?: string | null;
      sewer?: string | null;
      familyRoom?: string | null;
      zoning?: string | null;
      driveway?: string | null;
      leaseTerms?: string | null;
      centralAirConditioning?: string | null;
      certificationLevel?: string | null;
      energyCertification?: string | null;
      parkCostMonthly?: string | null;
      commonElementsIncluded?: string | null;
      greenPropertyInformationStatement?: string | null;
      handicappedEquipped?: string | null;
      laundryLevel?: string | null;
      balcony?: string | null;
      numKitchens?: number | null;
      numKitchensPlus?: number | null;
      sqftRange?: string | null;
      numDrivewaySpaces?: number | null;
      HOAFee?: string | null;
      HOAFee2?: string | null;
      HOAFee3?: string | null;
      waterSource?: string | null;
      livingAreaMeasurement?: string | null;
      waterfront?: string | null;
      bathrooms?: unknown[];
      numBathroomsHalf?: number | null;
    };
    condominium?: {
      buildingInsurance?: string | null;
      condoCorp?: string | null;
      condoCorpNum?: string | null;
      exposure?: string | null;
      lockerNumber?: string | null;
      locker?: string | null;
      parkingType?: string | null;
      pets?: string | null;
      propertyMgr?: string | null;
      stories?: string | null;
      fees?: {
        cableInlc?: string | null;
        heatIncl?: string | null;
        hydroIncl?: string | null;
        maintenance?: number | null;
        parkingIncl?: string | null;
        taxesIncl?: string | null;
        waterIncl?: string | null;
      };
      lockerUnitNumber?: string | null;
      ensuiteLaundry?: string | null;
      sharesPercentage?: string | null;
      lockerLevel?: string | null;
      unitNumber?: string | null;
      amenities?: string[];
    } | null;
    images?: string[];
    timestamps?: {
      idxUpdated?: string | null;
      listingUpdated?: string | null;
      photosUpdated?: string | null;
      conditionalExpiryDate?: string | null;
      terminatedDate?: string | null;
      suspendedDate?: string | null;
      listingEntryDate?: string | null;
      closedDate?: string | null;
      unavailableDate?: string | null;
      expiryDate?: string | null;
      extensionEntryDate?: string | null;
      possessionDate?: string | null;
      repliersUpdatedOn?: string | null;
      imageInsightsUpdatedOn?: string | null;
    };
    distance?: number;
  }>;
  
  estimate?: {
    date?: string;
    high?: number;
    low?: number;
    confidence?: number;
    history?: {
      mth?: Record<string, { value: number }>;
    };
    value?: number;
  };
  
  imageInsights?: {
    summary?: {
      quality?: {
        qualitative?: {
          features?: {
            livingRoom?: string;
            frontOfStructure?: string;
            kitchen?: string;
            diningRoom?: string;
            bathroom?: string;
            bedroom?: string;
          };
          overall?: string;
        };
        quantitative?: {
          features?: {
            livingRoom?: number;
            frontOfStructure?: number;
            kitchen?: number;
            diningRoom?: number;
            bathroom?: number;
            bedroom?: number;
          };
          overall?: number;
        };
      };
    };
    images?: Array<{
      image?: string;
      classification?: {
        imageOf?: string;
        prediction?: number;
      };
      quality?: {
        qualitative?: string;
        quantitative?: number;
      } | null;
    }>;
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
    daysOnMarket?: number;
    originalPrice?: number;

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
        description?: string | null;
        yearBuilt?: string | null;
        garage?: string | null;
        numGarageSpaces?: number | null;
        swimmingPool?: string | null;
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
    openHouse?: Array<{
        date?: string;
        startTime?: string;
        endTime?: string;
        type?: string;
        status?: string;
    }>;
    condominium?: {
        buildingInsurance?: string | null;
        condoCorp?: string | null;
        condoCorpNum?: string | null;
        exposure?: string | null;
        lockerNumber?: string | null;
        locker?: string | null;
        parkingType?: string | null;
        pets?: string | null;
        propertyMgr?: string | null;
        stories?: string | null;
        fees?: {
            cableInlc?: string | null;
            heatIncl?: string | null;
            hydroIncl?: string | null;
            maintenance?: number | null;
            parkingIncl?: string | null;
            taxesIncl?: string | null;
            waterIncl?: string | null;
        };
        lockerUnitNumber?: string | null;
        ensuiteLaundry?: string | null;
        sharesPercentage?: string | null;
        lockerLevel?: string | null;
        unitNumber?: string | null;
        amenities?: string[];
    } | null;
    preCon?: {
        projectName: string;
        developer: string;
        startingPrice: number; // Keep for backward compatibility
        priceRange?: {
            min: number;
            max: number;
        };
        status: 'selling' | 'coming-soon' | 'sold-out';
        completion: {
            date: string;
            progress: number;
        };
        details: {
            bedroomRange: string;
            bathroomRange: string;
            sqftRange: string;
            totalUnits: number;
            availableUnits: number;
            storeys?: number; // Number of floors/storeys
            height?: number; // Height in meters
            propertyType?: string; // Property type (e.g., 'Condominium', 'Houses')
            subPropertyType?: string; // Sub property type (e.g., 'High-Rise', 'Detached')
        };
        features: string[];
        amenities?: string[]; // Project amenities list
        videos?: string[]; // Property videos
        depositStructure?: string;
        description: string;
        documents?: Array<{
            id: string;
            name: string;
            url: string;
            type: 'brochure' | 'floorplan' | 'specification' | 'contract' | 'other';
            size?: string;
            uploadedDate?: string;
        }>;
        developmentTeam?: {
            overview?: string;
            developer?: {
                id?: string;
                name: string;
                description?: string;
                website?: string;
                image?: string;
                email?: string;
                phone?: string;
                stats?: {
                    totalProjects: number;
                    activelySelling: number;
                    launchingSoon: number;
                    registrationPhase: number;
                    soldOut: number;
                    resale: number;
                    cancelled: number;
                };
            };
            architect?: {
                id?: string;
                name: string;
                description?: string;
                website?: string;
                image?: string;
                email?: string;
                phone?: string;
                stats?: {
                    totalProjects: number;
                    activelySelling: number;
                    launchingSoon: number;
                    registrationPhase: number;
                    soldOut: number;
                    resale: number;
                    cancelled: number;
                };
            };
            interiorDesigner?: {
                id?: string;
                name: string;
                description?: string;
                website?: string;
                image?: string;
                email?: string;
                phone?: string;
                stats?: {
                    totalProjects: number;
                    activelySelling: number;
                    launchingSoon: number;
                    registrationPhase: number;
                    soldOut: number;
                    resale: number;
                    cancelled: number;
                };
            };
            builder?: {
                id?: string;
                name: string;
                description?: string;
                website?: string;
                image?: string;
                email?: string;
                phone?: string;
                stats?: {
                    totalProjects: number;
                    activelySelling: number;
                    launchingSoon: number;
                    registrationPhase: number;
                    soldOut: number;
                    resale: number;
                    cancelled: number;
                };
            };
            landscapeArchitect?: {
                id?: string;
                name: string;
                description?: string;
                website?: string;
                image?: string;
                email?: string;
                phone?: string;
                stats?: {
                    totalProjects: number;
                    activelySelling: number;
                    launchingSoon: number;
                    registrationPhase: number;
                    soldOut: number;
                    resale: number;
                    cancelled: number;
                };
            };
            marketing?: {
                id?: string;
                name: string;
                description?: string;
                website?: string;
                image?: string;
                email?: string;
                phone?: string;
                stats?: {
                    totalProjects: number;
                    activelySelling: number;
                    launchingSoon: number;
                    registrationPhase: number;
                    soldOut: number;
                    resale: number;
                    cancelled: number;
                };
            };
        };
        units?: Array<{
            id: string;
            name: string;
            beds: string;
            baths: string;
            sqft?: number;
            images: string[];
            status: 'for-sale' | 'sold-out';
            maintenanceFee: number;
            price?: number;
            description?: string;
            features?: string[];
            amenities?: string[];
            studio?: boolean;
        }>;
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

// Agent data interface
export interface Agent {
  id: number;
  name: string;
  title: string;
  phone: string;
  email: string;
  bio: string;
  image: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  specialties: string[];
  languages: string[];
  reviews: number;
  rating: number;
  listings: number;
}

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'agent' | 'admin';
  preferences: {
    priceRange: {
      min: number;
      max: number;
    };
    propertyTypes: string[];
    locations: string[];
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Property submission interface
export interface PropertySubmission {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  images: string[];
  features: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
}

// Mortgage calculation interface
export interface MortgageCalculation {
  principal: number;
  interestRate: number;
  termYears: number;
  downPayment: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
}

// Search interface
export interface SearchParams {
  query?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  sortBy?: 'price' | 'date' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Repliers API specific types
export interface RepliersPropertyClass {
  name: string; // "residential", "condo", "commercial"
  areas: Area[];
}

export interface Area {
  name: string;
  cities: City[];
}

export interface Board {
  boardId: number;
  name: string;
  updatedOn: string;
  classes: RepliersPropertyClass[];
}

export interface LocationsResponse {
  boards: Board[];
}

// Export unit types
export type { UnitListing } from './units';