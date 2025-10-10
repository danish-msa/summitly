import React from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import CityCard from './CityCard';

interface City {
  id: number;
  image: string;
  cityName: string;
  numberOfProperties: number;
}

interface CitySlider2Props {
  cities: City[];
}

const CitySlider2 = ({ cities }: CitySlider2Props) => {
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1024 },
      items: 5
    },
    desktop: {
      breakpoint: { max: 1024, min: 768 },
      items: 3
    },
    tablet: {
      breakpoint: { max: 768, min: 640 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 640, min: 0 },
      items: 1
    }
  };

  return (
    <Carousel
      responsive={responsive}
      infinite={true}
      autoPlay={true}
      autoPlaySpeed={3000}
      keyBoardControl={true}
      customTransition="all .5s"
      transitionDuration={500}
      containerClass="carousel-container"
      removeArrowOnDeviceType={["tablet", "mobile"]}
      dotListClass="custom-dot-list-style"
      itemClass="carousel-item-padding-40-px"
    >
      {cities.map((city) => (
        <div key={city.id} className="px-2">
          <CityCard city={city} />
        </div>
      ))}
    </Carousel>
  );
};

export default CitySlider2;