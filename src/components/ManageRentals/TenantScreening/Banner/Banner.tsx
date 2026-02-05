"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TenantScreeningBanner: React.FC = () => {
  return (
    <section
      className="relative w-full bg-white overflow-x-hidden"
      aria-labelledby="tenant-screening-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left: Copy + CTAs */}
          <div className="order-2 lg:order-1 flex flex-col">
            <p className="text-secondary text-sm font-medium mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden />
              Free for landlords
            </p>
            <h1
              id="tenant-screening-heading"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-3 sm:mb-4"
            >
              Online tenant screening{" "}
              <span className="text-secondary">made simple</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-700 mb-6 max-w-xl">
              Run a complete renter background check, credit check, and get
              insight into an applicant&apos;s income qualifications and
              eviction history with our tenant screening service.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
              <Button asChild variant="default" size="lg" className="rounded-xl w-full sm:w-auto">
                <Link href="/manage-rentals" className="inline-flex items-center justify-center gap-2">
                  Start screening tenants
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Link
                href="/manage-rentals#pricing"
                className="text-sm font-medium text-zinc-600 hover:text-secondary hover:underline"
              >
                See pricing
              </Link>
            </div>
            <ul className="flex flex-wrap gap-4" aria-label="Benefits">
              <li className="flex items-center gap-2 text-sm text-zinc-700">
                <Check className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden />
                No hidden fees
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-700">
                <Check className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden />
                Secure &amp; compliant
              </li>
            </ul>
          </div>

          {/* Right: House image + tenant profile overlay card */}
          <div className="order-1 lg:order-2 relative aspect-[4/3] lg:aspect-[16/10] min-h-[260px] sm:min-h-0 rounded-xl overflow-hidden">
            <Image
              src="/images/managerentals/tenant-screening-banner.jpg"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="object-cover rounded-2xl"
              priority
            />
            <div
              className="absolute bottom-0  sm:left-auto sm:w-full h-[120px] sm:h-[140px] overflow-hidden"
              aria-label="Sample applicant profile"
            >
              <Image
                src="/images/managerentals/card.png"
                alt="Sample tenant screening applicant profile card"
                fill
                sizes="100%"
                className="object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TenantScreeningBanner;
