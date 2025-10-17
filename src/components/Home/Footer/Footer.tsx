import React from 'react'
import { BiEnvelope, BiPhoneCall } from 'react-icons/bi'
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import { FaHouse } from 'react-icons/fa6'

const Footer = () => {
  return (
    <>
    <div className='w-full py-8 sm:py-10 bg-secondary '>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center'>
            <div className='w-full md:w-[50%] text-white text-center md:text-left'>
                <h2 className='text-lg sm:text-xl md:text-2xl font-bold mb-2'>Want to Become a Real Estate Agent?</h2>
                <p className='text-sm sm:text-base'>We will help you to grow your career and growth.</p>
            </div>
            <button className='btn bg-white border-4 border-blue-300 px-6 sm:px-8 md:px-10 py-2 sm:py-3 text-black hover:text-white rounded-full text-sm sm:text-base font-medium whitespace-nowrap'>SignUp Today</button>
        </div>
    </div>    


    <div className='pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12 bg-[#161E2D] text-white'>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6 sm:gap-10 pb-6 sm:pb-8 mb-6 sm:mb-10 border-b-[1.5px] border-white border-opacity-20'>
        <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-2 justify-between items-center sm:items-start'>
                {/* Logo */}    
                <div className='flex items-center space-x-2'>
                    <div className='w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary text-white flex items-center justify-center flex-col'>
                        <FaHouse/>
                    </div>
                    <div className='text-white font-bold text-sm sm:text-base md:text-xl'>
                        Real Estate Project
                    </div>
                </div>
                
                {/* Social Links */}
                <div className='flex items-center space-x-3 sm:space-x-4'>
                    <FaFacebookF className='text-blue-600 w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                    <FaTwitter className='text-sky-500 w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                    <FaYoutube className='text-red-700 w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                    <FaInstagram className='text-pink-600 w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer'/>
                </div>
            </div>
        </div>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 pb-6 sm:pb-8 border-b-[1.5px] border-white border-opacity-20'>
            {/* First Column */}
            <div className='flex flex-col space-x-2'>
                {/* Logo */}    
                
                <p className='text-sm text-white'>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <div className='flex items-center space-x-2 mt-4'>
                    <BiEnvelope className='w-5 h-5 text-secondary'/>
                    <p className='text-base font-semibold text-white hover:text-secondary cursor-pointer'>example@gmail.com</p>
                </div>
                <div className='flex items-center space-x-2 mt-4'>
                    <BiPhoneCall className='text-secondary w-5 h-5'/>
                    <p className='text-base font-semibold text-white hover:text-secondary cursor-pointer'>+123 345-6789</p>
                </div>
            </div>

            {/* Second Column */}
            <div className='flex-col md:mx-auto space-x-2'>
                <h2 className='footer__heading'>Popular Search</h2>
                <p className='footer__link'>Apartment for Rent</p>
                <p className='footer__link'>Apartment Low to Hide</p>
                <p className='footer__link'>Offices for Buy</p>
                <p className='footer__link'>Offices for Rent</p>
            </div>

            {/* Third Column */}
            <div className='flex-col md:mx-auto space-x-2'>
            <h2 className='footer__heading'>Quick Links</h2>
                <p className='footer__link'>Terms of Use</p>
                <p className='footer__link'>Privacy Policy</p>
                <p className='footer__link'>Pricing Plans</p>
                <p className='footer__link'>Our Services</p>
                <p className='footer__link'>Contact Support</p>
                <p className='footer__link'>Careers</p>
                <p className='footer__link'>FAQs</p>
            </div>

            {/* Fourth Column */}
            <div className='flex-col md:mx-auto space-x-2'>
            <h2 className='footer__heading'>Discover</h2>
                <p className='footer__link'>Miami</p>
                <p className='footer__link'>Los Angeles</p>
                <p className='footer__link'>Chicago</p>
                <p className='footer__link'>New York</p>
                <p className='footer__link'>London</p>
            </div>
        </div>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8'>
            <p className='text-xs sm:text-sm md:text-base text-gray-400 text-center'>© 2025 Real Estate Project. All Rights Reserved.</p>
        </div>
    </div>
    </>
  )
}

export default Footer