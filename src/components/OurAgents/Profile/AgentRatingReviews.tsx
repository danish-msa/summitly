"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentRatingReviewsProps {
  /** Overall rating (0–5) */
  overallRating: number;
  /** Total number of reviews */
  totalReviewsCount: number;
  /** Optional class for the section wrapper */
  className?: string;
}

export function AgentRatingReviews({
  overallRating,
  totalReviewsCount,
  className = "",
}: AgentRatingReviewsProps) {
  const displayRating =
    totalReviewsCount > 0 ? Math.min(5, Math.max(0, overallRating)) : 0;
  const filledCount = Math.round(displayRating);

  return (
    <div className={cn(className)}>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Rating and Reviews
      </h2>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-sm text-muted-foreground">
          Overall rating:
        </span>
        <span className="text-lg font-semibold text-foreground tabular-nums">
          {totalReviewsCount > 0 ? displayRating.toFixed(1) : "0.0"}
        </span>
        <div
          className="flex items-center gap-0.5"
          role="img"
          aria-label={`${displayRating.toFixed(1)} out of 5 stars`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={
                i <= filledCount
                  ? "h-5 w-5 shrink-0 text-yellow-400 fill-yellow-400"
                  : "h-5 w-5 shrink-0 text-muted-foreground/30 fill-muted-foreground/20"
              }
              aria-hidden
            />
          ))}
        </div>
        {totalReviewsCount > 0 && (
          <span className="text-sm text-muted-foreground">
            ({totalReviewsCount} {totalReviewsCount === 1 ? "review" : "reviews"})
          </span>
        )}
      </div>
    </div>
  );
}
