"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface FindRealtorHeroProps {
  onUserTypeSelect: (type: "buyer" | "seller" | "both") => void;
}

type SearchMode = "agent" | "location";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "all";
}

function buildSearchResultsUrl(
  searchMode: SearchMode,
  searchQuery: string,
  intent: "buyer" | "seller" | "both"
): string {
  const intentSegment =
    intent === "buyer" ? "intent-buy" : intent === "seller" ? "intent-sell" : "intent-both";
  const base = "/find-an-agent";
  const sort = "sort-relevantagents";
  const agentType = "agenttype-all";
  const page = "pg-1";

  if (searchMode === "agent") {
    const slug = searchQuery.trim() ? slugify(searchQuery) : "all";
    const searchSegment = `agentname-${slug}`;
    return `${base}/${searchSegment}/${intentSegment}/${sort}/${agentType}/${page}`;
  }

  // Location: use zipcode if 5 digits, else slugify the query (e.g. address or city)
  const trimmed = searchQuery.trim();
  const isZip = /^\d{5}$/.test(trimmed);
  const locationSegment = isZip ? trimmed : trimmed ? slugify(trimmed) : "all";
  return `${base}/${locationSegment}/${intentSegment}/${sort}/${agentType}/${page}`;
}

const FindRealtorHero: React.FC<FindRealtorHeroProps> = ({ onUserTypeSelect }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"buyer" | "seller" | "both">("buyer");
  const [searchMode, setSearchMode] = useState<SearchMode>("agent");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    const url = buildSearchResultsUrl(searchMode, searchQuery, activeTab);
    router.push(url);
  };

  const searchPlaceholder =
    searchMode === "agent" ? "Agent name" : "City or Zip";

  return (
    <div className="w-full flex flex-col justify-center items-center mt-16 py-12 sm:py-16 md:py-20 lg:py-24 bg-[url('/images/banner2.webp')] bg-cover bg-center relative mx-auto">
      <div className="absolute inset-0 bg-black bg-opacity-50" aria-hidden />
      <div className="flex flex-col items-center justify-center w-[90%] sm:w-[85%] md:max-w-3xl relative">
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

        {/* Search card */}
        <div className="w-full mt-8 px-3 sm:px-4 pb-4 pt-3 backdrop-blur-sm bg-white rounded-2xl shadow-2xl border border-gray-100">
          {/* Toggle: Buy | Sell | Both */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
            {(["buyer", "seller", "both"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2 text-sm md:text-base font-medium border-none cursor-pointer rounded-lg transition-all duration-200 min-w-0 flex-shrink-0 ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary bg-primary/5 rounded-b-none"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 bg-transparent"
                }`}
              >
                {tab === "buyer" ? "Buy" : tab === "seller" ? "Sell" : "Both"}
              </button>
            ))}
          </div>

          {/* One line: [Selector] [Input] [Search button] - same height for all */}
          <div className="flex flex-row items-stretch w-full rounded-xl border border-zinc-300 bg-white overflow-hidden shadow-sm">
            <Select
              value={searchMode}
              onValueChange={(v) => setSearchMode(v as SearchMode)}
            >
              <SelectTrigger
                className="h-12 min-h-[3rem] w-[8.5rem] shrink-0 rounded-none rounded-l-xl border-0 border-r border-zinc-200 bg-white shadow-none focus:ring-2 focus:ring-inset focus:ring-primary/30"
                aria-label="Search by Agent or Location"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 min-w-0 !h-12 min-h-[3rem] rounded-none border-0 border-r border-zinc-200 shadow-none bg-white placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 px-4 py-0 text-base box-border"
              aria-label={searchPlaceholder}
            />
            <Button
              type="button"
              variant="default"
              className="h-12 shrink-0 rounded-none rounded-r-xl px-6 gap-2 font-semibold"
              onClick={handleSearch}
              aria-label="Search"
            >
              <Search className="w-4 h-4" aria-hidden />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindRealtorHero;
