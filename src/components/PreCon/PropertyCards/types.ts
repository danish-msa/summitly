// Types for Pre-Construction Property Cards
export interface PreConstructionProperty {
  id: string;
  projectName: string;
  developer: string | null;
  startingPrice: number | null;
  images: string[];
  address: {
    street: string;
    city: string;
    province: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  details: {
    propertyType: string;
    bedroomRange: string | null; // e.g., "1-3"
    bathroomRange: string | null; // e.g., "1-2"
    sqftRange: string | null; // e.g., "650-1,200"
    totalUnits: number;
    availableUnits: number;
  };
  completion: {
    date: string | null; // e.g., "Q4 2025"
    progress: number; // 0-100
  };
  occupancyYear?: number | null; // e.g., 2026, 2027
  features: string[];
  depositStructure?: string | null; // e.g., "5% on signing"
  status: 'selling' | 'coming-soon' | 'sold-out';
}

export interface PreConstructionPropertyCardProps {
  property: PreConstructionProperty;
  onHide?: () => void;
  className?: string;
  /** Base path for the detail link (e.g. "/assignments" for assignment projects). Defaults to "/pre-con". */
  detailBasePath?: string;
}

