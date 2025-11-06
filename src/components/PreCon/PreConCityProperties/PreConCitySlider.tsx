import React from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import PreConCityCard from './PreConCityCard';

interface PreConCity {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

interface PreConCitySliderProps {
  cities: PreConCity[];
}

const PreConCitySlider = ({ cities }: PreConCitySliderProps) => {
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
          <PreConCityCard city={city} />
        </div>
      ))}
    </Carousel>
  );
};

export default PreConCitySlider;

