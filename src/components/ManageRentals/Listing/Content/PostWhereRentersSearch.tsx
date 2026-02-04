"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bed, Bath, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const PostWhereRentersSearch: React.FC = () => {
  return (
    <section
      className="container-1400 mx-auto bg-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="post-where-heading"
    >
      <div className="">
        {/* Centered headline + subtitle */}
        <header className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2
            id="post-where-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-3"
          >
            Post where renters are searching
          </h2>
          <p className="text-base sm:text-lg text-zinc-600">
            Access the network with over 30 million visitors each month to help
            you find your perfect renter.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Copy */}
          <div className="order-2 lg:order-1">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 leading-tight mb-4">
              Find rentals with less{" "}
              <span className="text-secondary">hassle</span>
            </h3>
            <p className="text-zinc-600 text-base sm:text-lg max-w-xl">
              List your house, townhome, condo, apartment or room for rent on{" "}
              <Link
                href="/manage-rentals"
                className="font-semibold text-secondary hover:underline"
              >
                Summitly
              </Link>{" "}
              Rental Manager and it will appear on the most visited rental
              network.
            </p>
          </div>

          {/* Right: House image + overlay card */}
          <div className="relative order-1 lg:order-2 min-h-[280px] sm:min-h-[360px] rounded-xl">
            <Image
              src="/images/managerentals/listing-1.jpg"
              alt="Modern house at dusk"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-xl"
            />
            {/* Overlay property card */}
            <div
              className={cn(
                "absolute -bottom-14 -left-14 sm:right-auto sm:w-[280px]",
                "bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
              )}
            >
              <div className="relative h-24 sm:h-28 w-full">
                <Image
                  src="/images/p1.jpg"
                  alt=""
                  fill
                  sizes="280px"
                  className="object-cover"
                />
              </div>
              <div className="p-3 sm:p-4">
                <p className="text-lg font-bold text-zinc-900">
                  $550,000{" "}
                  <span className="text-sm font-normal text-zinc-500 line-through">
                    $380,000
                  </span>
                </p>
                <p className="text-xs font-medium text-zinc-500 mt-1">
                  Estimated Market Value
                </p>
                <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: "92%" }}
                    aria-hidden
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">$560,000</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-zinc-600">
                  <span className="inline-flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" aria-hidden />
                    3 beds
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" aria-hidden />
                    2 baths
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" aria-hidden />
                    1800 sqft
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 truncate">
                  12 Oak Avenue, Litchfield, CT 06759
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PostWhereRentersSearch;
