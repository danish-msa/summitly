"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CtaBannerSection: React.FC = () => {
  return (
    <section
      className="py-12 sm:py-16 md:py-20 bg-[#101828]"
      aria-labelledby="sign-online-cta-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="sign-online-cta-heading"
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3"
        >
          Skip the hassle. Sign online.
        </h2>
        <p className="text-base sm:text-lg text-white/90 mb-8 max-w-xl mx-auto">
          Make signing a lease easier for everyone with Summitly.
        </p>
        <Button
          asChild
          size="lg"
          className="rounded-lg bg-secondary hover:bg-secondary/90 text-white font-semibold px-8"
        >
          <Link href="/manage-rentals/dashboard">Create a Lease Now</Link>
        </Button>
      </div>
    </section>
  );
};

export default CtaBannerSection;
