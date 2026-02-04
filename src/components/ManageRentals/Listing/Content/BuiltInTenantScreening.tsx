"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BuiltInTenantScreening: React.FC = () => {
  return (
    <section
      className="container-1400 mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="tenant-screening-heading"
    >
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Kitchen image */}
          <div className="relative min-h-[280px] sm:min-h-[360px] rounded-xl overflow-hidden order-2 lg:order-1">
            <Image
              src="/images/managerentals/pricing-section.jpg"
              alt="Warm kitchen and dining area"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-xl"
            />
          </div>

          {/* Right: Text */}
          <div className="order-1 lg:order-2">
            <h2
              id="tenant-screening-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-4"
            >
              Built-in tenant screening
            </h2>
            <p className="text-zinc-600 text-base sm:text-lg max-w-xl">
              When you list your property with{" "}
              <Link
                href="/manage-rentals"
                className="font-semibold text-secondary hover:underline"
              >
                Summitly Rental Manager
              </Link>
              , you can accept rental applications for free to quickly screen
              prospective tenants with background checks, credit reports and
              eviction history.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuiltInTenantScreening;
