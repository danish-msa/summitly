import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';

export interface ListingHistoryRecord {
  dateStart: string;
  dateEnd: string;
  listPrice: string;
  price: string;
  event: string;
  listingId: string;
  brokerage?: string;
  photoCount?: number;
  imageUrl?: string;
}

export interface PropertyHistoryProps {
  listingHistory: ListingHistoryRecord[];
  property?: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
}

export interface EstimateData {
  month: string;
  value: number;
  date: string;
}

export interface GroupedHistoryRecord extends ListingHistoryRecord {
  isActive: boolean;
  daysOnMarket: number;
  formattedStartDate: string;
  formattedEndDate: string;
  timeAgo: string;
  brokerage: string;
  photoCount: number;
  imageUrl: string;
}

