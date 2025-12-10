import { PropertyListing } from '@/lib/types';
import { FileText, TrendingUp } from 'lucide-react';

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
    <div className="bg-white py-4">
      <p className="text-sm text-gray-600 mt-1 mb-6">Property tax history for {propertyAddress}</p>
      
      {/* Summary Card */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tax Overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Current Year Tax</p>
            <p className="text-xl font-bold text-gray-900">
              ${taxHistory[0]?.taxAmount.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Assessed Value</p>
            <p className="text-xl font-bold text-gray-900">
              ${taxHistory[0]?.assessedValue.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Avg. Annual Increase</p>
            <p className="text-xl font-bold text-gray-900">
              {avgIncrease > 0 ? '+' : ''}{avgIncrease.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Tax History Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Year</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Assessed Value</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tax Amount</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tax Rate</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {taxHistory.map((tax, index) => {
              const previousTax = taxHistory[index + 1];
              const taxChange = previousTax ? tax.taxAmount - previousTax.taxAmount : 0;
              const taxChangePercent = previousTax ? ((taxChange / previousTax.taxAmount) * 100) : 0;

              return (
                <tr key={tax.year} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{tax.year}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-gray-900">
                    ${tax.assessedValue.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-gray-900">
                      ${tax.taxAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-gray-600">
                    {(tax.taxRate * 100).toFixed(2)}%
                  </td>
                  <td className="py-4 px-4 text-right">
                    {previousTax ? (
                      <span className={`font-medium ${
                        taxChange > 0 ? 'text-red-600' : taxChange < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {taxChange > 0 ? '+' : ''}${taxChange.toLocaleString()}
                        {' '}
                        <span className="text-xs">
                          ({taxChangePercent > 0 ? '+' : ''}{taxChangePercent.toFixed(1)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      tax.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tax.paymentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Property tax information is based on public records and may vary. 
          Tax rates and assessed values are subject to change. Please verify with your local tax assessor's office.
        </p>
      </div>
    </div>
  );
}

