"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  const handleUserTypeSelect = (type: 'buyer' | 'seller' | 'both') => {
    router.push(`/find-an-agent?userFlow=${type}`);
  };

  return (
    <div className='w-full flex-col lg:flex-row flex justify-center items-center pt-28 md:pt-[10vw] pb-[4vw] bg-[url("/images/banner2.webp")] bg-cover bg-center relative mx-auto'>
        {/* Overlay */}
        <div className='absolute inset-0 bg-black bg-opacity-50'></div>
        
        <div className='flex flex-col items-center justify-center text-white w-[90%] sm:w-[55%] lg:w-[75%] relative'>
            <h1 className='capitalize text-2xl md:text-4xl leading-snug font-normal text-center w-full md:w-[75%]'>
            Find the Right REALTOR® for you
            </h1>
            <h2 className='text-sm sm:text-base md:text-lg mt-4 font-normal my-4'>Find out how much your home is worth in today's market!</h2>
            <p className='leading-relaxed text-center'>With more than 500 real estate transactions and thousands of offers submitted, Justo's agents know your local market. We'll arrange for an experienced Realtor to come to your home and provide you with insight into the value of your home and the recommended listing price to get the most from your home sale. It's free and there is no obligation!</p>
            
            <div className='mt-8 w-full'>
              <div className='flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8'>
                <p className='text-center text-xl'>I am...</p>
                <button
                  onClick={() => handleUserTypeSelect('buyer')}
                  className='bg-primary w-full sm:w-auto text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:bg-opacity-90 transition-all'
                >
                  A BUYER
                </button>
                <button
                  onClick={() => handleUserTypeSelect('seller')}
                  className='bg-secondary w-full sm:w-auto text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:bg-opacity-90 transition-all'
                >
                  A SELLER
                </button>
                <button
                  onClick={() => handleUserTypeSelect('both')}
                  className='bg-white w-full sm:w-auto text-gray-800 py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:bg-opacity-90 transition-all'
                >
                  BOTH
                </button>
              </div>
            </div>
        </div>
    </div>
  )
}

export default Hero