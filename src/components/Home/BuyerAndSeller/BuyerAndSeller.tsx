import React from 'react'
import { BiSearch } from 'react-icons/bi'
import { GiSellCard } from 'react-icons/gi'
import { HiHomeModern } from 'react-icons/hi2'

const BuyerAndSeller = () => {
  return (
    <div className='pt-16 pb-16 bg-[url("/images/pattern.png")] relative bg-cover bg-center'>
        <div className='w-[90%] mx-auto'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mt-10 gap-6 '>
                <div className='flex flex-col gap-3 border border-gray-200 p-6 bg-white rounded-2xl hover:shadow-md transition duration-300'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg'>I am a Buyer</h3>
                        <BiSearch className='h-10 w-10 text-primary p-2 rounded-lg shadow-md ' />
                    </div>
                    <p className='text-text'>Become a VIP member today to gain access to our most exclusive listings.</p>
                    <a href='/buy' className='btn btn-primary w-full rounded-lg hover:bg-black'>Sign up for VIP listings</a>
                </div>
                <div className='flex flex-col gap-3 border border-gray-200 p-6 bg-white rounded-2xl hover:shadow-md transition duration-300'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg'>I am a Seller</h3>
                        <GiSellCard className='h-10 w-10 text-primary p-2 rounded-lg shadow-md ' />
                    </div>
                    <p className='text-text'>How much is your home worth? Get your home evaluation now.</p>
                    <a href='/sell' className='btn btn-primary w-full rounded-lg hover:bg-black'>Get an instant home evaluation</a>
                </div>
                <div className='flex flex-col gap-3 border border-gray-200 p-6 bg-white rounded-2xl hover:shadow-md transition duration-300'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg'>I am a Seller and Buyer</h3>
                        <HiHomeModern className='h-10 w-10 text-primary p-2 rounded-lg shadow-md ' />
                    </div>
                    <p className='text-text'>Get a more accurate home evaluation by a Faris Team Realtor®</p>
                    <a className='btn btn-primary w-full rounded-lg hover:bg-black'>Book appointment now</a>
                </div>
            </div>
        </div>   
    </div>
  )
}

export default BuyerAndSeller