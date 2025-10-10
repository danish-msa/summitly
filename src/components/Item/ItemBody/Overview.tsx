import React from 'react'
import { BiBath, BiHomeAlt, BiLandscape } from 'react-icons/bi'
import { PiHammer } from 'react-icons/pi'
import { FiMapPin } from 'react-icons/fi'
import { IoCarOutline, IoBedOutline } from 'react-icons/io5'
import { PropertyListing } from '@/data/types' // Import the interface from types.ts

interface OverviewProps {
  property: PropertyListing;
}

const Overview: React.FC<OverviewProps> = ({ property }) => {
  return (
    <div className="mt-3 rounded-xl border border-solid border-[#DBDBDB] bg-white px-3 py-6 sm:px-4">
      <div className="flex flex-col flex-wrap justify-between gap-2 pb-5 md:flex-row md:pb-6">
        <div>
          <h2 className="flex items-center gap-1 pb-2 text-lg font-semibold text-gray-900 lg:text-2xl">
            <FiMapPin className="hidden md:block text-[20px] text-gray-800" />
            {property.address.streetNumber} {property.address.streetName}
          </h2>
          <ul className="flex gap-2 items-center">
            <li className="text-xs text-gray-800 md:text-base lg:text-lg">
              Listed on site {property.listDate ? new Date(property.listDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '12 hours ago'}
            </li>
            <li className="inline-block h-[4px] w-[4px] rounded-full bg-gray-800 lg:h-[6px] lg:w-[6px]"></li>
            <li className="text-xs font-semibold text-gray-800 md:text-base lg:text-lg">
              {property.address.city} {property.address.zip}
            </li>
          </ul>
        </div>
        <div className="hidden flex-col md:flex">
          <h3 className="pb-2 text-right text-base font-semibold text-gray-900 xl:text-lg">
            {property.details.propertyType}
          </h3>
          <p className="flex items-center text-right text-sm font-medium text-gray-800">
            MLS® #&nbsp;<span className="font-semibold text-gray-900">{property.mlsNumber}</span>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 border-t border-solid border-[#DADADA] px-0 pt-6 md:grid-cols-2 lg:grid-cols-3 lg:px-4">
        <div className="flex items-center gap-3 group">
          <span className="inline-flex h-[40px] min-w-[40px] items-center justify-center rounded bg-[#F5F5F5] group-hover:bg-secondary md:h-[56px] md:min-w-[56px]">
            <IoBedOutline className="text-[30px] text-gray-800 group-hover:text-white" />
          </span>
          <div>
            <h6 className="text-xs text-gray-500">Bedrooms</h6>
            <span className="break-all text-sm font-medium text-gray-900 xl:text-lg">
              {property.details.numBedrooms}&nbsp;Beds
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 group">
          <span className="inline-flex h-[40px] min-w-[40px] items-center justify-center rounded bg-[#F5F5F5] group-hover:bg-secondary md:h-[56px] md:min-w-[56px]">
            <BiBath className="text-[30px] text-gray-800 group-hover:text-white" />
          </span>
          <div>
            <h6 className="text-xs text-gray-500">Bathrooms</h6>
            <span className="break-all text-sm font-medium text-gray-900 xl:text-lg">
              {property.details.numBathrooms}&nbsp;Baths
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 group">
          <span className="inline-flex h-[40px] min-w-[40px] items-center justify-center rounded bg-[#F5F5F5] group-hover:bg-secondary md:h-[56px] md:min-w-[56px]">
            <BiHomeAlt className="text-[30px] text-gray-800 group-hover:text-white" />
          </span>
          <div>
            <h6 className="text-xs text-gray-500">Size</h6>
            <span className="break-all text-sm font-medium text-gray-900 xl:text-lg">
              {property.details.sqft}&nbsp;sqft
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 group">
          <span className="inline-flex h-[40px] min-w-[40px] items-center justify-center rounded bg-[#F5F5F5] group-hover:bg-secondary md:h-[56px] md:min-w-[56px]">
            <IoCarOutline className="text-[30px] text-gray-800 group-hover:text-white" />
          </span>
          <div>
            <h6 className="text-xs text-gray-500">Total Parking Spaces</h6>
            <span className="break-all text-sm font-medium text-gray-900 xl:text-lg">
              {property.details.numBathrooms || '2'}&nbsp;({property.details.numBathrooms || '1'}&nbsp;Garage)&nbsp;
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 group">
          <span className="inline-flex h-[40px] min-w-[40px] items-center justify-center rounded bg-[#F5F5F5] group-hover:bg-secondary md:h-[56px] md:min-w-[56px]">
            <PiHammer className="text-[30px] text-gray-800 group-hover:text-white" />
          </span>
          <div>
            <h6 className="text-xs text-gray-500">Year Built</h6>
            <span className="break-all text-sm font-medium text-gray-900 xl:text-lg">
              {property.updatedOn ? new Date(property.updatedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}&nbsp;
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 group">
          <span className="inline-flex h-[40px] min-w-[40px] items-center justify-center rounded bg-[#F5F5F5] group-hover:bg-secondary md:h-[56px] md:min-w-[56px]">
            <BiLandscape className="text-[30px] text-gray-800 group-hover:text-white" />
          </span>
          <div>
            <h6 className="text-xs text-gray-500">Lot Size</h6>
            <span className="break-all text-sm font-medium text-gray-900 xl:text-lg">
              {property.lot.squareFeet || '-'}&nbsp;sqft
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview