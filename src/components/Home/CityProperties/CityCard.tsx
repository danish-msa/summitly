import React from 'react';
import { BsArrowRightCircle } from 'react-icons/bs';
import BlurImage from '../../Helper/BlurImage';
// import { hover } from 'motion';

interface City {
  id: number;
  image: string;
  cityName: string;
  numberOfProperties: number;
}

interface CityCardProps {
  city: City;
}

const CityCard = ({ city }: CityCardProps) => {
  return (
    <div className='relative rounded-lg overflow-hidden m-2 group'>
        <BlurImage src={city.image} alt={city.cityName} width={700} height={700} className='rounded-2xl w-full h-[250px] object-cover'/>
        <div className='absolute bottom-2 left-2 right-2 rounded-xl px-4 pt-4 pb-4 bg-white text-black flex justify-between items-center'>
          <div className='flex flex-col'>
            <p className='text-sm'>{city.numberOfProperties} Properties</p>
            <h4 className='text-base font-medium'>{city.cityName}</h4>
          </div>
          <BsArrowRightCircle className='text-3xl text-gray-400 group-hover:text-black' />
        </div>
    </div>




  );
};

export default CityCard