import { PropertyHistoryProps, GroupedHistoryRecord } from './types';
import { formatDate, getTimeAgo, getDaysOnMarket, getPropertyAddress } from './utils';
import ListingTimeline from './ListingTimeline';
import PriceChange from './PriceChange';
import TaxHistory from './TaxHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  VerticalTabs, 
  VerticalTabsList, 
  VerticalTabsTrigger, 
  VerticalTabsContent,
  VerticalTabsContainer
} from '@/components/ui/vertical-tabs';
import EstimateHistorySection from './EstimateHistorySection';
import { Button } from '@/components/ui/button';
import { HistoryIcon, Clock, TrendingUp, Receipt } from 'lucide-react';

export default function PropertyHistory({ listingHistory, property, rawProperty }: PropertyHistoryProps) {
  // Get property address
  const propertyAddress = getPropertyAddress(property);

  // Group listings by period (for now, treat each as separate)
  // History is already sorted by most recent first from generatePropertyDetailsData
  const groupedHistory: GroupedHistoryRecord[] = listingHistory.map((record, index) => {
    // First record (index 0) is the most recent listing
    // Check if it's active based on property status and whether it has an end date
    const isMostRecent = index === 0;
    const hasEndDate = record.dateEnd && new Date(record.dateEnd) < new Date();
    const isActive = isMostRecent && property?.status === 'Active' && !hasEndDate;
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
      <VerticalTabs defaultValue="timeline" className="w-full">
        <VerticalTabsContainer>
          <VerticalTabsList>
            <VerticalTabsTrigger value="timeline" className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-secondary" />
              <span>Listing Timeline</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="price" className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-secondary" />
              <span>Price Change</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="tax" className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-secondary" />
              <span>Tax History</span>
            </VerticalTabsTrigger>
          </VerticalTabsList>
          
          <div className="flex-1">
            <VerticalTabsContent value="timeline">
              <ListingTimeline groupedHistory={groupedHistory} propertyAddress={propertyAddress} />
            </VerticalTabsContent>
            
            <VerticalTabsContent value="price">
              <PriceChange groupedHistory={groupedHistory} propertyAddress={propertyAddress} />
            </VerticalTabsContent>
            
            <VerticalTabsContent value="tax">
              <TaxHistory property={property} propertyAddress={propertyAddress} />
            </VerticalTabsContent>
          </div>
        </VerticalTabsContainer>
      </VerticalTabs>
      <EstimateHistorySection propertyAddress={propertyAddress} rawProperty={rawProperty} />
      
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
          <HistoryIcon className="h-5 w-5" />
          Need more history details about this property
        </Button>
      </div>
    </div>
  );
}

