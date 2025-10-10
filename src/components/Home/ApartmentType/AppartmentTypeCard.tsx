import Image from 'next/image'
import React from 'react'

interface PropertyType {
  id: number;
  icon: string;
  type: string;
  number: number;
}

interface AppartmentTypeCardProps {
  type: PropertyType;
}

const AppartmentTypeCard = ({ type }: AppartmentTypeCardProps) => {
  // Use a default icon if the icon path is invalid
  const iconSrc = type.icon || "/images/a1.png";
  
  return (
    <div className='flex flex-col items-center justify-center space-y-4 hover:scale-105 transition-all duration-300 cursor-pointer p-6 bg-white rounded-lg shadow-md'>
      <div className='bg-gray-100 p-4 rounded-full'>
        <Image src={iconSrc} alt={type.type} width={60} height={60} />
      </div>
      <div className='text-center'>
        <h3 className='text-xl font-semibold'>{type.type}</h3>
        <p className='text-gray-600'>{type.number.toLocaleString()} Properties</p>
      </div>
    </div>
  )
}

export default AppartmentTypeCard