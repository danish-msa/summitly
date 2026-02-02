import React from "react";

export default function OurAgentsBanner() {
  return (
    <section
      className="w-full bg-[#0d3b4c] text-white py-16 sm:py-20 md:py-24 mt-16"
      aria-labelledby="agents-heading"
    >
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1
          id="agents-heading"
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
        >
          Meet Our Elite Agents
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#7eb8c9] max-w-2xl mx-auto">
          Exceptional properties require exceptional representation. Find the
          perfect partner for your real estate journey.
        </p>
      </div>
    </section>
  );
}
