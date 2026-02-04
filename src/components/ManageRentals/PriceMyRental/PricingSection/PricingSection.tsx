"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocompleteInput } from "../AddressAutocompleteInput";

const PricingSection: React.FC = () => {
  const [streetAddress, setStreetAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to pricing flow
  };

  return (
    <section
      className="bg-muted/20 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden"
      aria-labelledby="pricing-section-heading"
    >
      <div className="container-1400 mx-auto  grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-12 items-stretch">
        {/* Left: Kitchen image + chart overlay (40% on desktop, full height) */}
        <div className="relative order-2 lg:order-1 min-h-[280px] lg:min-h-0 lg:h-full rounded-xl overflow-hidden">
          <Image
            src="/images/managerentals/pricing-section.jpg"
            alt="Modern kitchen with dark cabinets and light wood flooring"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover rounded-xl"
          />
          <div
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-[260px] sm:w-[280px] h-[180px] sm:h-[300px] rounded-xl overflow-hidden"
            aria-label="Rent Zestimate history chart"
          >
            <Image
              src="/images/managerentals/rent-zestimate-chart.png"
              alt="Rent Zestimate history chart"
              fill
              sizes="280px"
              className="object-contain rounded-xl"
            />
          </div>  
        </div>

        {/* Right: Content + form */}
        <div className="order-1 lg:order-2">
          <h2
            id="pricing-section-heading"
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 leading-tight mb-6"
          >
            Questions about{" "}
            <span className="text-secondary">pricing your rental</span>?
          </h2>

          <div className="space-y-5 mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-1">
                Start with a free Rent Zestimate®
              </h3>
              <p className="text-sm sm:text-base text-zinc-600">
                The Rent Zestimate® uses millions of public data points — plus
                local market trends — to give you a starting point.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-1">
                Research other rental homes in your area
              </h3>
              <p className="text-sm sm:text-base text-zinc-600">
                Sort, filter and analyze a customized list of advertised rentals
                in your area. Information from similar advertised properties
                makes it easier to set the right price.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-1">
                Stay on top of market trends
              </h3>
              <p className="text-sm sm:text-base text-zinc-600">
                After you receive your Rent Zestimate®, we&apos;ll send you
                resources to help you learn what renters are looking for in your
                local market.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <AddressAutocompleteInput
                value={streetAddress}
                onSelect={setStreetAddress}
                name="streetAddress"
              />
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
      </div>
    </section>
  );
};

export default PricingSection;
