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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <div className="relative">
      {/* Navigation Buttons - Positioned above the carousel */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-10 -right-10 flex gap-1 justify-between items-center z-10 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => carouselApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
          aria-label="Previous slide"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => carouselApi?.scrollNext()}
          disabled={!canScrollNext}
          className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
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
        <CarouselContent className="-ml-2 md:-ml-4 pb-10">
          {cities.map((city) => (
            <CarouselItem
              key={city.id}
              className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <PreConCityCard city={city} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default PreConCitySlider;

