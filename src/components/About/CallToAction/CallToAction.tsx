import React from 'react'
import { FaArrowRightLong } from 'react-icons/fa6'
import BlurImage from '../../Helper/BlurImage'

const CallToAction = () => {
  return (
    <div className='w-[85%] mx-auto my-20'>
        <div className='flex flex-col md:flex-row gap-8 justify-center items-center bg-[#F3F7FD] rounded-2xl'>
            <div className='flex flex-col gap-3 p-10'>
                <span className='text-primary'>Become Partners</span>
                <h2 className='text-black font-normal text-2xl md:text-4xl'>List your Properties on RealEstate, join Us Now!</h2>
                <button className='btn btn-primary w-[70%] rounded-full text-center mt-3'>Join Us!<FaArrowRightLong /> </button>
            </div>
            <div className='mt-4'>
                <BlurImage className='mt-[-60]' src='/images/cta-banner.png' width={1000} height={1000} alt='Call to Action' />
            </div>
        </div>
    </div>
  )
}

export default CallToAction