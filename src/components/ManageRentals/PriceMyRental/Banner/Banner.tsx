"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PriceMyRentalBanner: React.FC = () => {
  const [streetAddress, setStreetAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to pricing flow
  };

  return (
    <section
      className="relative w-full bg-white mt-14 sm:mt-16 overflow-x-hidden"
      aria-labelledby="price-my-rental-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Tag, heading, form */}
          <div className="order-2 lg:order-1">
            <span
              className="inline-flex items-center rounded-full bg-secondary/90 text-white text-xs sm:text-sm font-medium px-4 py-2 shadow-sm mb-6"
              aria-hidden
            >
              Price my rental
            </span>
            <h1
              id="price-my-rental-heading"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-6"
            >
              How much should I charge for rent?
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-4">
                <Input
                  type="text"
                  label="Street Address"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  aria-label="Street address"
                />
                <Input
                  type="text"
                  label="Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  aria-label="Unit number"
                />
              </div>
              <Input
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <p className="text-xs sm:text-sm text-zinc-500">
                By providing your email address, you agree to receive promotional
                and marketing materials from{" "}
                <Link
                  href="/"
                  className="font-medium text-secondary hover:underline"
                >
                  Summitly.
                </Link>
              </p>
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="rounded-xl w-full sm:w-auto"
              >
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </form>
          </div>

          {/* Right: House image */}
          <div className="order-1 lg:order-2 relative aspect-[4/3] lg:aspect-[16/10] min-h-[240px] sm:min-h-0 rounded-xl lg:overflow-hidden">
            <Image
              src="/images/managerentals/price-my-rental.jpg"
              alt="Residential house with well-maintained lawn"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="object-cover rounded-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceMyRentalBanner;
