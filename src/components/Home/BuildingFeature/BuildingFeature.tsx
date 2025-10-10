import SectionHeading from '@/components/Helper/SectionHeading'
import { buildings } from '@/data/data';
import React from 'react'
import FeatureCard from './FeatureCard';

const BuildingFeature = () => {
  return (
    <div className='pt-16 pb-16 bg-background'>
        <div className='w-[80%] mx-auto'>
            <SectionHeading heading='What We Offer' subheading='Our Features' description='' />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mt-10 md:mt-20 gap-8 items-center'>
                {buildings.map((building, i) => (
                    <div key={building.id} data-aos="fade-left" data-aos-delay={`${i * 150}`} data-aos-anchor-placement="top-center">
                        <FeatureCard building={building} />
                    </div>
                ))}
            </div>
        </div>   
    </div>
  )
}

export default BuildingFeature