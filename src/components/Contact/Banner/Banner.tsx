import React from 'react'

const Banner = () => {
  return (
    <div className='bg-white text-center relative py-32 w-[90%] mx-auto my-28 p-20 rounded-2xl  bg-[url(/images/hero.jpg)] bg-cover bg-center bg-no-repeat'>
     {/* Overlay */}
     <div className='absolute inset-0 bg-black bg-opacity-50 rounded-2xl'></div>
     <div className='flex flex-col gap-2 items-center justify-between text-white mx-auto relative'>
        <span className='text-white'>Home / Contact</span>
        <h1 className='text-white font-semibold'>Contact Us</h1>
     </div>
      
    </div>
  )
}

export default Banner