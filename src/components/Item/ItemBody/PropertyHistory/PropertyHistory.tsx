import { PropertyListing } from '@/lib/types';
import { PropertyHistoryProps, GroupedHistoryRecord, ListingHistoryRecord } from './types';
import { formatDate, getTimeAgo, getDaysOnMarket, getPropertyAddress } from './utils';
import ListingTimeline from './ListingTimeline';
import EstimateHistorySection from './EstimateHistorySection';

export default function PropertyHistory({ listingHistory, property }: PropertyHistoryProps) {
  // Get property address
  const propertyAddress = getPropertyAddress(property);

  // Group listings by period (for now, treat each as separate)
  // In a real implementation, you'd group by listing period
  const groupedHistory: GroupedHistoryRecord[] = listingHistory.map((record, index) => {
    const isActive = index === 0 && property?.status === 'Active';
    const daysOnMarket = getDaysOnMarket(record.dateStart, record.dateEnd);
    
    return {
      ...record,
      isActive,
      daysOnMarket,
      formattedStartDate: formatDate(record.dateStart),
      formattedEndDate: formatDate(record.dateEnd),
      timeAgo: getTimeAgo(record.dateStart),
      brokerage: record.brokerage || 'MASTER\'S TRUST REALTY INC.',
      photoCount: record.photoCount || 44,
      imageUrl: record.imageUrl || property?.images?.imageUrl || property?.images?.allImages?.[0] || ''
    };
  });

  return (
    <>
      <ListingTimeline groupedHistory={groupedHistory} propertyAddress={propertyAddress} />
      <EstimateHistorySection propertyAddress={propertyAddress} />
    </>
  );
}

