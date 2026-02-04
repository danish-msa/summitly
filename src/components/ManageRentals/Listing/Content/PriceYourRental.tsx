"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const PriceYourRental: React.FC = () => {
  return (
    <section
      className="container-1400 mx-auto bg-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="price-rental-heading"
    >
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text */}
          <div>
            <h2
              id="price-rental-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-4"
            >
              Price your rental
            </h2>
            <p className="text-zinc-600 text-base sm:text-lg max-w-xl mb-4">
              Feel confident when you list your property — we&apos;ll help you
              price it by integrating your Rent Zestimate into the listing and
              giving you tools to review comparable properties.
            </p>
            <Link
              href="/manage-rentals/price-my-rental"
              className="inline-flex font-medium text-secondary hover:underline"
            >
              Get your Rent Zestimate
            </Link>
          </div>

          {/* Right: Living room image + chart image at bottom-left */}
          <div className="relative min-h-[280px] sm:min-h-[340px] rounded-xl">
            <Image
              src="/images/p1.jpg"
              alt="Modern living room"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-xl"
            />
            <div
              className="absolute -bottom-10 -left-24 w-[200px] sm:w-[360px] aspect-[4/3] overflow-hidden"
              aria-hidden
            >
              <Image
                src="/images/managerentals/rent-zestimate-chart.png"
                alt="Rent Zestimate history chart"
                fill
                sizes="100%"
                className="object-contain p-1"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceYourRental;
