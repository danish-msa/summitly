import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const PreConCallToAction = () => {
  return (
    <div className='container-1400 mx-auto px-4 sm:px-6 lg:px-8 relative bg-cover bg-center'>
      <div className='bg-gradient-to-r from-secondary to-primary rounded-2xl p-8 relative'>
        <div className='flex flex-row gap-4'>
          <div className='flex items-center gap-8 w-[80%]'>
            <Image src='/images/key.svg' className='invert' alt='pre-construction' width={50} height={50} />
            <h2 className='text-left font-body text-lg md:text-2xl leading-loose md:w-[60%] text-white'>Interested in pre-construction? Explore our projects and secure your future home</h2>
          </div>
          <div className='flex items-center gap-4 w-[20%]'>
            <Link href="/pre-construction/projects">
              <button className='btn btn-primary bg-transparent rounded-full border-2 border-white text-white px-10 py-4 hover:bg-white hover:text-primary'>View Projects!</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreConCallToAction

