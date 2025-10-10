"use client";
import Image from 'next/image';
import Tilt from 'react-parallax-tilt';
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
    <Tilt className='rounded-2xl overflow-hidden bg-white shadow-lg p-4'>
        <div className='w-16 h-16 ml-auto flex items-center justify-center flex-col bg-gray-100 text-white rounded-full'>
            <Image src={building.image} alt={building.title} width={40} height={40} className=''/>
        </div>
        <div className='p-2'>
            <p className='mt-4 text-primary font-bold text-xl'>0{building.id}</p>
            <h4 className='text-lg font-normal text-gray-600 mt-2'>{building.title}</h4>
            <p className='text-sm text-gray-500 mt-2'>{building.description}</p>
        </div>
    </Tilt>
    
  )
}

export default FeatureCard