"use client";

import React from 'react';
import { FaHandshake, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const AgentMatchingInfo = () => {
  const router = useRouter();
  
  return (
    <div className='py-16 bg-white'>
      <div className='w-[90%] max-w-7xl mx-auto'>
        <div className='text-center mb-12'>
          <h3 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
            The Right Realtor for You. Guaranteed.
          </h3>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            We use powerful intel to analyze agents based on their real track record, performance, and local area expertise, matching them to your unique needs.
          </p>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
          <div className='bg-gray-50 p-8 rounded-lg shadow-md text-center'>
            <FaChartLine className='mx-auto text-4xl text-primary mb-4' />
            <h3 className=' text-xl mb-3 text-gray-800'>Data-Driven Matching</h3>
            <p className='text-gray-600'>We analyze agents based on their performance, track record, and local expertise to find your perfect match.</p>
          </div>
          
          <div className='bg-gray-50 p-8 rounded-lg shadow-md text-center'>
            <FaHandshake className='mx-auto text-4xl text-secondary mb-4' />
            <h3 className='text-xl mb-3 text-gray-800'>Perfect Match Guarantee</h3>
            <p className='text-gray-600'>If your initial match isn't right, we'll keep searching until you find the perfect agent for your needs.</p>
          </div>
          
          <div className='bg-gray-50 p-8 rounded-lg shadow-md text-center'>
            <FaMoneyBillWave className='mx-auto text-4xl text-green-600 mb-4' />
            <h3 className='text-xl mb-3 text-gray-800'>Cashback Rewards</h3>
            <p className='text-gray-600'>Work with select agents and receive up to 1% cashback after closing on your new home purchase.</p>
          </div>
        </div>
        
        <div className='bg-primary bg-opacity-10 p-8 md:p-12 rounded-xl'>
          <div className='flex flex-col md:flex-row items-center justify-between'>
            <div className='md:w-2/3 mb-6 md:mb-0'>
              <h3 className='text-2xl text-white mb-3'>The Smarter Way to Buy & Sell</h3>
              <p className='text-white'>
                A smart move starts with us. Expert Realtors with unique data-driven insights and up to 1% cashback – it all adds up to a better real estate experience.
              </p>
            </div>
            <div>
              <button 
                onClick={() => router.push('/about')}
                className='bg-secondary text-white py-3 px-8 rounded-lg font-semibold hover:bg-primary-dark transition-all'
              >
                LEARN MORE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentMatchingInfo;