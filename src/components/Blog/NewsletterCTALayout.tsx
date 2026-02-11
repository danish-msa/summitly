"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewsletterCTALayoutProps {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  placeholder?: string;
  onSubmit?: (email: string) => void;
}

export default function NewsletterCTALayout({
  title = "Get real estate news sent to your inbox",
  subtitle = "Stay ahead with market insights, tips, and the latest listings.",
  buttonLabel = "Subscribe",
  placeholder = "Enter your email",
  onSubmit,
}: NewsletterCTALayoutProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(email);
    } else {
      setEmail("");
    }
  };

  return (
    <section
      className="mx-auto max-w-[1400px] border-t border-zinc-200 px-4 py-12 md:px-8 md:py-16"
      aria-labelledby="newsletter-cta-heading"
    >
      <div className="mx-auto max-w-xl text-center">
        <h2
          id="newsletter-cta-heading"
          className="text-2xl font-bold text-zinc-900 md:text-3xl"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-zinc-600 md:text-base">{subtitle}</p>
        )}
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="h-11 min-w-0 flex-1 border-zinc-300 bg-white sm:max-w-xs"
            autoComplete="email"
          />
          <Button type="submit" className="h-11 shrink-0 px-6" size="lg">
            {buttonLabel}
          </Button>
        </form>
      </div>
    </section>
  );
}
