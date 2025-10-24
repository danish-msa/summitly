"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Key } from 'lucide-react';

interface SellRentToggleProps {
  listingType: 'sell' | 'rent';
  onListingTypeChange: (type: 'sell' | 'rent') => void;
}

const SellRentToggle: React.FC<SellRentToggleProps> = ({ 
  listingType, 
  onListingTypeChange 
}) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleToggle = () => {
    onListingTypeChange(listingType === 'sell' ? 'rent' : 'sell');
  };

  return (
    <div className="flex items-center gap-4">
      {/* Cool Switch Toggle with Tooltips */}
      <div className="relative">
        {/* Background Container */}
        <div className="relative bg-gray-100 rounded-full p-1 shadow-inner">
          {/* Animated Switch Handle */}
          <motion.div
            className="absolute top-1 z-10 bg-white rounded-full shadow-lg border border-gray-200"
            style={{
              width: '100px',
              height: '40px',
            }}
            animate={{
              x: listingType === 'sell' ? 0 : 95,
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
            {/* Sell Option */}
            <motion.button
              className={`relative z-20 flex items-center justify-center gap-2 px-3 w-30 h-10 rounded-full transition-all duration-300 ${
                listingType === 'sell' 
                  ? 'text-secondary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => onListingTypeChange('sell')}
              onMouseEnter={() => setHoveredOption('sell')}
              onMouseLeave={() => setHoveredOption(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-4 h-4" />
              <span className="text-xs font-medium">For Sale</span>
            </motion.button>

            {/* Rent Option */}
            <motion.button
              className={`relative z-20 flex items-center justify-center gap-2 px-3 w-30 h-10 rounded-full transition-all duration-300 ${
                listingType === 'rent' 
                  ? 'text-secondary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => onListingTypeChange('rent')}
              onMouseEnter={() => setHoveredOption('rent')}
              onMouseLeave={() => setHoveredOption(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Key className="w-4 h-4" />
              <span className="text-xs font-medium">For Rent</span>
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
                {hoveredOption === 'sell' ? 'Browse Properties for Sale' : 'Browse Properties for Rent'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default SellRentToggle;
