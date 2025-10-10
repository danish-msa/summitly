import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import { BsArrowRight } from 'react-icons/bs';

const explorecities = [
    "Ajax Homes for Sale",
    "Aurora Homes for Sale",
    "Brampton Homes for Sale",
    "Brock Homes for Sale",
    "Burlington Homes for Sale",
    "Clarington Homes for Sale",
    "East Gwillimbury Homes for Sale",
    "Georgina Homes for Sale",
    "Halton Homes for Sale",
    "Hamilton Homes for Sale",
    "King Homes for Sale",
    "London Homes for Sale",
    "Markham Homes for Sale",
    "Mississauga Homes for Sale",
    "Newmarket Homes for Sale",
    "Oakville Homes for Sale",
    "Oshawa Homes for Sale",
    "Pickering Homes for Sale",
    "Richmond Hill Homes for Sale",
    "Scugog Homes for Sale",
    "Toronto Homes for Sale",
    "Uxbridge Homes for Sale",
    "Vaughan Homes for Sale",
    "Whitby Homes for Sale",
    "Whitchurch-Stouffville Homes for Sale",
  ];

const ExploreHotCities = () => {
  return (
    <div className='pt-16 pb-16 bg-white relative bg-cover bg-center'>
        <div className='w-[80%] mx-auto'>
            <SectionHeading heading='Explore Hot Cities Neighbourhoods' subheading='Explore' description='Explore the places we serve and connect with one of our expert, local agents.' />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mt-10 gap-6 items-center'>
                {explorecities.map((city, index) => (
                    <div
                    key={index}
                    className="flex items-center gap-2"
                    >
                        <BsArrowRight className="text-primary" />
                    <a
                        href={`/search?city=${encodeURIComponent(city)}`}
                        className="text-base font-semibold text-text hover:underline"
                    >
                        {city}
                    </a>
                    </div>
                ))}
            </div>
        </div>   
    </div>
  )
}

export default ExploreHotCities