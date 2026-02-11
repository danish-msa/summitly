import { useState } from "react";
import React from 'react'
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa'
import { HiAdjustmentsHorizontal } from 'react-icons/hi2'

const SearchBox = () => {
  const [selectedOption, setSelectedOption] = useState("");
  return (
    <div className='w-full md:w-[80%] bg-white flex py-2 px-4 sm:px-8 flex-col justify-center rounded-lg'>
      <div className='flex gap-3 items-center justify-between h-full flex-col lg:flex-row'>
        <div className="flex gap-3 lg:border-r lg:pr-4 ">
          <input
            type="radio"
            name="propertyType"
            value="Buy"
            checked={selectedOption === "Buy"}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          Buy
          <input
            type="radio"
            name="propertyType"
            value="Rent"
            checked={selectedOption === "Rent"}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          Rent
        </div>
      
           
      
        <div className='flex items-center space-x-6'>
          <div className="flex items-center">
            <FaMapMarkerAlt className='text-primary w-5 h-5' />
            <input type='text' placeholder='Search for a location' className='w-full bg-transparent block h-[60%] outline-none text-sm sm:text-base bg-gray-100 text-black rounnded-lg px-4 placeholder:text-sm'/>
          </div> 
          <div className='lg:flex hidden items-center cursor-pointer space-x-2'>
            <HiAdjustmentsHorizontal className='text-gray-700 w-6 h-6'/>
            <p className='text-gray-700 font-semibold'>Advanced</p>
          </div>    
          <div className='w-10 h-10 bg-primary flex items-center hover:bg-black transition-all duration-150 cursor-pointer justify-center text-white rounded-full'>
              <FaSearch />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchBox 