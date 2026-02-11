import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import { FaHouse } from 'react-icons/fa6'
import { FaMedal } from 'react-icons/fa'
import { RiVipCrownFill } from 'react-icons/ri'



const WhatWeDo = () => {
  return (
    <div className='pt-16 pb-16 bg-background'>
        <div className='w-[80%] mx-auto'>
            <SectionHeading heading='What We Do' subheading='Our Services' description='' />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mt-10 md:mt-20 gap-8 items-center'>
                <div className='bg-white overflow-hidden group rounded-2xl border-[#e4e4e4] hover:shadow-lg flex flex-col items-center justify-center gap-4 transition-all duration-300 p-8 '>
                    <FaHouse className='w-[20%] h-[20%] text-secondary'/>   
                    <h3 className='text-2xl mt-4 text-center text-black group-hover:text-primary'>Exclusive units</h3>
                    <p className='text-sm text-black font-light text-center'>Get the hottest properties throughout the GTA! Our team of experts is ready to help you find the house of your dreams!</p>
                </div>
                <div className='bg-white overflow-hidden group rounded-2xl border-[#e4e4e4] hover:shadow-lg flex flex-col items-center justify-center gap-4 transition-all duration-300 p-8 '>
                    <FaMedal className='w-[20%] h-[20%] text-secondary'/>   
                    <h3 className='text-2xl mt-4 text-center text-black group-hover:text-primary'>Hot Investment Opportunities</h3>
                    <p className='text-sm text-black font-light text-center'>Access to Toronto’s latest new construction projects, with exclusive buying information to make well-informed investments.</p>
                </div>
                <div className='bg-white overflow-hidden group rounded-2xl border-[#e4e4e4] hover:shadow-lg flex flex-col items-center justify-center gap-4 transition-all duration-300 p-8 '>
                    <RiVipCrownFill className='w-[20%] h-[20%] text-secondary'/>   
                    <h3 className='text-2xl mt-4 text-center text-black group-hover:text-primary'>VIP Access</h3>
                    <p className='text-sm text-black font-light text-center'>VIP Access with priority allocation so that you’re first in line for the best buying opportunities across the city.</p>
                </div>
            </div>
        </div>   
    </div>
  )
}

export default WhatWeDo