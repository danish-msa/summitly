import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import Image from 'next/image'

const FeaturedIn = () => {
  return (
    <div className='pt-16 pb-16 bg-white relative bg-cover bg-center'>
        <div className='w-[80%] mx-auto'>
            <SectionHeading heading='Featured In' subheading='' description='' />
            <div className='mt-10 md:mt-5'>
                <div className='flex flex-wrap md:flex-nowrap justify-center items-center gap-10 md:gap-4'>
                  <Image src='/images/press_1.webp' alt='Featured' width={200} height={200} className='w-[40%] md:w-[20%] h-10 md:h-14 object-contain md:p-4'/>
                  <Image src='/images/press_2.webp' alt='Featured' width={200} height={200} className='w-[40%] md:w-[20%] h-10 md:h-14 object-contain md:p-4'/>
                  <Image src='/images/press_3.webp' alt='Featured' width={200} height={200} className='w-[40%] md:w-[20%] h-10 md:h-14 object-contain md:p-4'/>
                  <Image src='/images/press_4.webp' alt='Featured' width={200} height={200} className='w-[40%] md:w-[20%] h-10 md:h-14 object-contain md:p-4'/>
                  <Image src='/images/press_5.webp' alt='Featured' width={200} height={200} className='w-[40%] md:w-[20%] h-10 md:h-14 object-contain md:p-4'/>
                  <Image src='/images/press_6.webp' alt='Featured' width={200} height={200} className='w-[40%] md:w-[20%] h-10 md:h-14 object-contain md:p-4'/>
                    
                </div>
            </div>
        </div>   
    </div>
  )
}

export default FeaturedIn