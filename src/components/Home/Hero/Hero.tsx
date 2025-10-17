import React from 'react'
import BannerSearch from './BannerSearch'

const Hero = () => {
  return (
    <div className='w-full flex-col lg:flex-row flex justify-center items-center mb-10 h-[800px] z-50 relative mx-auto bg-[url("/images/HomeBackground.png")]'>
        {/* Overlay */}
        {/* <div className='absolute inset-0 bg-black bg-opacity-50'></div> */}

        <div className='w-[1300px] mx-auto flex flex-col items-center justify-center text-black relative'>
            <span className='inline-flex mb-4 items-center gap-2 uppercase bg-brand-smoky-gray/10 backdrop-blur-sm text-secondary px-4 py-1 rounded-full text-base font-medium'>
                <span className='w-2 h-2 bg-secondary rounded-full'></span>
                The Best Real Estate Service in Canada
            </span>
            <h1 className='font-bauziet capitalize text-7xl leading-tight font-extrabold text-center text-black'>
                Canada’s #1 place to <br /> <span className='text-brand-celestial'>buy, sell, and rent</span>
            </h1>
            <p className='text-sm sm:text-base md:text-lg mt-4 text-black/90'>
            Find homes you’ll love with fast search, real photos, and trusted data.
            </p>
            <div className='mt-12 w-full md:w-[65%] z-40 -mb-28'>
                {/* <SearchBox /> */}
                <BannerSearch />
            </div>
        </div>
    </div>
    
  )
}

export default Hero