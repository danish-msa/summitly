import { GroupedHistoryRecord } from './types';
import { formatCurrency } from './utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PriceChangeProps {
  groupedHistory: GroupedHistoryRecord[];
  propertyAddress: string;
}

export default function PriceChange({ groupedHistory, propertyAddress }: PriceChangeProps) {
  // Extract price changes from history
  const priceChanges = groupedHistory.map((record, index) => {
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
      date: record.formattedStartDate,
      price: currentPrice,
      priceFormatted: record.price,
      previousPrice,
      priceChange,
      percentChange,
      isIncrease: priceChange > 0,
      isDecrease: priceChange < 0,
      event: record.event,
      daysOnMarket: record.daysOnMarket
    };
  });

  return (
    <div className="bg-white py-4">
      <p className="text-sm text-gray-600 mt-1 mb-6">Price change history for {propertyAddress}</p>
      
      <div className="space-y-6">
        {priceChanges.map((change, index) => (
          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Date and Event */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{change.date}</h3>
                  {change.event && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {change.event}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {change.daysOnMarket} day{change.daysOnMarket !== 1 ? 's' : ''} on market
                </p>
              </div>

              {/* Right side - Price and Change */}
              <div className="text-right">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-2xl font-bold text-gray-900">{change.priceFormatted}</p>
                  {change.previousPrice && (
                    <div className={`flex items-center gap-1 ${
                      change.isIncrease ? 'text-green-600' : change.isDecrease ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {change.isIncrease && <ArrowUp className="h-4 w-4" />}
                      {change.isDecrease && <ArrowDown className="h-4 w-4" />}
                      {!change.isIncrease && !change.isDecrease && <Minus className="h-4 w-4" />}
                      <span className="text-sm font-semibold">
                        {change.isIncrease ? '+' : ''}{formatCurrency(change.priceChange)}
                      </span>
                    </div>
                  )}
                </div>
                {change.previousPrice && (
                  <div className="text-xs text-gray-500">
                    <span className={change.isIncrease ? 'text-green-600' : change.isDecrease ? 'text-red-600' : 'text-gray-600'}>
                      {change.isIncrease ? '+' : ''}{change.percentChange.toFixed(1)}%
                    </span>
                    {' '}from {formatCurrency(change.previousPrice)}
                  </div>
                )}
                {!change.previousPrice && (
                  <p className="text-xs text-gray-500">Initial listing price</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {priceChanges.length > 1 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Highest Price</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(Math.max(...priceChanges.map(c => c.price)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Lowest Price</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(Math.min(...priceChanges.map(c => c.price)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Current Price</p>
              <p className="text-lg font-bold text-gray-900">
                {priceChanges[0]?.priceFormatted || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

