import React from 'react'
import Image from 'next/image';
import { ButtonColorful } from '@/components/ui/button-colorful';

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
    <div className='bg-white overflow-hidden group rounded-3xl shadow-lg hover:shadow-xl hover:translate-y-[-10px] flex flex-col items-center justify-center gap-4 transition-all duration-300 p-8 '>
        <Image src={service.serviceImage} alt={service.name}  width={200} height={200} className='group-hover:scale-110 transition-all duration-300' />        
        <h3 className='text-2xl mt-4 text-center text-black group-hover:text-primary'>{service.name}</h3>
        <p className='text-sm text-black font-light text-center'>{service.description}</p>
        <ButtonColorful label="Learn More" href={service.serviceURL} />
    </div>
  )
}

export default ServiceCard