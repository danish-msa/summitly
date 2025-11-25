// Types for Pre-Construction Property Cards
export interface PreConstructionProperty {
  id: string;
  projectName: string;
  developer: string;
  startingPrice: number;
  images: string[];
  address: {
    street: string;
    city: string;
    province: string;
    latitude?: number;
    longitude?: number;
  };
  details: {
    propertyType: string;
    bedroomRange: string; // e.g., "1-3"
    bathroomRange: string; // e.g., "1-2"
    sqftRange: string; // e.g., "650-1,200"
    totalUnits: number;
    availableUnits: number;
  };
  completion: {
    date: string; // e.g., "Q4 2025"
    progress: number; // 0-100
  };
  features: string[];
  depositStructure?: string; // e.g., "5% on signing"
  status: 'selling' | 'coming-soon' | 'sold-out';
}

// Union type to handle both PreConstructionProperty and PropertyListing formats
export type PreConstructionPropertyInput = PreConstructionProperty | {
  id?: string;
  mlsNumber?: string;
  preCon?: {
    projectName?: string;
    developer?: string;
    startingPrice?: number;
    status?: string;
    images?: string[];
    details?: {
      propertyType?: string;
      bedroomRange?: string;
      bathroomRange?: string;
      sqftRange?: string;
      totalUnits?: number;
      availableUnits?: number;
    };
    completion?: {
      date?: string;
      progress?: number;
    };
  };
  projectName?: string;
  developer?: string;
  startingPrice?: number;
  status?: string;
  images?: string[] | { allImages?: string[]; imageUrl?: string };
  address?: {
    street?: string;
    streetNumber?: string;
    streetName?: string;
    city?: string;
    province?: string;
    location?: string;
  };
  details?: {
    propertyType?: string;
    bedroomRange?: string;
    bathroomRange?: string;
    sqftRange?: string;
    totalUnits?: number;
    availableUnits?: number;
  };
  completion?: {
    date?: string;
    progress?: number;
  };
  listPrice?: number;
};

export interface PreConstructionPropertyCardProps {
  property: PreConstructionPropertyInput;
  onHide?: () => void;
  className?: string;
}

