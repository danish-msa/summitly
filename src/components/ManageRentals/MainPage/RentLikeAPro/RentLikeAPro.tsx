"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Home, FileText, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Home,
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-secondary",
    title: "Post listings & find renters quickly and easily",
    description:
      "Create listings in minutes to reach the most visitors of any rentals network*.",
    href: "#",
    learnMore: "Learn more",
  },
  {
    icon: FileText,
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#FFDB43]",
    title: "Create & send leases for signing",
    description:
      "Build a new lease online or upload your own for signing. Our lease tools make it simple.",
    href: "#",
    learnMore: "Learn more",
  },
  {
    icon: CalendarCheck,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#16A34A]",
    title: "Manage tours effortlessly",
    description:
      "Save time coordinating tours by letting renters know upfront when you're free.",
    href: "#",
    learnMore: "Learn more",
    isNew: true,
  },
];

const RentLikeAPro: React.FC = () => {
  return (
    <section
      className="container-1400 mx-auto bg-[#FDFBF7] py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="rent-like-a-pro-heading"
    >
      <div className="max-w-[1300px] mx-auto">
        {/* Banner strip */}
        <div className="mb-8 sm:mb-10 md:mb-14">
          <h2
            id="rent-like-a-pro-heading"
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4"
          >
            Rent like a pro with{" "}
            <span className="text-secondary">Rental Manager</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-zinc-700 max-w-2xl mb-4 sm:mb-6">
            Posting a listing is just the beginning. Build and sign leases,
            screen tenants, collect rent and fill vacancies with over 30 million
            monthly visitors.
          </p>
          <Button asChild variant="default" size="lg" className="rounded-lg">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              Get started for free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                variant="white"
                className="transition-shadow flex flex-col h-full"
              >
                <div className="relative mb-3 sm:mb-4">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${feature.iconBg} ${feature.iconColor}`}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                  </span>
                  {feature.isNew && (
                    <span className="absolute top-0 right-0 inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      New
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-1.5 sm:mb-2 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 flex-1 mb-3 sm:mb-4">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
                >
                  {feature.learnMore}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RentLikeAPro;
