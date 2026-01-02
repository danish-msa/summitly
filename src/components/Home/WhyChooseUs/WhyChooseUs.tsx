import React from 'react'
import Image from 'next/image'

const WhyChooseUs = () => {
  return (
    <div className='flex flex-col md:flex-row max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 bg-background justify-center items-center rounded-lg relative py-8 md:py-0 md:h-[800px] lg:h-[700px]'>
        <div className='w-full md:w-1/2 relative h-64 sm:h-80 md:h-[80%] mb-6 md:mb-0'>
            <Image 
                src='/images/hero.jpg' 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                alt='hero' 
                className='rounded-xl object-cover'
            />
        </div>
        <div className='w-full md:w-1/2 py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12'>
            <div className='w-full'>
                <span className='text-sm sm:text-base md:text-lg block mb-2 font-semibold text-primary'>Our Benefit</span>
                <h2 className='text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-gray-800'>Why Choose Us</h2>
                <p className='text-xs sm:text-sm text-gray-700 mt-4'>Our seasoned team excels in real estate with years of successful market navigation, offering informed decisions and optimal results.</p>
                <div className='mt-4 sm:mt-5 rounded-xl p-4 sm:p-5 px-4 sm:px-6 md:px-8 bg-white'>
                    <h3 className='text-black text-base sm:text-lg md:text-xl lg:text-2xl mb-2'>Proven Expertise</h3>
                    <p className='font-light text-black text-xs sm:text-sm'>Our seasoned team excels in real estate with years of successful market navigation, offering informed decisions and optimal results.</p>
                </div>
                <div className='mt-4 sm:mt-5 rounded-xl p-4 sm:p-5 px-4 sm:px-6 md:px-8 bg-white'>
                    <h3 className='text-black text-base sm:text-lg md:text-xl lg:text-2xl mb-2'>Customized Solutions</h3>
                    <p className='font-light text-black text-xs sm:text-sm'>We pride ourselves on crafting personalized strategies to match your unique goals, ensuring a seamless real estate journey.</p>
                </div>
                <div className='mt-4 sm:mt-5 rounded-xl p-4 sm:p-5 px-4 sm:px-6 md:px-8 bg-white'>
                    <h3 className='text-black text-base sm:text-lg md:text-xl lg:text-2xl mb-2'>Transparent Partnerships</h3>
                    <p className='font-light text-black text-xs sm:text-sm'>Transparency is key in our client relationships. We prioritize clear communication and ethical practices, fostering trust and reliability throughout.</p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default WhyChooseUs