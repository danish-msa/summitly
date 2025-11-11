import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingBarProps {
  label: string;
  rating: number;
  className?: string;
}

const getRatingLevel = (rating: number): { color: string; label: string } => {
  if (rating >= 4.5) return { color: "bg-rating-excellent", label: "Excellent" };
  if (rating >= 4.0) return { color: "bg-rating-good", label: "Good" };
  if (rating >= 3.5) return { color: "bg-rating-average", label: "Average" };
  if (rating >= 3.0) return { color: "bg-rating-fair", label: "Fair" };
  return { color: "bg-rating-poor", label: "Poor" };
};

export const RatingBar = ({ label, rating, className }: RatingBarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { color, label: ratingLabel } = getRatingLevel(rating);
  const segments = 5;
  const filledSegments = Math.round((rating / 5) * segments);

  return (
    <div
      className={cn("relative flex flex-col", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-2 min-h-[3rem] flex flex-col justify-end">
        <span className="text-sm font-medium text-foreground mb-1">{label}</span>
        {isHovered && (
          <div className="flex items-center gap-1 text-xs font-medium text-foreground animate-in fade-in slide-in-from-top-2 duration-200">
            <Star className="w-3 h-3 fill-current" />
            <span>
              {rating.toFixed(2)} / {ratingLabel}
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300 ease-out",
              index < filledSegments ? "bg-blue-600" : "bg-gray-200",
              isHovered && index < filledSegments && "opacity-90"
            )}
          />
        ))}
      </div>
    </div>
  );
};

