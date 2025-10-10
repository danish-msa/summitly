import React from 'react'
import BannerSearch from './BannerSearch'

const Hero = () => {
  return (
    <div className='w-full flex-col lg:flex-row flex justify-center items-center mb-80 md:mb-32 z-50 pt-28 md:pt-[10vw] pb-32 md:pb-[8vw] bg-[url("/images/banner.webp")] bg-cover bg-center relative mx-auto'>
        {/* Overlay */}
        <div className='absolute inset-0 bg-black bg-opacity-50'></div>

        <div className='flex flex-col items-center justify-center text-black w-[90%] sm:w-[55%] lg:w-[85%] relative'>
            <span className='capitalize text-white text-sm font-light bg-secondary rounded-full px-4 py-1 mb-4'>
                The Best Real Estate Service in Canada
            </span>
            <h1 className='capitalize leading-snug font-extrabold text-center text-white w-[75%]'>
                Find Your Dream House In Canada Now.
            </h1>
            <p className='text-sm sm:text-base md:text-lg mt-4 text-white'>
            Find homes in 80+ different countries represented byb 700 leading member brokerages.
            </p>
            <div className='mt-12 w-full md:w-[75%] absolute -bottom-[450px] md:-bottom-72 z-40'>
                {/* <SearchBox /> */}
                <BannerSearch />
            </div>
        </div>
    </div>
    
  )
}

export default Hero