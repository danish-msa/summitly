"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-4">
      {/* Cool Switch Toggle with Tooltips */}
      <div className="relative">
        {/* Background Container */}
        <div className="relative bg-gray-100 rounded-lg p-1 shadow-inner">
          {/* Animated Switch Handle */}
          <motion.div
            className="absolute top-1 z-10 bg-white rounded-lg shadow-lg border border-gray-200"
            style={{
              width: '120px',
              height: '30px',
            }}
            animate={{
              x: activeTab === 'for-sale' ? 0 : 115,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
          
          {/* Toggle Options */}
          <div className="relative flex">
            {/* For Sale Option */}
            <motion.button
              className={`relative z-20 flex items-center justify-center gap-2 px-3 w-30 h-8 rounded-full transition-all duration-300 ${
                activeTab === 'for-sale' 
                  ? 'text-primary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => onTabChange('for-sale')}
              onMouseEnter={() => setHoveredOption('for-sale')}
              onMouseLeave={() => setHoveredOption(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-medium">For Sale ({forSaleCount})</span>
            </motion.button>

            {/* Sold Out Option */}
            <motion.button
              className={`relative z-20 flex items-center justify-center gap-2 px-3 w-30 h-8 rounded-full transition-all duration-300 ${
                activeTab === 'sold-out' 
                  ? 'text-primary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => onTabChange('sold-out')}
              onMouseEnter={() => setHoveredOption('sold-out')}
              onMouseLeave={() => setHoveredOption(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Sold Out ({soldOutCount})</span>
            </motion.button>
          </div>
        </div>

        {/* Tooltips */}
        <AnimatePresence>
          {hoveredOption && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-30"
            >
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                {hoveredOption === 'for-sale' ? 'View Available Units' : 'View Sold Out Units'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForSaleSoldOutToggle;

