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
      "Creating and signing leases used to mean printing, mailing, and meeting in person. Now I build a lease online, send it for e-signature, and store it in one place. Huge time saver.",
  },
  {
    id: 2,
    name: "David Chen",
    role: "Property Manager",
    project: "Portfolio: 12 units",
    image: "/images/testimonials/u2.jpg",
    rating: 5,
    content:
      "The lease templates are legally reviewed and easy to customize. We upload our own clauses when needed. E-signatures mean no more chasing tenants for a wet signature.",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "First-time Landlord",
    project: "Single family home",
    image: "/images/testimonials/u3.jpg",
    rating: 5,
    content:
      "I was nervous about getting the lease right. The lease builder walked me through everything and the templates gave me confidence I was covered. Tenants signed the same day.",
  },
  {
    id: 4,
    name: "James Thompson",
    role: "Retiree",
    project: "2 rental properties",
    image: "/images/testimonials/u4.jpg",
    rating: 5,
    content:
      "Upload, edit, sign, and store — all in Rental Manager. When it's time to renew or collect rent, the lease is right there. Peace of mind and less paperwork.",
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
      className="py-12 sm:py-16 md:py-24 bg-zinc-50/80 overflow-x-hidden"
      aria-labelledby="lease-agreements-testimonials-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="What landlords say about lease agreements"
          subheading="Testimonials"
          description="Landlords and property managers use our tools to create, sign, and store rental leases with confidence."
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
            Ready to create and sign leases online?
          </p>
          <Button asChild variant="default" className="rounded-lg w-full sm:w-auto">
            <Link href="/manage-rentals/dashboard">Create a lease</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
