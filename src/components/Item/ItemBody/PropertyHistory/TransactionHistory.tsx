import { GroupedHistoryRecord } from './types';
import { formatCurrency } from './utils';
import { ArrowUp, ArrowDown, Minus, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TransactionHistoryProps {
  groupedHistory: GroupedHistoryRecord[];
  propertyAddress: string;
}

// Format date as "Jan 02, 2026"
const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
  });
};

// Get event badge variant based on event type
const getEventBadgeVariant = (event: string, isActive: boolean) => {
  const eventLower = event.toLowerCase();
  
  if (isActive) {
    return { className: 'bg-green-100 text-green-700 hover:bg-green-200 border-0' };
  }
  
  if (eventLower.includes('deed recorded')) {
    return { className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-0' };
  }
  if (eventLower.includes('closed')) {
    return { className: 'bg-red-100 text-red-700 hover:bg-red-200 border-0' };
  }
  if (eventLower.includes('pending')) {
    return { className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0' };
  }
  if (eventLower.includes('active under contract')) {
    return { className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-0' };
  }
  if (eventLower.includes('price change')) {
    return { className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-0' };
  }
  
  return { className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-0' };
};

export default function TransactionHistory({ groupedHistory, propertyAddress: _propertyAddress }: TransactionHistoryProps) {
  // Calculate price changes and appreciation for each record
  const tableData = groupedHistory.map((record, index) => {
    // Parse price from string (e.g., "$485,000" -> 485000)
    const parsePrice = (priceStr: string): number => {
      return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    };

    const currentPrice = parsePrice(record.price);
    const previousPrice = index < groupedHistory.length - 1 
      ? parsePrice(groupedHistory[index + 1].price)
      : null;

    const priceChange = previousPrice ? currentPrice - previousPrice : 0;
    const percentChange = previousPrice ? ((priceChange / previousPrice) * 100) : 0;

    return {
      ...record,
      currentPrice,
      previousPrice,
      priceChange,
      percentChange,
      isIncrease: priceChange > 0,
      isDecrease: priceChange < 0,
      formattedDateShort: formatDateShort(record.dateStart),
    };
  });

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[90px] sm:w-[120px]">Date</TableHead>
            <TableHead className="w-[100px] sm:w-[150px]">Status</TableHead>
            <TableHead className="w-[90px] sm:w-[120px] text-right">Price</TableHead>
            <TableHead className="w-[100px] sm:w-[130px] text-right">Price Change</TableHead>
            <TableHead className="w-[80px] sm:w-[120px] text-right">Days</TableHead>
            <TableHead className="w-[80px] sm:w-[120px] text-right">Appr.</TableHead>
            <TableHead className="w-[140px] sm:w-[200px]">Brokerage</TableHead>
            <TableHead className="w-[70px] sm:w-[100px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((record, index) => {
            const badgeProps = getEventBadgeVariant(record.event, record.isActive);
            const hasPrice = record.currentPrice > 0;
            const showPriceChange = record.previousPrice && record.previousPrice > 0;
            const showAppreciation = record.previousPrice && record.previousPrice > 0;
            
            return (
              <TableRow key={index} className={record.isActive ? 'bg-green-50/50' : ''}>
                <TableCell className="font-medium">
                  <span className="text-gray-900">{record.formattedDateShort}</span>
                </TableCell>
                <TableCell>
                  <Badge {...badgeProps} className={` px-2.5 py-1 ${badgeProps.className}`}>
                    {record.event === 'Listed For Sale' && record.isActive 
                      ? 'Active' 
                      : record.event}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {hasPrice ? (
                    <span className="font-semibold text-gray-900">{record.price}</span>
                  ) : (
                    <span className="text-gray-500">$—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {showPriceChange ? (
                    <div className={`flex items-center justify-end gap-1 ${
                      record.isIncrease ? 'text-green-600' : record.isDecrease ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {record.isIncrease && <ArrowUp className="h-3 w-3" />}
                      {record.isDecrease && <ArrowDown className="h-3 w-3" />}
                      {!record.isIncrease && !record.isDecrease && <Minus className="h-3 w-3" />}
                      <span className="font-medium">
                        {record.isIncrease ? '+' : ''}{formatCurrency(record.priceChange)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {record.daysOnMarket > 0 ? (
                    <span className="text-gray-900">
                      {record.daysOnMarket} day{record.daysOnMarket !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {showAppreciation ? (
                    <span className={`font-medium ${
                      record.isIncrease ? 'text-green-600' : record.isDecrease ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {record.isIncrease ? '+' : ''}{record.percentChange.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-gray-700">{record.brokerage}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      console.log('View details for listing:', record.listingId);
                    }}
                    aria-label={`View details for ${record.formattedDateShort}`}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

