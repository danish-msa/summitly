"use client";
import { useState } from "react";
import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'

const SavingsCalculation = () => {
  const [homePrice, setHomePrice] = useState(300000); // Default value: 300K

  // Cashback formula: 1.3% of home price
  const cashback = homePrice * 0.013;
  return (
    <div className='pt-16 pb-16 bg-background relative bg-cover bg-center'>
        <div className='w-[90%] md:w-[60%] mx-auto'>
            <SectionHeading heading='On average we save our sellers $11,250!' subheading='' description='When you sell a home with us in the Greater Toronto Area (GTA), Kitchener, Waterloo and Cambridge Region (KWC), Guelph and Hamilton – we save you 50% on listing fees!' />
              <div className='mt-10 bg-white p-10 rounded-2xl shadow-lg'>
                <div className='flex flex-wrap md:flex-nowrap justify-center items-center gap-10 md:gap-4'>
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 text-center">Home Price</label>
                      <div className="flex items-center border hover:border-secondary border-gray-300 rounded-lg p-3 mt-2 bg-white transition-all delay-75">
                        <span className="text-gray-500 text-lg">$</span>
                        <input
                          type="number"
                          min={300000}
                          max={3000000}
                          step={1000}
                          value={homePrice}
                          onChange={(e) => setHomePrice(Number(e.target.value))}
                          className="w-full text-gray-800 text-2xl bg-white text-center border-0 font-semibold outline-none px-2 peer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 text-center">Cashback / Savings</label>
                      <div className="bg-green-100 text-green-700 text-2xl font-bold rounded-lg p-3 mt-2 text-center">
                        ${cashback.toLocaleString("en-US")}
                      </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-10">
                    <span className="text-black font-light text-xl">$300K</span>
                    <input type="range" min={300000} max={3000000} step={1000} value={homePrice} onChange={(e) => setHomePrice(Number(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <span className="text-black font-light text-xl">$3M</span>
                </div>
                <span className="block text-lg font-semibold text-gray-700 text-center mt-10">Buyers Agent Commission: 2.5%</span>
              </div>
        </div>   
      
    </div>
    
  )
}

export default SavingsCalculation