"use client";

import React from "react";
import { Shield, SlidersHorizontal, PenLine, BookOpen } from "lucide-react";

const CARDS = [
  {
    id: "protect",
    title: "Protect yourself & your property",
    description:
      "Our lease agreement templates are created in partnership with law firms versed in local law.",
    icon: Shield,
  },
  {
    id: "customize",
    title: "Your lease, your way",
    description:
      "Easily customize the rental lease for your needs, or upload your own.",
    icon: SlidersHorizontal,
  },
  {
    id: "esign",
    title: "Electronic lease signing",
    description:
      "Send your online lease agreement to renters and skip the in-person meeting.",
    icon: PenLine,
  },
  {
    id: "guidance",
    title: "In-product guidance",
    description:
      "Building, updating, signing, storing — we'll guide you through it all.",
    icon: BookOpen,
  },
];

const EverythingYouNeedSection: React.FC = () => {
  return (
    <section
      className="bg-white py-12 sm:py-16 md:py-20"
      aria-labelledby="everything-you-need-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="everything-you-need-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 text-center leading-tight mb-10 sm:mb-12"
        >
          Everything you need to confidently manage your rental lease
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {CARDS.map(({ id, title, description, icon: Icon }) => (
            <div
              key={id}
              className="rounded-2xl bg-white p-6 shadow-card transition-shadow"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary mb-4"
                aria-hidden
              >
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{title}</h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EverythingYouNeedSection;
