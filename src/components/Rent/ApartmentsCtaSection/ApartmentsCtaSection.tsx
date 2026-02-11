import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFAULT_AREA_TITLE = 'Austin, TX';

export interface ApartmentsCtaSectionProps {
  /** Area title shown below the CTA (e.g. "Explore Austin, TX") */
  areaTitle?: string;
}

export default function ApartmentsCtaSection({ areaTitle = DEFAULT_AREA_TITLE }: ApartmentsCtaSectionProps) {
  return (
    <section className="bg-primary/20 py-12 md:py-16" aria-labelledby="apartments-cta-heading">
      <div className="container-1400 mx-auto px-4 sm:px-6 text-center">
        <h2 id="apartments-cta-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Looking for apartments for rent in your area?
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mb-6">
          Find apartments near you
        </p>
        <p className="text-lg md:text-xl font-semibold text-foreground mb-6">
          Explore {areaTitle}
        </p>
        <Button
          asChild
          className="inline-flex items-center gap-1 hover:underline font-medium text-sm"
        >
          <Link href="/listings?listingType=rent">
            View rental listings
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
