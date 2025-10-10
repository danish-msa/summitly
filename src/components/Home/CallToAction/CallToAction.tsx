import React from 'react'
import Image from 'next/image'

const CallToAction = () => {
  return (
    <div className='w-[90%] mx-auto bg-secondary rounded-2xl p-8 relative my-10 md:my-20'>
        <h2 className='text-left text-lg md:text-3xl leading-loose md:w-[60%] text-white mb-4'>Looking to rent? Check out our Rentals and find your next home</h2>
        <button className='btn btn-primary bg-black text-lg hover:bg-primary'>Rent with Us!</button>
        <Image src='/images/rental_banner.svg' className='absolute bottom-2 right-10' alt='rent' width={100} height={100} />
    </div>
  )
}

export default CallToAction