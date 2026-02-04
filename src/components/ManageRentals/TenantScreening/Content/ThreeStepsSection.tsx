"use client";

import React from "react";
import { Mail, FileSearch, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "1",
    step: "Step 1",
    icon: Mail,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    title: "Accept applications",
    description:
      "You can enable renters to apply directly to your listing, or you can share a private application link with them.",
  },
  {
    id: "2",
    step: "Step 2",
    icon: FileSearch,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    title: "Review screening report",
    description:
      "You receive a complete application with tenant screening reports, including credit and background check, eviction history, and income documents.",
  },
  {
    id: "3",
    step: "Step 3",
    icon: Key,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Fill your vacancy",
    description:
      "You get alerted when an application is ready to review — and can accept it in one click.",
  },
];

const ThreeStepsSection: React.FC = () => {
  return (
    <section
      className="bg-slate-50/80"
      aria-labelledby="three-steps-heading"
    >
      <div className="container-1400 mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <h2
          id="three-steps-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 text-center leading-tight mb-10 sm:mb-14"
        >
          Accept, review and approve applications in minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative">
          {/* Dashed connector line - visible on md+ */}
          <div
            className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-slate-200"
            aria-hidden
          />
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative text-center">
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mx-auto  mb-4 shadow-sm",
                    item.iconBg,
                    item.iconColor
                  )}
                >
                  <Icon className="h-7 w-7" aria-hidden />
                </div>
                <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-zinc-600 mb-2">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ThreeStepsSection;
