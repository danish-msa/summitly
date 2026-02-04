"use client";

import React from "react";
import { FileText, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    id: "applications",
    icon: FileText,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    title: "Start accepting applications with ease",
    description:
      "View the renter's application and tenant screening reports all in one place including credit report, background check, eviction history and income documents.",
  },
  {
    id: "flexible",
    icon: Users,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Flexible, easy-to-manage applications",
    description:
      "Choose who applies to your rental and when. Enable applications to let anyone apply right from your listing, privately invite individual applicants, or do both.",
  },
  {
    id: "rely",
    icon: ShieldCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    title: "A tenant screening service you can rely on",
    description:
      "Get the information you need to feel confident about each applicant. Summitly partners with industry leaders to provide you with in-depth checks.",
  },
];

const SignRentersSection: React.FC = () => {
  return (
    <section
      className="bg-white"
      aria-labelledby="sign-renters-heading"
    >
      <div className="container-1400 mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2
            id="sign-renters-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-3"
          >
            Sign renters quickly and confidently
          </h2>
          <p className="text-zinc-600 text-base sm:text-lg">
            Summitly Rental Manager puts the most important information at your
            fingertips — so you can easily choose your next tenant.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8",
                  "shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)]"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    card.iconBg,
                    card.iconColor
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SignRentersSection;
