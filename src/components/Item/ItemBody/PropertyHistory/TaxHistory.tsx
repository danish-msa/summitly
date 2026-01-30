import { PropertyListing } from '@/lib/types';
import { TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TaxHistoryProps {
  property?: PropertyListing;
  propertyAddress: string;
}

// Mock tax history data - in a real app, this would come from an API
const generateMockTaxHistory = (property?: PropertyListing) => {
  const baseYear = new Date().getFullYear();
  const baseTax = property?.lot?.squareFeet ? Math.round((property.lot.squareFeet / 1000) * 1500) : 4200;
  
  return [
    {
      year: baseYear,
      assessedValue: property?.listPrice ? Math.round(property.listPrice * 0.85) : 450000,
      taxAmount: baseTax,
      taxRate: 0.0125,
      paymentStatus: 'Paid',
      dueDate: `${baseYear}-12-31`
    },
    {
      year: baseYear - 1,
      assessedValue: property?.listPrice ? Math.round(property.listPrice * 0.82) : 430000,
      taxAmount: Math.round(baseTax * 0.95),
      taxRate: 0.0120,
      paymentStatus: 'Paid',
      dueDate: `${baseYear - 1}-12-31`
    },
    {
      year: baseYear - 2,
      assessedValue: property?.listPrice ? Math.round(property.listPrice * 0.80) : 410000,
      taxAmount: Math.round(baseTax * 0.90),
      taxRate: 0.0118,
      paymentStatus: 'Paid',
      dueDate: `${baseYear - 2}-12-31`
    },
    {
      year: baseYear - 3,
      assessedValue: property?.listPrice ? Math.round(property.listPrice * 0.78) : 390000,
      taxAmount: Math.round(baseTax * 0.85),
      taxRate: 0.0115,
      paymentStatus: 'Paid',
      dueDate: `${baseYear - 3}-12-31`
    }
  ];
};

export default function TaxHistory({ property, propertyAddress }: TaxHistoryProps) {
  const taxHistory = generateMockTaxHistory(property);

  // Calculate average tax increase
  const taxIncreases = taxHistory.slice(0, -1).map((tax, index) => {
    const previousTax = taxHistory[index + 1];
    return ((tax.taxAmount - previousTax.taxAmount) / previousTax.taxAmount) * 100;
  });
  const avgIncrease = taxIncreases.length > 0 
    ? taxIncreases.reduce((sum, inc) => sum + inc, 0) / taxIncreases.length 
    : 0;

  return (
    <div className="bg-white py-3 sm:py-4 min-w-0">
      <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-4 sm:mb-6">Property tax history for {propertyAddress}</p>
      
      {/* Summary Card */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tax Overview</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Current Year Tax</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              ${taxHistory[0]?.taxAmount.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Assessed Value</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              ${taxHistory[0]?.assessedValue.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Avg. Annual Increase</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {avgIncrease > 0 ? '+' : ''}{avgIncrease.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Tax History Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
      <Table className="min-w-[520px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px] sm:w-[120px] py-2 sm:py-3">Year</TableHead>
            <TableHead className="w-[100px] sm:w-[150px] text-right py-2 sm:py-3">Assessed Value</TableHead>
            <TableHead className="w-[90px] sm:w-[120px] text-right py-2 sm:py-3">Tax Amount</TableHead>
            <TableHead className="w-[80px] sm:w-[120px] text-right py-2 sm:py-3">Tax Rate</TableHead>
            <TableHead className="w-[90px] sm:w-[130px] text-right py-2 sm:py-3">Change</TableHead>
            <TableHead className="w-[80px] sm:w-[150px] text-center py-2 sm:py-3">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taxHistory.map((tax, index) => {
            const previousTax = taxHistory[index + 1];
            const taxChange = previousTax ? tax.taxAmount - previousTax.taxAmount : 0;
            const taxChangePercent = previousTax ? ((taxChange / previousTax.taxAmount) * 100) : 0;
            const isIncrease = taxChange > 0;
            const isDecrease = taxChange < 0;
            const showChange = previousTax !== undefined;

            return (
              <TableRow key={tax.year}>
                <TableCell className="font-medium">
                  <span className="text-gray-900">{tax.year}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-gray-900">
                    ${tax.assessedValue.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-gray-900">
                    ${tax.taxAmount.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-gray-900">
                    {(tax.taxRate * 100).toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {showChange ? (
                    <div className={`flex items-center justify-end gap-1 ${
                      isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {isIncrease && <ArrowUp className="h-3 w-3" />}
                      {isDecrease && <ArrowDown className="h-3 w-3" />}
                      {!isIncrease && !isDecrease && <Minus className="h-3 w-3" />}
                      <span className="font-medium">
                        {isIncrease ? '+' : ''}${Math.abs(taxChange).toLocaleString()}
                        {' '}
                        <span className="text-xs">
                          ({isIncrease ? '+' : ''}{taxChangePercent.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    className={`px-2.5 py-1 ${
                      tax.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' 
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0'
                    }`}
                  >
                    {tax.paymentStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>

      {/* Additional Info */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <p className="text-[10px] sm:text-xs text-gray-600">
          <strong>Note:</strong> Property tax information is based on public records and may vary. 
          Tax rates and assessed values are subject to change. Please verify with your local tax assessor's office.
        </p>
      </div>
      {/* Call to Action */}
      <div className="flex justify-center pt-4 sm:pt-6 pb-4">
        <Button 
          variant="default" 
          className="w-full sm:w-auto px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-base rounded-lg gap-2"
          onClick={() => {
            // Add handler for CTA click
            console.log('Need more tax history details about this property');
          }}
        >
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden />
          Need more tax history details about this property
        </Button>
      </div>
    </div>
  );
}

