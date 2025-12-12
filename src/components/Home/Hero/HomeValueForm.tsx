import React from 'react';
import { BiCalculator } from 'react-icons/bi';
import 'rc-slider/assets/index.css';
import LocationInput from './LocationInput';

const HomeValueForm = () => {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle search logic for Home Value
  };

  const handleLocationSelect = (location: string) => {
    console.log('Selected location:', location);
  };

  return (
    <>
      <form onSubmit={handleSearch}>
        <div className='field-box'>
          <LocationInput onSelect={handleLocationSelect} placeholder="Enter your property address for valuation" />
        </div>
      </form>
      <div className='flex flex-col md:flex-row gap-2 justify-between bg-gradient-brand text-white text-white p-6 rounded-2xl mt-4'>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2 items-center'>
            <BiCalculator className='h-7 w-7' /><span className='text-white text-base md:text-xl font-bold'>Get your home's instant value</span>
          </div>
          <p className='font-light text-sm'>Discover your property's current market value with our advanced valuation tool</p>
        </div>
        <button className='btn btn-primary bg-transparent rounded-full border-2 border-white text-white px-10 hover:bg-white hover:text-primary'>Get Home Value</button>
      </div>
    </>
  );
};

export default HomeValueForm;
