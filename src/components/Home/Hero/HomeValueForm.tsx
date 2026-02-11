import React from 'react';
import { BiCalculator } from 'react-icons/bi';
import 'rc-slider/assets/index.css';
import { AutocompleteSearch } from '@/components/common/AutocompleteSearch';

const HomeValueForm = () => {
  return (
    <>
      <div className="field-box">
        <AutocompleteSearch placeholder="Enter your property address for valuation" />
      </div>
      <div className='flex flex-col md:flex-row gap-2 justify-between bg-gradient-brand text-white text-white p-4 sm:p-6 rounded-2xl mt-2'>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2 items-center'>
            <div className='w-[5%]'>
              <BiCalculator className='h-5 w-5' />
            </div>
            <p className='w-[95%] text-white text-sm sm:text-sm md:text-xl font-bold'>Get your home's instant value</p>
          </div>
          <p className='font-light text-xs sm:text-sm'>Discover your property's current market value with our advanced valuation tool</p>
        </div>
        <button className='btn btn-primary text-xs sm:text-sm md:text-base bg-transparent rounded-full border-2 border-white text-white px-4 py-2 sm:px-10 sm:py-3 hover:bg-white hover:text-primary'>Get Home Value</button>
      </div>
    </>
  );
};

export default HomeValueForm;
