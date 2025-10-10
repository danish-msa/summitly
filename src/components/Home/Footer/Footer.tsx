import React from 'react'
import { BiEnvelope, BiPhoneCall } from 'react-icons/bi'
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import { FaHouse } from 'react-icons/fa6'

const Footer = () => {
  return (
    <>
    <div className='w-full py-10 bg-secondary '>
        <div className='w-[80%] mx-auto flex flex-col md:flex-row gap-3 justify-between items-center'>
            <div className='w-full md:w-[50%] text-white'>
                <h2>Want to Become a Real Estate Agent?</h2>
                <p>We will help you to grow your career and growth.</p>
            </div>
            <button className='btn bg-white border-4 border-blue-300 px-10 text-black hover:text-white rounded-full'>SignUp Today</button>
        </div>
    </div>    


    <div className='pt-20 pb-12 bg-[#161E2D] text-white'>
        <div className='w-[80%] mx-auto gap-10 pb-8 mb-10 border-b-[1.5px] border-white border-opacity-20'>
        <div className='flex space-x-2 justify-between'>
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
                <div className='flex items-center space-x-4 mt-6'>
                    <FaFacebookF className='text-blue-600 w-6 h-6'/>
                    <FaTwitter className='text-sky-500 w-6 h-6'/>
                    <FaYoutube className='text-red-700 w-6 h-6'/>
                    <FaInstagram className='text-pink-600 w-6 h-6'/>
                </div>
            
                
            </div>
        </div>
        <div className='w-[80%] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-8 border-b-[1.5px] border-white border-opacity-20'>
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
        <div className='w-[80%] mx-auto pt-8'>
            <p className='text-base text-gray-400 text-center'>© 2025 Real Estate Project. All Rights Reserved.</p>
        </div>
    </div>
    </>
  )
}

export default Footer