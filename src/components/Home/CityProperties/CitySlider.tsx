"use client"
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import React from 'react'
import { cities } from '@/data/data';
import CityCard from './CityCard';

const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 5
    },
    desktop: {
      breakpoint: { max: 3000, min: 1324 },
      items: 4,
      slidesToslide: 1
    },
    tablet: {
      breakpoint: { max: 1324, min: 764 },
      items: 2,
      slidesToslide: 1
    },
    mobile: {
      breakpoint: { max: 764, min: 0 },
      items: 1,
      slidesToslide: 1
    }
  };

const CitySlider = () => {
  return (
    <Carousel responsive={responsive} arrows={true} autoPlay={true} autoPlaySpeed={3000} infinite={true}>
        {cities.map((city) => (
            <div key={city.id} className=''>
                {/* SliderCard */}
                <CityCard city={city} />
            </div>
        ))}
    </Carousel>
  )
}

export default CitySlider