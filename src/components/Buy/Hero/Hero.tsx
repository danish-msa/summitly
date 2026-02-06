"use client";

import React from "react";
import { AutocompleteSearch } from "@/components/common/AutocompleteSearch";
import type { PropertyListing } from "@/lib/types";
import type { Location } from "@/lib/api/repliers/services/locations";
import { getPropertyUrl } from "@/lib/utils/propertyUrl";

const Hero = () => {
  const handleSelectListing = (listing: PropertyListing) => {
    const href = getPropertyUrl(listing);
    window.location.href = `${href}?estimation=1`;
  };

  const handleSelectLocation = (location: Location) => {
    const url = `/listings?location=${encodeURIComponent(location.name)}&estimation=1`;
    window.location.href = url;
  };

  return (
    <div className="w-full flex-col lg:flex-row flex justify-center items-center mt-16 py-12 sm:py-16 md:py-20 lg:py-24 bg-[url('/images/banner2.webp')] bg-cover bg-center relative mx-auto">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      <div className="flex flex-col items-center justify-center text-white w-[90%] sm:w-[55%] lg:w-[75%] relative z-10">
        <h1 className="capitalize text-2xl md:text-6xl leading-snug text-center w-full">
          Buy with us
        </h1>
        <h2 className="text-sm sm:text-base md:text-lg mt-4 font-normal my-4">
          Find out how much your home is worth in today&apos;s market!
        </h2>
        <p className="leading-relaxed text-center">
          With more than 500 real estate transactions and thousands of offers submitted, Justo&apos;s agents know your local market. We&apos;ll arrange for an experienced Realtor to come to your home and provide you with insight into the value of your home and the recommended listing price to get the most from your home sale. It&apos;s free and there is no obligation!
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
          <AutocompleteSearch
            placeholder="Enter your address or search for a location"
            className="flex-1 w-full [&_.text-slate-400]:text-white [&_.text-slate-500]:text-white"
            inputClassName=""
            onSelectListing={handleSelectListing}
            onSelectLocation={handleSelectLocation}
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;