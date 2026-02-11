"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight, Wallet, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = ["Leases", "Payments", "Maintenance", "Screening"];

const ManageRentalsBanner: React.FC = () => {
  return (
    <section
      className="relative w-full bg-white mt-14 sm:mt-16 overflow-x-hidden"
      aria-labelledby="manage-rentals-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left: Copy + CTAs */}
          <div className="order-2 lg:order-1 flex flex-col">
            <h1
              id="manage-rentals-heading"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-3 sm:mb-4"
            >
              Level up your landlording{" "}
              <span className="text-secondary">simply</span> and{" "}
              <span className="text-secondary">confidently</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-700 mb-4 sm:mb-6 max-w-xl">
              Take the extra legwork out of running your rental. From leases and
              payments to maintenance and move-out, Rental Manager has the tools
              to help you get more done.
            </p>
            <ul className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8" aria-label="Key features">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center">
                  <span className="inline-flex items-center gap-2 sm:gap-3 rounded-full bg-zinc-100 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-zinc-800">
                    <span
                      className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border-2 border-secondary"
                      aria-hidden
                    >
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-secondary" aria-hidden />
                    </span>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Button asChild variant="default" size="lg" className="rounded-lg w-full sm:w-auto">
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2">
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <span className="text-xs sm:text-sm text-zinc-600 text-center sm:text-left block sm:inline">
                Already have an account?{" "}
                <Link
                  href="/dashboard"
                  className="font-medium text-secondary hover:underline"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </div>

          {/* Right: Image + floating data cards */}
          <div className="order-1 lg:order-2 relative aspect-[4/3] lg:aspect-[16/10] min-h-[240px] sm:min-h-0 rounded-xl">
            <Image
              src="/images/managerentals/banner-1.jpg"
              alt="Modern house with outdoor space, representing rental property management"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="object-cover rounded-2xl"
              priority
            />
            {/* Floating card: Rent Collected */}
            <div
              className="absolute top-3 left-3 sm:top-4 sm:left-4 md:-top-2 md:-left-6 flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl p-2.5 sm:p-4 min-w-[130px] sm:min-w-[160px]"
              aria-label="Rent collected: $12,450"
            >
              <span className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50" aria-hidden>
                <Wallet className="h-5 w-5 sm:h-7 sm:w-7 text-secondary" aria-hidden />
              </span>
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] sm:text-sm text-zinc-600 font-medium leading-tight">Rent Collected</p>
                <p className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">$12,450</p>
              </div>
            </div>
            {/* Floating card: Occupancy Rate */}
            <div
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 md:-bottom-2 md:-right-6 flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl p-2.5 sm:p-4 min-w-[130px] sm:min-w-[160px]"
              aria-label="Occupancy rate: 98%, up 2.4%"
            >
              <span className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7]" aria-hidden>
                <ShieldCheck className="h-5 w-5 sm:h-7 sm:w-7 text-[#FFDB43]" aria-hidden />
              </span>
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] sm:text-sm text-zinc-600 font-medium leading-tight">Occupancy Rate</p>
                <span className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <p className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">98%</p>
                  <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium text-secondary">
                    <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                    +2.4%
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManageRentalsBanner;
