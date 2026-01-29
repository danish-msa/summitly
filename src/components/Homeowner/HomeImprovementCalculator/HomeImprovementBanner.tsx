"use client";

import React from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface HomeImprovementBannerProps {
  /** Current or potential home value to display */
  homeValue?: number;
}

export default function HomeImprovementBanner({
  homeValue = 275207,
}: HomeImprovementBannerProps) {
  return (
    <section
      className="relative min-h-[320px] sm:min-h-[380px] flex flex-col justify-center px-4 sm:px-6 lg:px-8 mt-16"
      aria-label="Home improvement calculator banner"
    >
      {/* Background: image with dark overlay, or gradient fallback */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-gray-800"
          style={{
            backgroundImage: "url('/images/home-improvement-banner.png')",
          }}
        />
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-b from-gray-800/70 to-gray-900/80"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 container-1400 mx-auto w-full px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
          Home improvement
          <br />
          calculator
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white/95 max-w-xl">
          Your home value has the potential to reach{" "}
          <span className="font-bold text-secondary">
            {formatCurrency(homeValue)}
          </span>
        </p>
      </div>
    </section>
  );
}
