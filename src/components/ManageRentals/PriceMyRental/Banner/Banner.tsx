"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocompleteInput } from "../AddressAutocompleteInput";

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
      className="relative bg-muted/30"
      aria-labelledby="price-my-rental-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          {/* Left: Copy + form */}
          <div>
            <p className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">
              Price my rental
            </p>
            <h1
              id="price-my-rental-heading"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-6"
            >
              How much should I charge for rent?
            </h1>
            <p className="text-zinc-600 text-base sm:text-lg mb-8 max-w-lg">
              Get a free Rent Zestimate® and see how your rental compares to
              similar homes in your area.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                By providing your email address, you agree to receive
                promotional and marketing materials from{" "}
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
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden />
              </Button>
            </form>
          </div>

          {/* Right: House image */}
          <div className="relative order-first lg:order-last min-h-[240px] sm:min-h-[320px] lg:min-h-[420px] rounded-xl overflow-hidden lg:overflow-hidden">
            <Image
              src="/images/managerentals/banner-1.jpg"
              alt="Modern home exterior"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceMyRentalBanner;
