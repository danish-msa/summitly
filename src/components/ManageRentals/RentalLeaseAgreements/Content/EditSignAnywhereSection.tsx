"use client";

import React from "react";
import Image from "next/image";
import { Upload, Archive } from "lucide-react";

const EditSignAnywhereSection: React.FC = () => {
  return (
    <section
      className="bg-zinc-50/80 py-12 sm:py-16 md:py-20"
      aria-labelledby="edit-sign-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="edit-sign-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 text-center leading-tight mb-10 sm:mb-12"
        >
          Edit and sign a lease anywhere. Access it anytime.
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Left card: Upload, edit and sign */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB] mb-4"
              aria-hidden
            >
              <Upload className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Upload, edit and sign your preferred lease agreement
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed mb-6">
              Upload any rental lease to Rental Manager and use dynamic fields to
              update key info digitally, then send for signing anytime, anywhere.
            </p>
            <div className="relative overflow-hidden">
              <Image
                src="/images/managerentals/uploading.png"
                alt="Upload in progress"
                width={400}
                height={80}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Right card: Store for later */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 text-violet-600 mb-4"
              aria-hidden
            >
              <Archive className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Store for later
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed mb-6">
              Stay organized and enhance your experience by storing your
              existing lease agreement right in Rental Manager. When it&apos;s
              time to collect payments, message tenants or renew, we&apos;ll bring
              in key info from your rental agreement to help you save time.
            </p>
            <div className="relative overflow-hidden">
              <Image
                src="/images/managerentals/pdfs.png"
                alt="Stored lease agreements - Lease_Agreement_v 1.pdf, v 2, v 3"
                width={400}
                height={140}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditSignAnywhereSection;
