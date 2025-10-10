import React from 'react'
import { FaArrowRightLong } from 'react-icons/fa6'
import BlurImage from '../../Helper/BlurImage'

const Banner = () => {
  return (
    <div className='bg-white text-center py-40'>
        <div className='w-[60%] mx-auto flex flex-col gap-8 justify-center items-center'>
            <h1 className='text-black font-semibold'>Welcome to the Real Estate</h1>
            <p className='text-slate-500 font-light text-2xl'>Welcome to Real Estate, where we turn houses into homes and dreams into reality. At Home, we understand that a home is more than just a physical space, it is a place where memories are created, families grow, and life unfolds.</p>
            <div className='flex flex-col mt-8'>
                <span className='text-base font-normal'>Leslie Alexander</span>
                <span className='text-sm font-light text-slate-500'>CEO, Real Estate</span>
            </div>
            <BlurImage src='/images/signature.png' width={200} height={200} alt='Leslie Alexander' />
            <button className='btn btn-primary w-[40%] rounded-full text-center mt-20'>Contact us <FaArrowRightLong /> </button>
        </div>
    </div>
  )
}

export default Banner