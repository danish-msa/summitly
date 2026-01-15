"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import SectionHeading from "@/components/Helper/SectionHeading";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  project: string;
  image: string;
  rating: number;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "First-time Homebuyer",
    project: "Oakridge Residences",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    rating: 5,
    content: "The pre-construction process was seamless. The team guided us through every step, and we got an incredible unit at a great price. Our investment has already appreciated significantly!"
  },
  {
    id: 2,
    name: "David Chen",
    role: "Real Estate Investor",
    project: "Skyline Towers",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    rating: 5,
    content: "I've purchased three units in this development. The location is prime, the builder's reputation is solid, and the projected returns are outstanding. Highly recommend for investors."
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Young Professional",
    project: "The Metropolitan",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    rating: 5,
    content: "Everything I wanted in a modern home - smart features, eco-friendly design, and a vibrant community. The pre-construction pricing made it possible for me to afford my dream condo!"
  },
  {
    id: 4,
    name: "James Thompson",
    role: "Retiree",
    project: "Harborview Estates",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    rating: 5,
    content: "After years of research, we chose this pre-construction project for our retirement. The amenities are exceptional, and the waterfront location is exactly what we were looking for."
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Business Owner",
    project: "Central Plaza",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop",
    rating: 5,
    content: "The investment potential and the quality of construction exceeded my expectations. The developer's transparency throughout the process made me confident in my decision."
  },
  {
    id: 6,
    name: "Michael O'Brien",
    role: "Growing Family",
    project: "Garden Heights",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    rating: 5,
    content: "Perfect timing for our expanding family. The flexible floor plans, nearby schools, and family-friendly amenities made this the ideal choice. We're excited to move in next year!"
  }
];

export const Testimonials = () => {
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
    <section className="py-24 bg-background">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeading
          heading="What Our Clients Say"
          subheading="Testimonials"
          description="Join hundreds of satisfied homeowners and investors who trusted us with their pre-construction journey"
          position="center"
        />

        {/* Testimonials Carousel */}
        <div className="relative mt-10">
          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-12 -right-12 flex gap-1 justify-between items-center z-10 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
              aria-label="Previous testimonial"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
              aria-label="Next testimonial"
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
              {testimonials.map((testimonial) => (
                <CarouselItem
                  key={testimonial.id}
                  className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Card 
                    className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-0 rounded-3xl shadow-lg relative h-full"
                  >
                    {/* Large Quote Icon - Top Right */}
                    <div className="absolute top-6 right-6 z-0">
                      <Quote className="w-10 h-10 text-secondary/20" strokeWidth={1} />
                    </div>

                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-4 relative z-10">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="w-5 h-5 fill-yellow-400 text-yellow-400" 
                        />
                      ))}
                    </div>

                    {/* Testimonial Content */}
                    <p className="text-foreground mb-6 leading-relaxed relative z-10">
                      {testimonial.content}
                      <span className="text-muted-foreground">"</span>
                    </p>

                    {/* Client Info */}
                    <div className="flex items-center gap-4 relative z-10">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={testimonial.image} alt={testimonial.name} />
                        <AvatarFallback className="bg-muted text-foreground">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground">
                          {testimonial.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                        <p className="text-sm text-secondary font-medium mt-1">
                          {testimonial.project}
                        </p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ready to start your pre-construction journey?
          </p>
          <Button variant="default" className="rounded-lg">
            Schedule a Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

