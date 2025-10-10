import React from 'react'
import { FaArrowUp } from 'react-icons/fa'
import { FiInfo } from 'react-icons/fi'

interface PriceSectionProps {
  price?: number;
  estimatedPrice?: number;
  estimationDate?: string;
  propertyStatus?: string;
}

const PriceSection: React.FC<PriceSectionProps> = ({ 
  price = 1229900, 
  estimatedPrice = 1282042, 
  estimationDate = 'Apr 2025',
  propertyStatus = 'For Sale'
}) => {
  return (
    <>
      <div className="mt-3 rounded-lg border border-solid border-[#DBDBDB] bg-white px-4 py-6 lg:px-6 lg:py-8">
        <div className="xxs:items-center xxs:flex-row flex flex-col items-start justify-between sm:flex-col sm:items-start sm:justify-start">
          <h2 className="flex flex-wrap items-center gap-1 pb-2 text-lg text-gray-900 lg:text-[28px]">
            ${price.toLocaleString()}
            <span className="ant-tag h-auto w-fit p-[6px] text-xs leading-none shadow" 
                  style={{ backgroundColor: 'rgba(44, 110, 74, 0.1)', color: 'rgb(44, 110, 74)' }}>
              {propertyStatus}
            </span>
          </h2>
          <div className="flex items-center justify-between gap-2">
            <div className="flex">
              <div className="flex items-center">
                <div className="flex items-center gap-1">
                  <FaArrowUp className="text-[14px] text-[#2C6E4A]" />
                  <span className="mr-1 text-[#2C6E4A]">${estimatedPrice.toLocaleString()}</span>
                </div>
                <div className="hidden items-center gap-[1px] text-sm font-normal text-gray-800 sm:flex">
                  <p>Estimated value as of {estimationDate}</p>
                  <FiInfo className="ml-1 text-[14px] text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[1px] text-sm font-normal text-gray-800 sm:hidden">
          <p className="float-left">Estimated value as of {estimationDate}</p>
          <FiInfo className="float-right ml-1 text-[14px] text-gray-600" />
        </div>
        <div className="border-t border-[#DBDBDB] my-4"></div>
        <div className="px-4 md:px-0">
          <h3 className="pb-1 text-base text-gray-900">Contact Our agent</h3>
          <p className="mb-5 text-sm text-gray-800">
            Connect with a Our agent to get more in-depth insights, market stats and listings for this property.
          </p>
          <form className="flex flex-col gap-6">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="you@email.com" 
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="submit" 
                className="w-full bg-primary text-white py-3 px-4 rounded font-semibold text-sm"
              >
                Login to Contact Our agent
              </button>
              <button 
                type="button" 
                className="w-full bg-primary text-white py-3 px-4 rounded font-semibold text-sm md:hidden"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className='flex flex-col gap-4 mt-10 p-5 border border-gray-200 rounded-2xl bg-secondary text-white'>
          <span className='text-white text-2xl capitalize font-semibold'>Here for your questions</span>
          <button className='btn btn-primary bg-white hover:bg-primary hover:text-white text-black'>Get in touch</button>
          <span className='text-white'>or call us at <a href="tel:(123) 456-7890">(123) 456-7890</a></span>
      </div>
    </>
  )
}

export default PriceSection