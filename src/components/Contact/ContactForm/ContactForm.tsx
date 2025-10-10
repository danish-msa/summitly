import React from 'react'
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import Form from './Form'

const ContactForm = () => {
  return (
    <div className='mx-auto w-[90%] flex justify-between mb-32'>
        <div className='w-[65%] flex flex-col gap-5'>
            <h2 className='text-black font-medium text-4xl'>Drop Us A Line</h2>
            <p className='text-gray-500 font-light'>Feel free to connect with us through our online channels for updates, news, and more.</p>
            <Form />
        </div>
        <div className='w-[30%] border border-gray-200 rounded-2xl p-8'>
            <h2 className='text-black font-medium text-4xl'>Contact Us</h2>
            <div className='mt-7'>
                <h3 className='font-normal text-xl'>Address:</h3>
                <p className='text-gray-500 font-light'>101 E 129th St, East Chicago, IN 46312
                United States</p>
            </div>
            <div className='mt-7'>
                <h3 className='font-normal text-xl'>Infomation:</h3>
                <p className='text-gray-500 font-light'>1-333-345-6868
                hi.themesflat@gmail.com</p>
            </div>
            <div className='mt-7'>
                <h3 className='font-normal text-xl'>Opentime:</h3>
                <p className='text-gray-500 font-light'>Monay - Friday: 08:00 - 20:00
                Saturday - Sunday: 10:00 - 18:00</p>
            </div>
            <div className='mt-7'>
                <h3 className='font-normal text-xl'>Follow Us:</h3>
                {/* Social Links */}
                <div className='flex items-center space-x-4 mt-6'>
                    <FaFacebookF className='text-gray-600 w-10 h-10 p-2 rounded-lg border'/>
                    <FaTwitter className='text-gray-600 w-10 h-10 p-2 rounded-lg border'/>
                    <FaYoutube className='text-gray-600 w-10 h-10 p-2 rounded-lg border'/>
                    <FaInstagram className='text-gray-600 w-10 h-10 p-2 rounded-lg border'/>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ContactForm