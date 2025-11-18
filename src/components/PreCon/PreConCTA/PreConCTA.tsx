import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Home } from 'lucide-react';
import Link from 'next/link';

const PreConCTA = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Info Section */}
        <div className="bg-gradient-to-r from-brand-celestial/40 via-green-50/50 to-purple-50 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Pre-Construction Benefits
            </div>

            {/* Heading */}
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Pre-Construction?
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg mb-8 leading-relaxed">
              Investing in pre-construction properties offers flexible payment structures, 
              modern designs, and potential appreciation before completion. 
              Register your interest today to secure the best units.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center p-4 bg-orange-50 rounded-xl backdrop-blur-sm border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Flexible Payments</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Structured payment plans spread over construction timeline
                </p>
              </div>

              <div className="flex flex-col items-center p-4 bg-brand-celestial/20 rounded-xl backdrop-blur-sm border border-border/50">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Potential Appreciation</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Value growth potential before completion
                </p>
              </div>

              <div className="flex flex-col items-center p-4 bg-purple-50 rounded-xl backdrop-blur-sm border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Modern Designs</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Latest amenities and contemporary layouts
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <Link href="/pre-construction/projects">
              <Button 
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8 py-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-base"
              >
                Explore Pre-Construction Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreConCTA;

