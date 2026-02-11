import SectionHeading from '@/components/Helper/SectionHeading'
import React from 'react'
import ReviewSlider from './ReviewSlider';

const ClientReviews = () => {
  return (
    <div className='pt-16 pb-16 bg-[url("/images/pattern.png")] relative bg-cover bg-center'>
        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8'>
            <SectionHeading heading='What’s people say’s' subheading='Our Testimonials' description='Our seasoned team excels in real estate with years of successful market navigation, offering informed decisions and optimal results.' />
            <div className='mt-10 md:mt-20'>
                <ReviewSlider />
            </div>
        </div>   
    </div>
  )
}

export default ClientReviews