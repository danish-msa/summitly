import React from 'react'
import Image from 'next/image'

const CallToAction = () => {
  return (
    <div className='pt-2 pb-6 sm:pb-8 md:pb-10 bg-white relative bg-cover bg-center'>
      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-secondary to-primary rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 relative my-4 sm:my-6 md:my-10'>
        <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 items-center'>
          <div className='flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 w-[20%] sm:w-[10%]'>
            <Image 
              src='/images/rental_banner.svg' 
              className='invert w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16' 
              alt='rent' 
              width={40} 
              height={40} 
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <div className='flex flex-col sm:flex-row items-center justify-center sm:justify-end w-full gap-4 sm:w-[90%] mt-2 sm:mt-0'>
            <h2 className='text-center sm:text-left font-body text-base sm:text-base md:text-lg lg:text-2xl xl:text-3xl leading-snug sm:leading-relaxed md:leading-loose text-white'>Looking to rent? Check out our Rentals and find your next home</h2>
            <button className='btn btn-primary bg-transparent rounded-full border-2 border-white text-white px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-3 md:py-4 hover:bg-white hover:text-primary text-xs sm:text-sm md:text-base whitespace-nowrap w-full sm:w-auto'>Rent with Us!</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallToAction