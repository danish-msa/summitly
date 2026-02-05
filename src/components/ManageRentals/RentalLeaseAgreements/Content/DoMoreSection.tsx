"use client";

import React from "react";
import Link from "next/link";
import { Search, PenLine, DollarSign, ArrowRight } from "lucide-react";

const CARDS = [
  {
    id: "screen",
    title: "Screen tenants",
    description:
      "Renter history, income verification, credit and background checks, free for landlords.",
    href: "/manage-rentals/tenant-screening",
    icon: Search,
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
  },
  {
    id: "lease",
    title: "Sign a lease",
    description:
      "Build a new lease online or upload your own for signing. Our lease tools make it simple.",
    href: "/manage-rentals/rental-lease-agreements",
    icon: PenLine,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "rent",
    title: "Collect rent",
    description:
      "Get paid for rent, utilities, move-in fees and more for free.",
    href: "/manage-rentals/dashboard/payments",
    icon: DollarSign,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

const DoMoreSection: React.FC = () => {
  return (
    <section
      className="py-12 sm:py-16 md:py-20 bg-white"
      aria-labelledby="do-more-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="do-more-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 text-center leading-tight mb-10 sm:mb-12"
        >
          Do more with Summitly
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {CARDS.map(({ id, title, description, href, icon: Icon, iconBg, iconColor }) => (
            <div
              key={id}
              className="rounded-2xl bg-white p-6 shadow-card transition-shadow flex flex-col"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg} ${iconColor} mb-4`}
                aria-hidden
              >
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{title}</h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed flex-1 mb-4">
                {description}
              </p>
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
              >
                Learn more
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoMoreSection;
