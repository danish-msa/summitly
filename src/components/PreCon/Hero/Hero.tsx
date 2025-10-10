import React from 'react'

const Hero = () => {
  return (
    <div className='w-full flex-col lg:flex-row flex justify-center items-center pt-28 md:pt-[10vw] pb-[4vw] bg-[url("/images/banner2.webp")] bg-cover bg-center overflow-hidden relative mx-auto'>
        {/* Overlay */}
        <div className='absolute inset-0 bg-black bg-opacity-50'></div>
        
        <div className='flex flex-col items-center justify-center text-white w-[90%] sm:w-[55%] lg:w-[75%] relative'>
            <h1 className='capitalize text-2xl md:text-4xl leading-snug font-normal text-center w-full md:w-[75%]'>
            Get priority access to the latest new construction projects & save thousands
            </h1>
            <p className='text-sm sm:text-base md:text-lg mt-4'>
            Find homes in 80+ different countries represented byb 700 leading member brokerages.
            </p>
        </div>
    </div>
  )
}

export default Hero