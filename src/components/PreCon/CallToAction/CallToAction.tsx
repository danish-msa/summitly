import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const PreConCallToAction = () => {
  return (
    <div className='w-full mx-auto relative bg-cover bg-center'>
      <div 
        className='p-8 py-10 relative'
        style={{ background: 'linear-gradient(135deg, #06B6D4 25%, #3B82F6 60.36%, #2563EB 95.71%)' }}
      >
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full sm:w-[60%]'>
            <Image src='/images/key.svg' className='w-10 sm:w-14 h-auto invert' alt='pre-construction' width={50} height={50} />
            <h2 className='text-left font-body text-lg md:text-2xl leading-loose md:w-[60%] text-white'>Interested in pre-construction? Explore our projects and secure your future home</h2>
          </div>
          <div className='flex items-center justify-end gap-4 w-full sm:w-[40%]'>
            <Link href="">
              <button className='btn btn-primary bg-transparent rounded-full border-2 border-white text-white px-10 py-4 hover:bg-white hover:text-primary'>Schedule Consultation!</button>
            </Link>
            <Link href="/pre-con/projects">
              <button className='btn btn-primary bg-secondary rounded-full border-2 border-secondary text-white px-10 py-4 hover:bg-white hover:text-primary'>View Projects!</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreConCallToAction

