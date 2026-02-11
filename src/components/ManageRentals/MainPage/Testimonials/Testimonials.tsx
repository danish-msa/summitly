"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { TestimonialCard } from "@/components/ui/testimonial-card";
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
    role: "Landlord",
    project: "3 rental units",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    rating: 5,
    content:
      "Rental Manager took the stress out of landlording. Leases, payments, and maintenance requests are all in one place. I save hours every month.",
  },
  {
    id: 2,
    name: "David Chen",
    role: "Property Manager",
    project: "Portfolio: 12 units",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    rating: 5,
    content:
      "Screening tenants and collecting rent used to be a headache. Now it's streamlined. My occupancy rate has never been better.",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "First-time Landlord",
    project: "Single family home",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    rating: 5,
    content:
      "I was nervous about managing my first rental. The tools and support made everything simple. I feel confident and in control.",
  },
  {
    id: 4,
    name: "James Thompson",
    role: "Retiree",
    project: "2 rental properties",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    rating: 5,
    content:
      "From lease signing to move-out, everything is organized. The pricing insights helped me set the right rent. Highly recommend.",
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Real Estate Investor",
    project: "8 units across 3 cities",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop",
    rating: 5,
    content:
      "Managing multiple properties used to mean multiple spreadsheets. Rental Manager brings it all together. Game changer for scaling.",
  },
  {
    id: 6,
    name: "Michael O'Brien",
    role: "Landlord",
    project: "Duplex",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    rating: 5,
    content:
      "Tenant screening and online lease signing saved me so much time. The maintenance request flow keeps everyone accountable. Great product.",
  },
];

export const ManageRentalsTestimonials = () => {
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
    <section className="py-12 sm:py-16 md:py-24 bg-background overflow-x-hidden">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="What Landlords Say"
          subheading="Testimonials"
          description="Join landlords and property managers who simplified their rentals with Rental Manager"
          position="center"
        />

        <div className="relative mt-6 sm:mt-10">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 md:-left-12 md:-right-12 flex gap-1 justify-between items-center z-10 pointer-events-none px-0 md:px-0">
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
            <CarouselContent className="-ml-2 md:-ml-4 pb-6 sm:pb-10">
              {testimonials.map((testimonial) => (
                <CarouselItem
                  key={testimonial.id}
                  className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <TestimonialCard
                    name={testimonial.name}
                    role={testimonial.role}
                    project={testimonial.project}
                    image={testimonial.image}
                    rating={testimonial.rating}
                    content={testimonial.content}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="text-center mt-10 sm:mt-16 px-2">
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            Ready to simplify your rental management?
          </p>
          <Button asChild variant="default" className="rounded-lg w-full sm:w-auto">
            <Link href="/dashboard">Get started for free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
