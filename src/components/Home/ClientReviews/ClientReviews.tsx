import SectionHeading from '@/components/Helper/SectionHeading'
import React from 'react'
import ReviewSlider from './ReviewSlider';

const ClientReviews = () => {
  return (
    <div className='pt-16 pb-16 bg-gradient-to-br from-icy-blue to-glacier relative overflow-hidden'>
        {/* Background Pattern Overlay */}
        <div className='absolute inset-0 bg-[url("/images/pattern.png")] opacity-5 bg-cover bg-center'></div>
        
        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
            <SectionHeading 
                heading="What Our Clients Say" 
                subheading="Client Testimonials" 
                description="Discover why thousands of clients trust us with their real estate needs. Read their success stories and experiences." 
            />
            <div className='mt-12 md:mt-16'>
                <ReviewSlider />
            </div>
        </div>   
    </div>
  )
}

export default ClientReviews