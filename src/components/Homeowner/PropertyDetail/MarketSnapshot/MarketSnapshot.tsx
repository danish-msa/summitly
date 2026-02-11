"use client";

import React from 'react';
import { ArrowUp } from 'lucide-react';
import Link from 'next/link';

interface MarketSnapshotProps {
  zip?: string;
  city?: string;
  state?: string;
  // Market data props
  localAverageSoldPrice?: number;
  medianListPrice?: number;
  averageDaysOnMarket?: number;
  newListings?: number;
  newSold?: number;
  medianPricePerSqft?: number;
}

const MarketSnapshot: React.FC<MarketSnapshotProps> = ({
  zip,
  city,
  state,
  localAverageSoldPrice = 290000,
  medianListPrice = 296450,
  averageDaysOnMarket = 67,
  newListings = 5,
  newSold = 5,
  medianPricePerSqft = 161,
}) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get date range (last 7 days)
  const getDateRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    };

    return `${formatDate(sevenDaysAgo)} - ${formatDate(today)}`;
  };

  // Determine location label (prefer ZIP, fallback to city/state)
  const locationLabel = zip || (city && state ? `${city}, ${state}` : city || 'Area');

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {locationLabel} Snapshot
        </h3>
        <p className="text-sm text-gray-500">
          {getDateRange()}
        </p>
      </div>

      {/* Market Metrics - Two Column Layout */}
      <div className="space-y-4 mb-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Local average sold price</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(localAverageSoldPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">New listings</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">{newListings}</p>
              <ArrowUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Median list price</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(medianListPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">New sold</p>
            <p className="text-lg font-semibold text-gray-900">{newSold}</p>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Average number of days on market</p>
            <p className="text-lg font-semibold text-gray-900">{averageDaysOnMarket}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Median $/sq. ft.</p>
            <p className="text-lg font-bold text-gray-900">
              ${medianPricePerSqft}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-6">
        <Link
          href="#"
          className="text-sm text-blue-600 hover:text-blue-700 underline"
          onClick={(e) => {
            e.preventDefault();
            // Add handler for data source link
            console.log('Data source clicked');
          }}
        >
          Where did we get this information?
        </Link>
      </div>
    </div>
  );
};

export default MarketSnapshot;
