import React from 'react'
import Image from 'next/image'
import ContactForm from './ContactForm'
import { Mail, Phone } from 'lucide-react'

const ConnectWithUs = () => {
  return (
    <div className='w-full py-16 sm:py-20 lg:py-24 relative overflow-hidden'>
      {/* Blurred Background Image */}
      <div className='absolute inset-0 z-0'>
        <Image
          src="/images/pre-con/contact.jpg"
          alt="Background"
          fill
          className="object-cover"
          style={{ filter: 'blur(4px)' }}
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Container */}
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row'>
          {/* Left Panel - Blue Gradient */}
          <div 
            className='w-full lg:w-1/2 p-8 sm:p-10 lg:p-12 text-white relative'
            style={{ 
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #2563EB 100%)' 
            }}
          >
            <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-white'>
              Connect with Us Today
            </h2>
            <p className='text-base sm:text-lg text-white/90 leading-relaxed mb-8'>
              Reach out to our team for any inquiries or assistance you may need. Whether you're looking for your dream home, need guidance on the buying process, or have any other questions, we're here to help. Let's make your real estate journey seamless and enjoyable.
            </p>
            
            {/* Contact Information */}
            <div className='mt-auto space-y-3'>
              <div className='flex items-center gap-3'>
                <Mail className='w-5 h-5 text-white' />
                <a href="mailto:info@summitly.com" className='text-white hover:text-white/80 transition-colors'>
                  info@summitly.com
                </a>
              </div>
              <div className='flex items-center gap-3'>
                <Phone className='w-5 h-5 text-white' />
                <a href="tel:+15551234567" className='text-white hover:text-white/80 transition-colors'>
                  +1 (555) 123-4567
                </a>
              </div>
            </div>
          </div>

          {/* Right Panel - White Form */}
          <div className='w-full lg:w-1/2 p-8 sm:p-10 lg:p-12 bg-white'>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectWithUs