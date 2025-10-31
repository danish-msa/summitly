import React from 'react'
import BannerSearch from './BannerSearch'

const Hero = () => {
  return (
    <div className='w-full flex-col lg:flex-row flex justify-center items-center min-h-[600px] sm:min-h-[700px] lg:h-[800px] z-50 relative mx-auto bg-[url("/images/HeroBackImage.jpg")] bg-cover bg-center bg-no-repeat'>
        {/* Overlay */}
        <div className='absolute inset-0 bg-white bg-opacity-50'></div>

        <div className='w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-black relative py-8 sm:py-12 lg:py-0'>
            <span className='inline-flex mb-4 items-center gap-2 bg-brand-smoky-gray/10 backdrop-blur-sm text-secondary px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm md:text-base font-medium'>
                <span className='w-2 h-2 bg-secondary rounded-full'></span>
                The Best Real Estate Service in Canada
            </span>
            <h1 className='font-outfit capitalize text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight text-center text-black px-2' style={{ fontWeight: 700 }}>
                Canada's #1 place to <br /> <span className='text-brand-celestial'>buy, sell, and rent</span>
            </h1>
            <p className='text-sm sm:text-base md:text-lg mt-4 text-black/90 text-center px-4 max-w-2xl'>
            Find homes you'll love with fast search, real photos, and trusted data.
            </p>
            <p>Search <span className='text-brand-celestial text-lg sm:text-xl md:text-2xl font-bold'>336,092</span> listings from trusted REALTORS®</p>
            <div className='mt-8 sm:mt-8 w-full max-w-4xl z-40 -mb-16 sm:-mb-20 lg:-mb-28 px-4'>
                {/* <SearchBox /> */}
                <BannerSearch />
            </div>
        </div>
    </div>
    
  )
}

export default Hero