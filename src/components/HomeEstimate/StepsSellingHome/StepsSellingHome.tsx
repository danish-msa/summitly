import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import Image from 'next/image'

const StepsSellingHome = () => {
  return (
    <div className='pt-16 pb-16 bg-background'>
        <div className='w-[80%] mx-auto'>
            <SectionHeading heading='Next steps in selling your home with Us' subheading='' description='' />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mt-10 md:mt-20 gap-8'>
                <div className='bg-white overflow-hidden group rounded-2xl border-[#e4e4e4] hover:shadow-lg flex flex-col gap-4 transition-all duration-300 '>
                    <Image src='/images/step1.png' width={800} height={800} alt='step 1'/>   
                    <div className='px-4 pb-8'>
                        <h3 className='text-lg my-2 text-center text-black group-hover:text-primary'>Pairing you with an agent</h3>
                        <p className='text-sm text-black font-light text-center'>One of our expert agents will be with you every step of the way in your home selling journey.</p>
                    </div>
                </div>
                <div className='bg-white overflow-hidden group rounded-2xl border-[#e4e4e4] hover:shadow-lg flex flex-col gap-4 transition-all duration-300'>
                    <Image src='/images/step2.png' width={800} height={800} alt='step 2'/>   
                    <div className='px-4 pb-8'>
                        <h3 className='text-lg my-2 text-center text-black group-hover:text-primary'>Preparing your property</h3>
                        <p className='text-sm text-black font-light text-center'>Your Justo agent will guide you through preparing your property for sale, including staging, photography, floor plans and 3D virtual tours to showcase it online!</p>
                    </div>
                </div>
                <div className='bg-white overflow-hidden group rounded-2xl border-[#e4e4e4] hover:shadow-lg flex flex-col gap-4 transition-all duration-300'>
                    <Image src='/images/step3.png' width={800} height={800} alt='step 3'/>   
                    <div className='px-4 pb-8'>
                        <h3 className='text-lg my-2 text-center text-black group-hover:text-primary'>Reviewing offers</h3>
                        <p className='text-sm text-black font-light text-center'>When the time comes, your agent will review the details of all offers with you, including the closing date, price, financing and other conditions.</p>
                    </div>
                </div>
            </div>
        </div>   
    </div>
  )
}

export default StepsSellingHome