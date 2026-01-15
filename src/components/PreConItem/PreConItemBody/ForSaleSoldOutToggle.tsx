"use client";

import React from 'react';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';

interface ForSaleSoldOutToggleProps {
  activeTab: 'for-sale' | 'sold-out';
  onTabChange: (tab: 'for-sale' | 'sold-out') => void;
  forSaleCount: number;
  soldOutCount: number;
}

const ForSaleSoldOutToggle: React.FC<ForSaleSoldOutToggleProps> = ({ 
  activeTab, 
  onTabChange,
  forSaleCount,
  soldOutCount
}) => {
  const isForSaleActive = activeTab === 'for-sale';
  const isSoldOutActive = activeTab === 'sold-out';

  return (
    <div className="flex items-center gap-3">
      {/* For Sale Button */}
      <button
        onClick={() => onTabChange('for-sale')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all
          ${isForSaleActive 
            ? 'border-2 border-secondary text-primary' 
            : 'border border-gray-300 text-primary'
          }
        `}
      >
        <ShoppingCart className={`w-4 h-4 ${isForSaleActive ? 'text-gray-900' : 'text-gray-500'}`} />
        <span>For Sale ({forSaleCount})</span>
      </button>

      {/* Sold Out Button */}
      <button
        onClick={() => onTabChange('sold-out')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all
          ${isSoldOutActive 
            ? 'border-2 border-secondary text-primary' 
            : 'border border-gray-300 text-primary'
          }
        `}
      >
        <CheckCircle2 className={`w-4 h-4 ${isSoldOutActive ? 'text-gray-900' : 'text-gray-500'}`} />
        <span>Sold Out ({soldOutCount})</span>
      </button>
    </div>
  );
};

export default ForSaleSoldOutToggle;

