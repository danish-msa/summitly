'use client';

import React from 'react';

/**
 * Placeholder for "Rentals accepting online applications" from our rental manager section.
 * Pending: will show properties from our own system when wired.
 */
export default function RentalsAcceptingOnlineApplicationsSection() {
  return (
    <section className="bg-white py-12 md:py-16" aria-labelledby="rent-online-apps-heading">
      <div className="container-1400 mx-auto px-4 sm:px-6">
        <h2 id="rent-online-apps-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Rentals accepting online applications
        </h2>
        <div className="min-h-[280px] flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
          <p className="text-center px-4">Coming soon — rentals from our platform that accept online applications.</p>
        </div>
      </div>
    </section>
  );
}
