"use client";
import React from 'react';
import GoogleMapsWrapper from '@/components/Helper/GoogleMapsWrapper';
import LocationInput from '@/components/Home/Hero/LocationInput';

const Hero = () => {
  const handleLocationSelect = (location: string) => {
    console.log('Selected location:', location);
  };

  return (
    <div className='w-full flex-col lg:flex-row flex justify-center items-center pt-28 md:pt-[10vw] pb-[4vw] bg-[url("/images/banner2.webp")] bg-cover bg-center relative mx-auto'>
        {/* Overlay */}
        <div className='absolute inset-0 bg-black bg-opacity-50'></div>
        
        <div className='flex flex-col items-center justify-center text-white w-[90%] sm:w-[55%] lg:w-[75%] relative'>
            <h1 className='capitalize text-2xl md:text-4xl leading-snug font-normal text-center w-full md:w-[75%]'>
            Buy with us
            </h1>
            <h2 className='text-sm sm:text-base md:text-lg mt-4 font-normal my-4'>Find out how much your home is worth in today's market!</h2>
            <p className='leading-relaxed text-center'>With more than 500 real estate transactions and thousands of offers submitted, Justo's agents know your local market. We'll arrange for an experienced Realtor to come to your home and provide you with insight into the value of your home and the recommended listing price to get the most from your home sale. It's free and there is no obligation!</p>
            <form className='mt-8 flex gap-4 w-[85%]'>
              <GoogleMapsWrapper>
                <LocationInput onSelect={handleLocationSelect} placeholder="Enter your home address" />
              </GoogleMapsWrapper>
              <button className='btn btn-primary'>Start Home Estimation</button>
            </form>
        </div>
    </div>
  )
}

export default Hero;