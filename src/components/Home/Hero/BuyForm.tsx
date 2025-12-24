import React from 'react';
import { BiCalculator } from 'react-icons/bi';
import 'rc-slider/assets/index.css';
import LocationInput from './LocationInput';

const BuyForm = () => {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle search logic for Buy
  };

  const handleLocationSelect = (location: string) => {
    console.log('Selected location:', location);
  };

  return (
    <>
      <form onSubmit={handleSearch}>
        <div className='field-box'>
          <LocationInput onSelect={handleLocationSelect} placeholder="Where do you want to buy?" />
        </div>
      </form>
      <div className='flex flex-col md:flex-row gap-2 justify-between bg-gradient-brand text-white p-4 sm:p-6 rounded-2xl mt-2'>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2 items-center'>
            <div className='w-[5%]'>
              <BiCalculator className='h-5 w-5' />
            </div>
            <p className='w-[95%] text-white text-sm md:text-xl font-bold'>Find out your home's value, instantly</p>
          </div>
          <p className='font-light text-xs sm:text-sm'>Get a free online estimate of your home's current value in minutes</p>
        </div>
        <button className='btn btn-primary text-xs sm:text-sm md:text-base bg-transparent rounded-full border-2 border-white text-white px-4 py-2 sm:px-10 sm:py-3 hover:bg-white hover:text-primary'>Start Instant Valuation</button>
      </div>
    </>
  );
};

export default BuyForm;