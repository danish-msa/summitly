import React from 'react'
import { BiEnvelope, BiPhoneCall } from 'react-icons/bi'
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'
import { ContactMethods } from '../ContactMethods/ContactMethods'

const Footer = () => {
  return (
    <>
    <ContactMethods />


    <div className='w-full py-8 sm:py-10 bg-secondary '>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center'>
            <div className='w-full md:w-[50%] text-white text-center md:text-left'>
                <h2 className='text-lg sm:text-xl md:text-2xl font-bold mb-2'>Want to Become a Real Estate Agent?</h2>
                <p className='text-sm sm:text-base'>We will help you to grow your career and growth.</p>
            </div>
            <button className='btn bg-white border-4 border-blue-300 px-6 sm:px-8 md:px-10 py-2 sm:py-3 text-black hover:text-white rounded-full text-sm sm:text-base font-medium whitespace-nowrap'>SignUp Today</button>
        </div>
    </div>    


    <div className='pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12 bg-brand-midnight text-white'>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6 sm:gap-10 pb-6 sm:pb-8 mb-6 sm:mb-10 border-b-[1.5px] border-white border-opacity-20'>
        <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-2 justify-between items-center sm:items-start'>
                {/* Logo */}    
                <div className='flex items-center space-x-2'>
                    <Image 
                        src="/images/logo/summitly_logo.png" 
                        alt="Summitly Logo" 
                        width={200} 
                        height={200}
                        className="w-auto h-8 md:h-10"
                    />
                </div>
                
                {/* Social Links */}
                <div className='flex items-center space-x-3 sm:space-x-4'>
                    <FaFacebookF className='text-white w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                    <FaTwitter className='text-white w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                    <FaYoutube className='text-white w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                    <FaInstagram className='text-white w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                </div>
            </div>
        </div>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 pb-6 sm:pb-8 border-b-[1.5px] border-white border-opacity-20'>
            {/* First Column - Contact Info */}
            <div className='flex flex-col space-y-4'>
                <p className='text-sm text-white'>Your trusted partner in real estate. We help you find your perfect home and make informed decisions.</p>
                <div className='flex items-center space-x-2'>
                    <BiEnvelope className='w-5 h-5 text-secondary'/>
                    <p className='text-base font-semibold text-white hover:text-secondary cursor-pointer'>info@summitly.com</p>
                </div>
                <div className='flex items-center space-x-2'>
                    <BiPhoneCall className='text-secondary w-5 h-5'/>
                    <p className='text-base font-semibold text-white hover:text-secondary cursor-pointer'>+1 (555) 123-4567</p>
                </div>
            </div>
            
            {/* Second Column - Explore */}
            <div className='flex flex-col space-y-3'>
                <h2 className='text-lg font-bold text-white mb-2'>Explore</h2>
                <Link href="/" className='text-sm text-gray-300 hover:text-white transition-colors'>Home</Link>
                <Link href="/listings" className='text-sm text-gray-300 hover:text-white transition-colors'>Browse Listings</Link>
                <Link href="/map-search" className='text-sm text-gray-300 hover:text-white transition-colors'>Map Search</Link>
                <Link href="/listings" className='text-sm text-gray-300 hover:text-white transition-colors'>Popular Search Links</Link>
                <Link href="/home-estimation" className='text-sm text-gray-300 hover:text-white transition-colors'>Home Evaluation</Link>
                <Link href="/contact" className='text-sm text-gray-300 hover:text-white transition-colors'>Real Estate Action Plan</Link>
            </div>

            {/* Third Column - Learn More */}
            <div className='flex flex-col space-y-3'>
                <h2 className='text-lg font-bold text-white mb-2'>Learn More</h2>
                <Link href="/agents" className='text-sm text-gray-300 hover:text-white transition-colors'>Join Summitly</Link>
                <Link href="/blogs" className='text-sm text-gray-300 hover:text-white transition-colors'>Blog</Link>
                <Link href="/contact" className='text-sm text-gray-300 hover:text-white transition-colors'>Contact Us</Link>
            </div>

            
        </div>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8'>
            <div className='mb-4'>
                <p className='text-xs text-gray-400 text-center leading-relaxed'>
                    For listings in Canada, the trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by CREA and identify the quality of services provided by real estate professionals who are members of CREA. Used under license.
                </p>
            </div>
            <p className='text-xs sm:text-sm md:text-base text-gray-400 text-center'>© 2025 Summitly. All Rights Reserved.</p>
        </div>
    </div>
    </>
  )
}

export default Footer