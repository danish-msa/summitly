"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TestimonialCardProps {
  /** Reviewer / client name */
  name: string;
  /** Optional subtitle (e.g. "First-time Homebuyer", "Real Estate Investor") */
  role?: string;
  /** Optional project or context (e.g. "Oakridge Residences") */
  project?: string;
  /** Optional avatar image URL */
  image?: string;
  /** Star rating 1–5 */
  rating: number;
  /** Quote / testimonial text */
  content: string;
  /** Optional class for the card wrapper */
  className?: string;
  /** Whether to show the decorative quote icon (default: true) */
  showQuoteIcon?: boolean;
}

export function TestimonialCard({
  name,
  role,
  project,
  image,
  rating,
  content,
  className,
  showQuoteIcon = true,
}: TestimonialCardProps) {
  const stars = Math.min(5, Math.max(0, Math.round(rating)));
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className={cn(
        "p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-0 rounded-3xl shadow-lg relative h-full",
        className
      )}
    >
      {showQuoteIcon && (
        <div className="absolute top-6 right-6 z-0" aria-hidden>
          <Quote
            className="w-10 h-10 text-secondary/20"
            strokeWidth={1}
            aria-hidden
          />
        </div>
      )}

      <div className="flex gap-1 mb-4 relative z-10" role="img" aria-label={`${stars} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-5 h-5",
              i < stars
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted-foreground/20 text-muted-foreground/20"
            )}
            aria-hidden
          />
        ))}
      </div>

      <p className="text-foreground mb-6 leading-relaxed relative z-10">
        {content}
        <span className="text-muted-foreground">&quot;</span>
      </p>

      <div className="flex items-center gap-4 relative z-10">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="bg-muted text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground">{name}</h4>
          {role != null && role !== "" && (
            <p className="text-sm text-muted-foreground">{role}</p>
          )}
          {project != null && project !== "" && (
            <p className="text-sm text-secondary font-medium mt-1">
              {project}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
