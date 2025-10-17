"use client";
import Image from 'next/image';
import React from 'react'

type Props = {
    building: {
        id: number;
        title: string;
        description: string;
        image: string;
    }
}

const FeatureCard = ({building}: Props) => {
  return (
    <div className='rounded-2xl overflow-hidden bg-white shadow-lg p-4 h-full flex flex-col'>
        <div className='w-16 h-16 ml-auto flex items-center justify-center flex-col bg-gray-100 text-white rounded-full'>
            <Image src={building.image} alt={building.title} width={40} height={40} className=''/>
        </div>
        <div className='p-2 flex-1 flex flex-col'>
            <p className='mt-4 text-primary font-bold text-xl'>0{building.id}</p>
            <h4 className='text-lg font-normal text-gray-600 mt-2'>{building.title}</h4>
            <p className='text-sm text-gray-500 mt-2 flex-1'>{building.description}</p>
        </div>
    </div>
    
  )
}

export default FeatureCard