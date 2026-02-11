"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import CityCard from './CityCard';

interface City {
  id: number;
  image: string;
  cityName: string;
  numberOfProperties: number;
}

interface CitySliderProps {
  cities: City[];
}

const CitySlider = ({ cities }: CitySliderProps) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCanScrollPrev(carouselApi.canScrollPrev());
    setCanScrollNext(carouselApi.canScrollNext());

    carouselApi.on("select", () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    });
  }, [carouselApi]);

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="absolute -top-12 right-0 flex gap-1 justify-between items-center z-10 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => carouselApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className="h-8 w-8 rounded-lg bg-secondary/95 text-white backdrop-blur-sm shadow-lg border border-border hover:bg-primary hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
          aria-label="Previous slide"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => carouselApi?.scrollNext()}
          disabled={!canScrollNext}
          className="h-8 w-8 rounded-lg bg-secondary/95 text-white backdrop-blur-sm shadow-lg border border-border hover:bg-primary hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
          aria-label="Next slide"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{
          align: "start",
          loop: true,
          breakpoints: {
            "(max-width: 640px)": {
              dragFree: true,
            },
          },
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {cities.map((city) => (
            <CarouselItem
              key={city.id}
              className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <CityCard city={city} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default CitySlider;