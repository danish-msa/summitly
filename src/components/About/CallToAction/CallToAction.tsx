import React from 'react'
import BlurImage from '../../Helper/BlurImage'
import { ButtonColorful } from '@/components/ui/button-colorful'

const CallToAction = () => {
  return (
    <div className='py-8 sm:py-10 bg-white relative bg-cover bg-center'>
      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-10'>
          <div className='flex flex-col md:flex-row gap-6 sm:gap-8 justify-center items-center rounded-2xl bg-gradient-to-r from-brand-glacier to-brand-icy-blue p-6 sm:p-8 md:p-10'>
              <div className='flex flex-col items-center md:items-start gap-3 sm:gap-4 w-full md:w-auto'>
                  <span className='inline-flex items-center gap-2 uppercase bg-brand-tide text-brand-midnight px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm md:text-base font-medium'>
                    <span className='w-2 h-2 bg-secondary rounded-full'></span>
                    Become Partners
                  </span>
                  <h2 className='text-black font-heading text-xl sm:text-2xl md:text-3xl text-center md:text-left'>List your Properties on Summitly, join Us Now!</h2>
                  <ButtonColorful label='Join Us!' href='/contact' variant='gradient' />
              </div>
              <div className='mt-0 sm:mt-5 w-full md:w-auto flex justify-center'>
                  <BlurImage className='mt-0 sm:mt-[-45] max-w-full h-auto' src='/images/cta-banner.png' width={750} height={750} alt='Call to Action' />
              </div>
          </div>
      </div>
    </div>
  )
}

export default CallToAction