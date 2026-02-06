import React from "react";
import Link from "next/link";
import { TrendingUp, Home } from "lucide-react";
import type { PropertyPageType } from "../types";

interface NavigationButtonsProps {
  pageType: PropertyPageType;
  slug: string;
  displayTitle: string;
}

const LISTINGS_BASE = "/listings";

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  pageType,
  slug,
  displayTitle,
}) => {
  if (pageType !== "by-location") return null;

  const basePath = `${LISTINGS_BASE}/${slug}`;

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`${basePath}/trends`}
          className="group flex items-center gap-4 p-6 border border-primary/20 rounded-xl bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 hover:from-blue-50 hover:via-white hover:to-blue-50/50 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200/80 group-hover:from-blue-200 group-hover:to-blue-300/80 transition-all duration-300 shadow-sm group-hover:shadow-md">
            <TrendingUp className="h-7 w-7 text-blue-600 group-hover:text-blue-700 transition-colors" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-blue-700 transition-colors">
              Market Trends
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore housing market statistics and price trends for {displayTitle}
            </p>
          </div>
        </Link>

        <Link
          href={`${basePath}/neighbourhoods`}
          className="group flex items-center gap-4 p-6 border border-primary/20 rounded-xl bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 hover:from-emerald-50 hover:via-white hover:to-emerald-50/50 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200/80 group-hover:from-emerald-200 group-hover:to-emerald-300/80 transition-all duration-300 shadow-sm group-hover:shadow-md">
            <Home className="h-7 w-7 text-emerald-600 group-hover:text-emerald-700 transition-colors" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-emerald-700 transition-colors">
              Neighbourhoods
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover different neighbourhoods and areas in {displayTitle}
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
};
