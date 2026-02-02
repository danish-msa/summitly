"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const GuessworkSection: React.FC = () => {
  return (
    <section
      className="container-1400 mx-auto bg-white py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden"
      aria-labelledby="guesswork-heading"
    >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-20 items-center">
          {/* Left: Property card */}
          <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[4/3] min-h-[220px] rounded-xl">
                <Image
                  src="/images/managerentals/guesswork.png"
                  alt="Bright interior living space with bookshelf and seating"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover rounded-xl sm:rounded-2xl"
                />
                <div className="absolute bottom-2 right-2 w-[50%] max-w-[160px] aspect-[4/3] overflow-hidden rounded-tl-lg sm:bottom-4 sm:right-4 sm:max-w-[200px] md:bottom-auto md:right-auto md:-bottom-16 md:-right-20 md:w-[65%] md:max-w-none lg:-bottom-20 lg:-right-24 lg:w-[70%]">
                  <Image
                    src="/images/managerentals/guesswork-propertycard.png"
                    alt="Property card: 409 Willow Way, Denver CO"
                    fill
                    sizes="(max-width: 768px) 160px, (max-width: 1024px) 200px, 280px"
                    className="object-contain object-bottom-right"
                  />
                </div>
              </div>
          </div>

          {/* Right: Copy + CTA */}
          <div className="order-1 lg:order-2">
            <h2
              id="guesswork-heading"
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3 sm:mb-4 text-zinc-900"
            >
              Take the guesswork out of{" "}
              <span className="text-secondary">managing</span> your{" "}
              <span className="text-secondary">business</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-700 mb-3 sm:mb-4">
              Price your rental competitively. Use our pricing tools to optimize
              the return on investment for your property.
            </p>
            <p className="text-sm sm:text-base text-zinc-700 mb-4 sm:mb-6">
              Our data-driven insights help you understand market trends, so you
              can make informed decisions about your rental strategy.
            </p>
            <Button asChild variant="outline" size="lg" className="rounded-lg w-full sm:w-auto">
              <Link href="/dashboard" className="inline-flex items-center gap-2">
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
        </div>
      </div>
    </section>
  );
};

export default GuessworkSection;
