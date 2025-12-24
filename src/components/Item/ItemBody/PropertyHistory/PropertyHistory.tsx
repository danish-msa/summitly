import { PropertyHistoryProps, GroupedHistoryRecord } from './types';
import { formatDate, getTimeAgo, getDaysOnMarket, getPropertyAddress } from './utils';
import ListingTimeline from './ListingTimeline';
import PriceChange from './PriceChange';
import TaxHistory from './TaxHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EstimateHistorySection from './EstimateHistorySection';
import { Button } from '@/components/ui/button';
import { HistoryIcon } from 'lucide-react';

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
    <div className="w-full mt-5">
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className=" h-12 p-1">
          <TabsTrigger value="timeline" className="py-2 text-base">Listing Timeline</TabsTrigger>
          <TabsTrigger value="price" className="py-2 text-base">Price Change</TabsTrigger>
          <TabsTrigger value="tax" className="py-2 text-base">Tax History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-0">
          <ListingTimeline groupedHistory={groupedHistory} propertyAddress={propertyAddress} />
        </TabsContent>
        
        <TabsContent value="price" className="mt-0">
          <PriceChange groupedHistory={groupedHistory} propertyAddress={propertyAddress} />
        </TabsContent>
        
        <TabsContent value="tax" className="mt-0">
          <TaxHistory property={property} propertyAddress={propertyAddress} />
        </TabsContent>
      </Tabs>
      <EstimateHistorySection propertyAddress={propertyAddress} rawProperty={property?.rawProperty} />
      
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

