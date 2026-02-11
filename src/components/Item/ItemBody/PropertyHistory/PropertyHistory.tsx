import { PropertyHistoryProps, GroupedHistoryRecord } from './types';
import { formatDate, getTimeAgo, getDaysOnMarket, getPropertyAddress } from './utils';
import TransactionHistory from './TransactionHistory';
import TaxHistory from './TaxHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EstimateHistorySection from './EstimateHistorySection';

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
    <div className="w-full pl-4 md:pl-10 min-w-0">
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="w-full grid grid-cols-2 sm:flex sm:w-fit h-auto p-1 gap-1">
          <TabsTrigger value="transactions" className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 data-[state=active]:bg-background">
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 data-[state=active]:bg-background">
            Tax History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <TransactionHistory groupedHistory={groupedHistory} propertyAddress={propertyAddress} />
        </TabsContent>
        
        <TabsContent value="tax">
          <TaxHistory property={property} propertyAddress={propertyAddress} />
        </TabsContent>
      </Tabs>
      
      <EstimateHistorySection propertyAddress={propertyAddress} rawProperty={rawProperty} />
    </div>
  );
}

