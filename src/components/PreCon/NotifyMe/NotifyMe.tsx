"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Mail } from 'lucide-react';

const NotifyMe: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail('');

    // Reset success message after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Notify Me of New Projects
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-2">
            Send me information about new projects that are launching or selling
          </p>

          {/* Community CTA */}
          <p className="text-base text-muted-foreground mb-8">
            Join Summitly community of <span className="font-bold text-foreground">500,000+</span> Buyers & Investors today!
          </p>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base bg-white border-border/50 focus:border-primary"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="h-12 px-8 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-full whitespace-nowrap"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : isSubmitted ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Subscribed!
                  </>
                ) : (
                  'Notify me'
                )}
              </Button>
            </div>
          </form>

          {/* Privacy Assurances */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>No spam, ever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Unsubscribe anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotifyMe;

