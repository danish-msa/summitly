import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import ServiceCard from './ServiceCard'
import { services } from '@/data/data'


const WhatWeDo = () => {
  return (
    <div className='pt-16 pb-16 bg-background'>
        <div className='w-[80%] mx-auto'>
            <SectionHeading heading='What We Do' subheading='Our Services' description='' />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mt-10 md:mt-20 gap-8 items-center'>
                {services.map((service, i) => (
                    <div key={service.id} data-aos="fade-left" data-aos-delay={`${i * 150}`} data-aos-anchor-placement="top-center">
                        <ServiceCard service={service} />
                    </div>
                ))}
            </div>
        </div>   
    </div>
  )
}

export default WhatWeDo