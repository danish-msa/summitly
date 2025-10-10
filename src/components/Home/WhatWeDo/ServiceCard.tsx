import React from 'react'
import Image from 'next/image';
import { FaArrowRightLong } from 'react-icons/fa6';

type Props = {
    service: {
        id: number;
        name: string;
        description: string;
        serviceImage: string;
        serviceURL: string;
    }
}
const ServiceCard = ({service}: Props) => {
  return (
    <div className='bg-white overflow-hidden group rounded-2xl border-[#e4e4e4] hover:shadow-lg flex flex-col items-center justify-center gap-4 transition-all duration-300 p-8 '>
        <Image src={service.serviceImage} alt={service.name}  width={200} height={200} className='group-hover:scale-110 transition-all duration-300' />        
        <h3 className='text-2xl mt-4 text-center text-black group-hover:text-primary'>{service.name}</h3>
        <p className='text-sm text-black font-light text-center'>{service.description}</p>
        <a href={service.serviceURL} className='btn bg-transparent border-[#1563df] px-10 hover:bg-[#1563df] hover:text-white font-light text-black rounded-full text-center mt-4'><FaArrowRightLong /> Learn More</a>
    </div>
  )
}

export default ServiceCard