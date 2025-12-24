import React from 'react'
import ContactForm from './ContactForm'

const ConnectWithUs = () => {
  return (
    <div className='w-full py-8 sm:py-10 lg:pt-10 md:pt-[2vh] bg-[#040205] overflow-hidden bg-[url("/images/hero.jpg")] relative bg-fixed bg-cover bg-center'>
        {/* Overlay */}
        <div className='absolute inset-0 bg-black bg-opacity-70'></div>
        
        {/* Content */}
        <div className='flex flex-col gap-6 sm:gap-7 md:flex-row items-center justify-between text-white container-1400 mx-auto px-4 sm:px-6 lg:px-8 h-full relative py-6 sm:py-8'>
            <div className='w-full lg:w-[45%]'>
                <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-left font-bold mb-3 sm:mb-4 text-white'>Connect with Us Today</h2>
                <p className='text-sm sm:text-base md:text-lg text-white text-left mt-4 leading-relaxed'>Reach out to our team for any inquiries or assistance you may need. Whether you're looking for your dream home, need guidance on the buying process, or have any other questions, we're here to help. Let's make your real estate journey seamless and enjoyable.</p>
            </div>
            <div className='w-full lg:w-[45%]'>
                <ContactForm />
            </div>
        </div>   
    </div>
  )
}

export default ConnectWithUs