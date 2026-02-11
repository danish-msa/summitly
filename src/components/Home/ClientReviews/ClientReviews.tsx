import SectionHeading from '@/components/Helper/SectionHeading'
import React from 'react'
import ReviewSlider from './ReviewSlider';

const ClientReviews = () => {
  return (
    <div className='pt-16 pb-16 relative overflow-hidden'>
        
        <div className='max-w-[1400px] mx-auto relative'>
            <SectionHeading 
                heading="What Our Clients Say" 
                subheading="Client Testimonials" 
                description="Discover why thousands of clients trust us with their real estate needs. Read their success stories and experiences." 
            />
            <div className='mt-4 md:mt-4 p-8'>
                <ReviewSlider />
            </div>
        </div>   
    </div>
  )
}

export default ClientReviews