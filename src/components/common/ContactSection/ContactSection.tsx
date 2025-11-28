"use client";

import React from 'react';
import ContactForm from './ContactForm';

interface ContactSectionProps {
  title?: string;
  description?: string;
  className?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = "Connect with Us Today",
  description = "Reach out to our team for any inquiries or assistance you may need. Whether you're looking for your dream home, need guidance on the buying process, or have any other questions, we're here to help. Let's make your real estate journey seamless and enjoyable.",
  className = "",
}) => {
  return (
    <div 
      className={`w-full py-10 lg:pt-10 md:pt-[2vh] bg-[#040205] overflow-hidden relative bg-fixed bg-cover bg-center ${className}`}
      style={{ backgroundImage: 'url("/images/hero.jpg")' }}
    >
      {/* Overlay */}
      <div className='absolute inset-0 bg-black bg-opacity-70'></div>
      
      {/* Content */}
      <div className='flex flex-col gap-7 md:flex-row items-center justify-between text-white max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 h-full relative'>
        <div className='w-[90%] lg:w-[45%]'>
          <h2 className='text-3xl lg:text-5xl text-left font-bold mb-2 text-white'>{title}</h2>
          <p className='text-sm lg:text-lg text-white text-left mt-4'>{description}</p>
        </div>
        <div className='w-[90%] lg:w-[45%] flex-2'>
          <ContactForm />
        </div>
      </div>   
    </div>
  );
};

export default ContactSection;

