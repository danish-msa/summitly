import React from 'react';
import 'rc-slider/assets/index.css';
import { BiCalculator } from 'react-icons/bi';
import LocationInput from './LocationInput';
import { Button } from '@/components/ui/button';

const RentForm = () => {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle search logic for Rent
  };

  const handleLocationSelect = (location: string) => {
    console.log('Selected location:', location);
  };

  return (
    <>
      <form onSubmit={handleSearch}>
        <div className='field-box'>
          <LocationInput onSelect={handleLocationSelect} placeholder="Where do you want to rent?" />
        </div>
      </form>
      <div className='flex flex-col md:flex-row gap-2 justify-between bg-gradient-to-r from-brand-celestial to-brand-slate text-white text-white p-6 rounded-2xl mt-4'>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2 items-center'>
            <BiCalculator className='h-7 w-7' /><span className='text-white text-base md:text-xl font-bold'>Find the rental cost of a property, instantly</span>
          </div>
          <p className='font-light text-sm'>Get a free online estimate of a property's rental income in minutes</p>
        </div>
        <button className='btn btn-primary bg-transparent rounded-full border-2 border-white text-white px-10 hover:bg-white hover:text-primary'>Start Rent Checker</button>
      </div>
    </>
  );
};

export default RentForm;