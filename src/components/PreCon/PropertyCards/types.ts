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

export interface PreConstructionPropertyCardProps {
  property: PreConstructionProperty;
  onHide?: () => void;
  className?: string;
}

