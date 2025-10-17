import React from 'react'
import BlurImage from '../../Helper/BlurImage'
import { ButtonColorful } from '@/components/ui/button-colorful'

const CallToAction = () => {
  return (
    <div className='py-16 bg-white relative bg-cover bg-center'>
      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 my-20'>
          <div className='flex flex-col md:flex-row gap-8 justify-center items-center rounded-2xl bg-gradient-to-r from-brand-glacier to-brand-icy-blue'>
              <div className='flex flex-col items-start gap-3 p-10'>
                  <span className='inline-flex items-center gap-2 uppercase bg-brand-tide text-brand-midnight px-4 py-1 rounded-full text-base font-medium'>
                    <span className='w-2 h-2 bg-secondary rounded-full'></span>
                    Become Partners
                  </span>
                  <h2 className='text-black font-heading text-2xl md:text-4xl'>List your Properties on Summitly, join Us Now!</h2>
                  <ButtonColorful label='Join Us!' href='/contact' />
              </div>
              <div className='mt-4'>
                  <BlurImage className='mt-[-45]' src='/images/cta-banner.png' width={1000} height={1000} alt='Call to Action' />
              </div>
          </div>
      </div>
    </div>
  )
}

export default CallToAction