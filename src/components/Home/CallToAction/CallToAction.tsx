import React from 'react'
import Image from 'next/image'

const CallToAction = () => {
  return (
    <div className='pt-2 pb-10 bg-white relative bg-cover bg-center'>
      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-secondary to-primary rounded-2xl p-8 relative my-10'>
        <div className='flex flex-row gap-4'>
          <div className='flex items-center gap-4 w-[80%]'>
            <Image src='/images/rental_banner.svg' className='invert' alt='rent' width={100} height={100} />
            <h2 className='text-left font-body text-lg md:text-3xl leading-loose md:w-[60%] text-white mb-4'>Looking to rent? Check out our Rentals and find your next home</h2>
          </div>
          <div className='flex items-center gap-4 w-[20%]'>
            <button className='btn btn-primary bg-transparent rounded-full border-2 border-white text-white px-10 py-4 hover:bg-white hover:text-primary'>Rent with Us!</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallToAction