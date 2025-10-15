import React, { useState } from 'react';
import { BiCalculator, BiSearch } from 'react-icons/bi';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import 'rc-slider/assets/index.css';
import LocationInput from './LocationInput';

const SellForm = () => {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Simulate search API call
    setTimeout(() => {
      setIsSearching(false);
      // Handle search logic for Sell
      console.log('Sell search completed');
    }, 2000);
  };

  const handleLocationSelect = (location: string) => {
    console.log('Selected location:', location);
  };

  const handleValuation = () => {
    // Handle instant valuation
    console.log('Starting instant valuation');
  };

  return (
    <>
      <motion.form 
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex gap-3"
      >
        <div className='field-box flex-1'>
          <LocationInput onSelect={handleLocationSelect} placeholder="Where do you want to sell?" />
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-shrink-0"
        >
          <Button 
            type="submit" 
            disabled={isSearching}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Searching...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <BiSearch className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </div>
            )}
          </Button>
        </motion.div>
      </motion.form>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='flex flex-col md:flex-row gap-4 justify-between bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-2xl mt-6 shadow-lg'
      >
        <div className='flex flex-col gap-3'>
          <div className='flex gap-3 items-center'>
            <div className="p-2 bg-white/20 rounded-lg">
              <BiCalculator className='h-6 w-6' />
            </div>
            <span className='text-white text-lg md:text-xl font-bold'>Find out your home's value, instantly</span>
          </div>
          <p className='font-light text-sm text-white/90'>Get a free online estimate of your home's current value in minutes</p>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={handleValuation}
            variant="outline"
            className='bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-medium px-8 py-3 rounded-full transition-all duration-200 hover:shadow-lg'
          >
            Start Instant Valuation
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SellForm;