import React from 'react'
import ContactForm from './ContactForm'

const ConnectWithUs = () => {
  return (
    <div className='w-full py-10 lg:pt-10 md:pt-[2vh] bg-[#040205] overflow-hidden bg-[url("/images/hero.jpg")] relative bg-fixed bg-cover bg-center'>
        {/* Overlay */}
        <div className='absolute inset-0 bg-black bg-opacity-70'></div>
        
        {/* Content */}
        <div className='flex flex-col gap-7 md:flex-row items-center justify-between text-white w-[95%] sm:w-[80%] h-full mx-auto relative'>
            <div className='w-[90%] lg:w-[45%]'>
                <h2 className='text-3xl lg:text-5xl text-left font-bold mb-2 text-white'>Connect with Us Today</h2>
                <p className='text-sm lg:text-lg text-white text-left mt-4'>Reach out to our team for any inquiries or assistance you may need. Whether you’re looking for your dream home, need guidance on the buying process, or have any other questions, we’re here to help. Let’s make your real estate journey seamless and enjoyable.</p>
            </div>
            <div className='w-[90%] lg:w-[45%] flex-2'>
                <ContactForm />
            </div>
        </div>   
    </div>
  )
}

export default ConnectWithUs