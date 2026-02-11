"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const GTA_AREAS = [
  { label: "All", value: "" },
  { label: "Downtown", value: "Toronto" },
  { label: "North York", value: "North York" },
  { label: "Etobicoke", value: "Etobicoke" },
  { label: "Scarborough", value: "Scarborough" },
  { label: "Markham", value: "Markham" },
  { label: "Richmond Hill", value: "Richmond Hill" },
  { label: "Aurora", value: "Aurora" },
  { label: "Stouffville", value: "Stouffville" },
  { label: "Vaughan", value: "Vaughan" },
  { label: "Mississauga", value: "Mississauga" },
  { label: "Oakville", value: "Oakville" },
  { label: "Milton", value: "Milton" },
  { label: "Brampton", value: "Brampton" },
  { label: "Ajax", value: "Ajax" },
  { label: "Pickering", value: "Pickering" },
];

const AssignmentsBanner: React.FC = () => {
  const searchParams = useSearchParams();
  const currentCity = (searchParams && searchParams.get("city")) || "";

  return (
    <section
      className="w-full bg-white border-b border-slate-200/80 sm:mt-16 pt-16 sm:pt-16 pb-8"
      aria-labelledby="assignments-banner-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hot Deals tag */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-medium mb-4"
          aria-hidden
        >
          <Flame className="w-4 h-4 text-rose-500" aria-hidden />
          Hot Deals
        </span>

        <h1
          id="assignments-banner-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-3"
        >
          Assignment Deals in GTA
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mb-6">
          Browse top price reduced assignments across the Greater Toronto Area.
          Find exclusive pre-construction opportunities before they hit the open
          market.
        </p>

        {/* Location filter buttons - horizontal scroll */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          <div className="flex gap-2 min-w-max sm:flex-wrap sm:min-w-0">
            {GTA_AREAS.map((area) => {
              const isActive =
                (area.value === "" && !currentCity) ||
                (area.value !== "" && currentCity === area.value);
              const href =
                area.value === ""
                  ? "/assignments"
                  : `/assignments?city=${encodeURIComponent(area.value)}`;
              return (
                <Link
                  key={area.value || "all"}
                  href={href}
                  className={cn(
                    "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "bg-slate-100 text-zinc-700 hover:bg-slate-200"
                  )}
                >
                  {area.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AssignmentsBanner;
