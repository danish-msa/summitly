"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Check, CreditCard, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const CREDIT_DETAILS = [
  "Credit score",
  "Open credit lines",
  "Employment history",
  "Residence history",
  "Past bankruptcies or collections",
];

const ScreeningServiceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"credit" | "background">("credit");

  return (
    <section
      className="bg-slate-50/80"
      aria-labelledby="screening-service-heading"
    >
      <div className="container-1400 mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Title, tabs, list, callout */}
          <div>
            <h2
              id="screening-service-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-4"
            >
              A tenant screening service you can rely on
            </h2>
            <p className="text-zinc-600 text-base mb-6">
              Get the information you need to feel confident about each
              applicant. We partner with industry leaders to provide
              comprehensive reports.
            </p>
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("credit")}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === "credit"
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-zinc-600 hover:bg-slate-50"
                )}
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                Credit report
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("background")}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === "background"
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-zinc-600 hover:bg-slate-50"
                )}
              >
                <FileCheck className="h-4 w-4" aria-hidden />
                Background check
              </button>
            </div>
            {activeTab === "credit" && (
              <>
                <h3 className="text-lg font-bold text-zinc-900 mb-3">
                  Credit report details
                </h3>
                <ul className="space-y-2 mb-8">
                  {CREDIT_DETAILS.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-zinc-700">
                      <Check className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 sm:p-5">
                  <h6 className="font-bold text-amber-900 mb-1">
                    No fee for landlords
                  </h6>
                  <p className="text-amber-800/90 text-xs">
                    Renters pay an affordable fee when they apply to your
                    listing — and it doesn&apos;t cost you anything.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right: Image with overlay text */}
          <div className="relative rounded-2xl overflow-hidden min-h-[280px] aspect-[4/3]">
            <Image
              src="/images/managerentals/pricing-section.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/40" aria-hidden />
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-[280px]">
              <p className="text-white font-bold text-lg">
                Comprehensive credit report
              </p>
              <p className="text-white/90 text-sm mt-1">
                Secure and compliant data handling
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScreeningServiceSection;
