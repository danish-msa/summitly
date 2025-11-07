import { PropertyHistoryProps, GroupedHistoryRecord } from './types';
import { formatDate, getTimeAgo, getDaysOnMarket, getPropertyAddress } from './utils';
import ListingTimeline from './ListingTimeline';
import EstimateHistorySection from './EstimateHistorySection';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

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
    <div className="w-full">
      <ListingTimeline groupedHistory={groupedHistory} propertyAddress={propertyAddress} />
      <EstimateHistorySection propertyAddress={propertyAddress} />
      
      {/* Call to Action */}
      <div className="flex justify-center pt-6 pb-4">
        <Button 
          variant="default" 
          className="bg-gradient-to-r from-brand-celestial to-brand-cb-blue hover:bg-brand-midnight text-white px-8 py-6 text-base rounded-lg gap-2"
          onClick={() => {
            // Add handler for CTA click
            console.log('Need more history details about this property');
          }}
        >
          <History className="h-5 w-5" />
          Need more history details about this property
        </Button>
      </div>
    </div>
  );
}

