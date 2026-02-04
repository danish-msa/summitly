"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TenantScreeningCtaBanner: React.FC = () => {
  return (
    <section
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-400 to-blue-600"
      aria-labelledby="tenant-screening-cta-heading"
    >
      <div className="container-1400 mx-auto text-center">
        <h2
          id="tenant-screening-cta-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6"
        >
          Start screening tenants today
        </h2>
        <Button
          asChild
          size="lg"
          className="rounded-xl bg-white text-blue-600 hover:bg-secondary font-medium px-8 py-6 text-base shadow-lg"
        >
          <Link href="/manage-rentals" className="inline-flex items-center gap-2">
            Get started for free
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default TenantScreeningCtaBanner;
