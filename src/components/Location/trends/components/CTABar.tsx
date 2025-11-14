"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

export const CTABar: React.FC = () => {
  return (
    <section className="py-6">
      <div className="container-1400 mx-auto px-4">
        <div className="rounded-lg bg-gradient-to-r from-brand-celestial/40 to-brand-cb-blue/10 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-1">
                Have any questions?
              </h3>
              <p className="text-sm text-muted-foreground">
                Our real estate experts are here to help you understand the market trends.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
              <Button size="default" className="w-full sm:w-auto">
                Contact Us
              </Button>
              <Button size="default" variant="outline" className="w-full sm:w-auto">
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

