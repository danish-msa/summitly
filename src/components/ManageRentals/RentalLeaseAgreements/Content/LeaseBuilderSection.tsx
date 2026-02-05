"use client";

import React from "react";
import Image from "next/image";
import { Shield, ChevronDown } from "lucide-react";

const LeaseBuilderSection: React.FC = () => {
  return (
    <section
      className="bg-white py-12 sm:py-16 md:py-20"
      aria-labelledby="lease-builder-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Lease Builder image */}
          <div className="relative aspect-[4/3] max-w-xl mx-auto lg:mx-0 rounded-2xl bg-[#EFF6FF] overflow-hidden">
            <Image
              src="/images/managerentals/lease-builder.png"
              alt="Lease Builder - property address, start and end date, monthly rent"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 640px"
              className="object-contain"
            />
          </div>

          {/* Right: Copy + highlight box + availability */}
          <div>
            <h2
              id="lease-builder-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-4"
            >
              Confidently build a customized rental lease for your property
            </h2>
            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed mb-6">
              You&apos;re a landlord, not a lawyer — that&apos;s why our lease
              agreement templates are created in partnership with law firms
              versed in local law. Add your customization to create a rental
              lease that meets your unique needs.
            </p>
            <div className="flex gap-3 rounded-xl border border-secondary/20 bg-secondary/5 p-4 mb-6">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary"
                aria-hidden
              >
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold text-zinc-900 mb-1">
                  Protect yourself and your property
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Get peace of mind knowing our easy-to-use lease agreement
                  templates are created in partnership with law firms versed in
                  local law.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <span>Currently available in</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium text-zinc-900 hover:text-secondary transition-colors"
                aria-expanded="false"
                aria-haspopup="listbox"
              >
                36 states
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaseBuilderSection;
