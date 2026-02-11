export type PageType = 'by-location' | 'status' | 'propertyType' | 'subPropertyType' | 'completionYear' | 'developer' | 'architect' | 'interior-designer' | 'builder' | 'landscape-architect' | 'marketing';

export interface PreConstructionBasePageProps {
  slug: string;
  pageType: PageType;
  teamType?: string; // For development team pages: 'developer', 'architect', etc.
  locationType?: 'city' | 'neighbourhood' | 'intersection' | null;
  locationName?: string | null; // Neighbourhood or intersection name
  bedroomFilter?: { bedrooms: number; isPlus: boolean } | null;
  bathroomFilter?: { bathrooms: number; isPlus: boolean } | null;
  priceRangeFilter?: { min?: number; max?: number; label: string } | null;
  sqftFilter?: { min?: number; max?: number; label: string } | null;
}

export interface PageContent {
  id: string;
  pageType: string;
  pageValue: string;
  title: string | null;
  description: string | null;
  heroImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  customContent: string | null;
  faqs: string | null;
  isPublished: boolean;
}

export interface PageInfo {
  title: string;
  numberOfProjects: number;
  province?: string;
  description?: string;
}

export interface TeamMemberInfo {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
}

