import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ListRentalCtaSection() {
  return (
    <section className="bg-primary/20 py-12 md:py-16" aria-labelledby="list-rental-cta-heading">
      <div className="container-1400 mx-auto px-4 sm:px-6 text-center">
        <h2 id="list-rental-cta-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Want to list your rental for free in minutes?
        </h2>
        <Button
          asChild
          className="inline-flex items-center gap-1 hover:underline font-medium text-sm"
        >
          <Link href="/manage-rentals">
            List your rental
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
