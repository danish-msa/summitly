export type PageType = 'city' | 'status' | 'propertyType' | 'subPropertyType' | 'completionYear';

export interface PreConstructionBasePageProps {
  slug: string;
  pageType: PageType;
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

