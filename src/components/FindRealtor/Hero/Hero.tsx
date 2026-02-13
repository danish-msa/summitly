"use client";

import React from "react";
import { useRouter } from "next/navigation";
import GlobalAgentSearch from "@/components/common/GlobalAgentSearch";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "all";
}

function buildAgentSearchUrl(searchQuery: string): string {
  const base = "/find-an-agent";
  const slug = searchQuery.trim() ? slugify(searchQuery) : "all";
  const searchSegment = `agentname-${slug}`;
  const intentSegment = "intent-both";
  const sort = "sort-relevantagents";
  const agentType = "agenttype-all";
  const page = "pg-1";
  return `${base}/${searchSegment}/${intentSegment}/${sort}/${agentType}/${page}`;
}

const FindRealtorHero: React.FC = () => {
  const router = useRouter();

  const handleSubmit = (query: string) => {
    router.push(buildAgentSearchUrl(query));
  };

  return (
    <div className="w-full flex flex-col justify-center items-center mt-16 py-12 sm:py-16 md:py-20 lg:py-24 bg-[url('/images/banner2.webp')] bg-cover bg-center relative mx-auto">
      <div className="absolute inset-0 bg-black bg-opacity-50" aria-hidden />
      <div className="flex flex-col items-center justify-center w-[95%] sm:w-[90%] md:w-[70%] lg:w-[60%] relative z-10">
        <h1 className="capitalize text-2xl md:text-4xl leading-snug font-normal text-center text-white w-full md:w-[75%]">
          Find the Right REALTOR® for you
        </h1>
        <h2 className="text-sm sm:text-base md:text-lg mt-4 font-normal my-4 text-white/90 text-center">
          Find out how much your home is worth in today&apos;s market!
        </h2>
        <p className="leading-relaxed text-center text-white/85 text-sm sm:text-base max-w-2xl">
          With more than 500 real estate transactions and thousands of offers
          submitted, our agents know your local market. It&apos;s free and there
          is no obligation!
        </p>

        <div className="relative w-full max-w-2xl px-2 mt-8">
          <GlobalAgentSearch
            placeholder="Search by agent name"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default FindRealtorHero;
