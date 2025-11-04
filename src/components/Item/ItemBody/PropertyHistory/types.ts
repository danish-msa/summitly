import { PropertyListing } from '@/lib/types';

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

