"use client";

import React, { useState } from "react";
import { Star, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AgentRatingReviewsProps {
  /** Overall rating (0–5) */
  overallRating: number;
  /** Total number of reviews */
  totalReviewsCount: number;
  /** Whether the agent allows new reviews; when false, hide or disable "Add Rating and Review" */
  allowReviews?: boolean;
  /** Agent ID for submitting reviews (required for Add Review form to work) */
  agentId?: string;
  /** Called after a review is successfully submitted (e.g. router.refresh) */
  onReviewSubmitted?: () => void;
  /** Optional class for the section wrapper */
  className?: string;
}

export function AgentRatingReviews({
  overallRating,
  totalReviewsCount,
  allowReviews = true,
  agentId,
  onReviewSubmitted,
  className = "",
}: AgentRatingReviewsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const displayRating =
    totalReviewsCount > 0 ? Math.min(5, Math.max(0, overallRating)) : 0;
  const filledCount = Math.round(displayRating);

  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setModalOpen(false);
    setStatus("idle");
    setErrorMessage("");
    setReviewerName("");
    setRating(0);
    setHoverRating(0);
    setReviewText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId || rating < 1 || rating > 5) return;
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch(`/api/agents/${agentId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_name: reviewerName.trim(),
          rating,
          review_text: reviewText.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to submit review");
        setStatus("error");
        return;
      }
      setStatus("sent");
      onReviewSubmitted?.();
      setTimeout(closeModal, 1500);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Rating and Reviews
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        </div>
        {allowReviews && (
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Add rating and review"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Add Rating and Review
          </button>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rating and Review</DialogTitle>
            <DialogDescription>
              Share your experience. Your review will be visible on this
              agent&apos;s profile.
            </DialogDescription>
          </DialogHeader>
          {status === "sent" ? (
            <p className="text-sm text-green-600 font-medium py-4">
              Thank you! Your review has been submitted.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="review-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Your name
                </label>
                <input
                  id="review-name"
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-foreground mb-2">
                  Rating
                </span>
                <div
                  className="flex gap-1"
                  role="group"
                  aria-label="Rate 1 to 5 stars"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={cn(
                        "p-1 rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        (hoverRating || rating) >= value
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30 fill-muted-foreground/20"
                      )}
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    >
                      <Star className="h-8 w-8" aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="review-text"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Your review
                </label>
                <textarea
                  id="review-text"
                  required
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell others about your experience..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              {status === "error" && errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={status === "sending"}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={status === "sending" || rating < 1 || rating > 5}
                >
                  {status === "sending" ? "Submitting…" : "Submit Review"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
