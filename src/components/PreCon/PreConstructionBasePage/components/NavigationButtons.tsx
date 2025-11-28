import React from 'react';
import Link from 'next/link';
import { TrendingUp, Home } from 'lucide-react';
import type { PageType } from '../types';

interface NavigationButtonsProps {
  pageType: PageType;
  slug: string;
  displayTitle: string;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({ 
  pageType, 
  slug, 
  displayTitle 
}) => {
  if (pageType !== 'by-location') return null;

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/${slug}/trends`}
          className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Market Trends
            </h3>
            <p className="text-sm text-muted-foreground">
              Explore housing market statistics and price trends for {displayTitle}
            </p>
          </div>
        </Link>

        <Link
          href={`/${slug}/neighbourhoods`}
          className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Neighbourhoods
            </h3>
            <p className="text-sm text-muted-foreground">
              Discover different neighbourhoods and areas in {displayTitle}
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
};

