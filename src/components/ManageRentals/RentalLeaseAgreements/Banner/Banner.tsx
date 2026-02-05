"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BANNER_FEATURES = [
  "Free to create",
  "E-signatures",
  "Legally reviewed",
];

const RentalLeaseAgreementsBanner: React.FC = () => {
  return (
    <section
      className="relative w-full bg-white overflow-x-hidden"
      aria-labelledby="lease-agreements-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left: Copy + CTAs */}
          <div className="order-2 lg:order-1 flex flex-col">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1.5 text-sm font-medium text-secondary mb-4 w-fit"
              aria-hidden
            >
              <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden />
              Trusted by 50,000+ Landlords
            </span>
            <h1
              id="lease-agreements-heading"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-3 sm:mb-4"
            >
              Managing lease agreements has never been{" "}
              <span className="text-secondary">simpler</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-700 mb-6 max-w-xl">
              Upload and edit your current lease agreement, or build and customize a new rental lease — then quickly sign electronically. It&apos;s all a snap with our tools to manage a lease online.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
              <Button asChild variant="default" size="lg" className="rounded-lg w-full sm:w-auto">
                <Link href="/manage-rentals/dashboard" className="inline-flex items-center justify-center gap-2">
                  Create a Lease
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-lg w-full sm:w-auto border-secondary text-secondary hover:bg-secondary/10">
                <Link href="/manage-rentals/dashboard" className="inline-flex items-center justify-center gap-2">
                  Upload Existing
                </Link>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-4" aria-label="Benefits">
              {BANNER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-zinc-700">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Image + two small overlay badges (up: Status, down: Powered by) */}
          <div className="order-1 lg:order-2 relative aspect-[4/3] lg:aspect-[16/10] min-h-[240px] sm:min-h-0 rounded-xl">
            <Image
              src="/images/managerentals/lease-banner.png"
              alt="Lease agreements and rental documents management"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 720px"
              className="object-contain rounded-2xl"
              priority
            />
            {/* 1. Upper: Status badge (image) */}
            <div
              className="absolute top-3 right-3 sm:top-4 sm:right-4 md:-top-8 md:right-14 z-10 overflow-hidden"
              aria-label="Status: Lease Signed"
            >
              <Image
                src="/images/managerentals/lease-signed.png"
                alt="Lease Signed"
                width={200}
                height={100}
                className="rounded-lg object-contain"
              />
            </div>
            {/* 2. Lower: Powered by Legal Partners (image) */}
            <div
              className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:-bottom-10 md:left-20 z-10 overflow-hidden"
              aria-label="Powered by Legal Partners"
            >
              <Image
                src="/images/managerentals/legal-partners.png"
                alt="Powered by Legal Partners"
                width={200}
                height={100}
                className="rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RentalLeaseAgreementsBanner;
