"use client";

import React from "react";
import Image from "next/image";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const AssignmentSaleContent: React.FC = () => {
  return (
    <section
      className="bg-slate-50/80 py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="assignment-info-heading"
    >
      <div className="container-1400 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1fr] gap-8 lg:gap-12 items-start">
          {/* Left: Ontario Assignment Sale banner card */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[280px] sm:min-h-[320px] lg:min-h-[380px]">
            <Image
              src="/images/pre-con/container.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-slate-900/60"
              aria-hidden
            />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
              <h2
                id="assignment-info-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-2"
              >
                Ontario Assignment Sale
              </h2>
              <p className="text-white/95 text-sm sm:text-base max-w-lg">
                Check out Pre-construction Condos, Townhomes &amp; Detached home
                assignments for sale in Ontario, Canada.
              </p>
            </div>
          </div>

          {/* Right: FAQs + paragraph */}
          <div className="space-y-6">
            {/* FAQ 1 */}
            <div>
              <div className="flex items-start gap-3 mb-2">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-sky-600"
                  aria-hidden
                >
                  <HelpCircle className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-zinc-900 pt-1.5">
                  Is an Assignment legal in Ontario?
                </h3>
              </div>
              <div
                className={cn(
                  "rounded-xl bg-slate-100/90 border border-slate-200/80 p-4 sm:p-5",
                  "ml-0 sm:ml-[52px]"
                )}
              >
                <p className="text-zinc-700 text-sm sm:text-base leading-relaxed">
                  Unless prohibited in writing in the original agreement, it is
                  mostly legally permitted. Some developers may charge a fee for
                  assignment sales. It&apos;s best to confirm with the builder
                  directly regarding any restrictions and fees.
                </p>
              </div>
            </div>

            {/* FAQ 2 */}
            <div>
              <div className="flex items-start gap-3 mb-2">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600"
                  aria-hidden
                >
                  <HelpCircle className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-zinc-900 pt-1.5">
                  What is a preconstruction assignment sale?
                </h3>
              </div>
              <div
                className={cn(
                  "rounded-xl bg-slate-100/90 border border-slate-200/80 p-4 sm:p-5",
                  "ml-0 sm:ml-[52px]"
                )}
              >
                <p className="text-zinc-700 text-sm sm:text-base leading-relaxed">
                  An assignment is a sales transaction where the original buyer
                  of a property (the &quot;assignor&quot;) allows another buyer
                  (the &quot;assignee&quot;) to take over the buyer&apos;s rights
                  and obligations of the Agreement of Purchase and Sale before
                  the original buyer closes on the property.
                </p>
              </div>
            </div>

            {/* Concluding paragraph */}
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Summitly is one of the leading online marketplaces for
              pre-construction and assignment sales in Ontario. Check out
              hundreds of Ontario Assignment Sales advertised by Licensed Real
              Estate Agents.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AssignmentSaleContent;
