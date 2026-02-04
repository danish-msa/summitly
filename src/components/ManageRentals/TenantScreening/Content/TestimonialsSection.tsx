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
    image: "/images/testimonials/u1.jpg",
    rating: 5,
    content:
      "Tenant screening used to take days. Now I get credit and background checks in minutes. The recommended score makes it easy to choose the right renter.",
  },
  {
    id: 2,
    name: "David Chen",
    role: "Property Manager",
    project: "Portfolio: 12 units",
    image: "/images/testimonials/u2.jpg",
    rating: 5,
    content:
      "We screen every applicant through Summitly. Eviction history and income verification in one report. Compliant and straightforward.",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "First-time Landlord",
    project: "Single family home",
    image: "/images/testimonials/u3.jpg",
    rating: 5,
    content:
      "I was worried about picking the wrong tenant. The screening service gave me clear recommendations and peace of mind. Best decision I made.",
  },
  {
    id: 4,
    name: "James Thompson",
    role: "Retiree",
    project: "2 rental properties",
    image: "/images/testimonials/u4.jpg",
    rating: 5,
    content:
      "Accept, review, and approve applications in minutes. No more back-and-forth. My vacancy periods have dropped since I started screening properly.",
  },
];

export default function TestimonialsSection() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) return;
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
    <section
      className="py-12 sm:py-16 md:py-24 bg-background overflow-x-hidden"
      aria-labelledby="tenant-screening-testimonials-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="What landlords say about tenant screening"
          subheading="Testimonials"
          description="Landlords and property managers trust our screening service to find qualified renters quickly and fairly."
          position="center"
        />

        <div className="relative mt-6 sm:mt-10">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 md:-left-12 md:-right-12 flex justify-between items-center z-10 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
              aria-label="Previous testimonial"
            >
              <ArrowLeft className="h-6 w-6" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
              aria-label="Next testimonial"
            >
              <ArrowRight className="h-6 w-6" aria-hidden />
            </Button>
          </div>

          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "start",
              loop: true,
              breakpoints: {
                "(max-width: 640px)": { dragFree: true },
              },
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4 pb-6 sm:pb-10">
              {testimonials.map((t) => (
                <CarouselItem
                  key={t.id}
                  className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <TestimonialCard
                    name={t.name}
                    role={t.role}
                    project={t.project}
                    image={t.image}
                    rating={t.rating}
                    content={t.content}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="text-center mt-10 sm:mt-16 px-2">
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            Ready to screen tenants with confidence?
          </p>
          <Button asChild variant="default" className="rounded-lg w-full sm:w-auto">
            <Link href="/manage-rentals">Start screening for free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
