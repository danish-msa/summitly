import { TrendingUp, Bed, UtensilsCrossed, Sofa } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingBarProps {
  label: string;
  rating: number;
  className?: string;
}

const getRatingConfig = (label: string, _rating: number) => {
  const configs: Record<string, { icon: typeof TrendingUp; bgColor: string; iconColor: string; barColor: string; textColor: string }> = {
    "Overall": {
      icon: TrendingUp,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      barColor: "bg-blue-600",
      textColor: "text-blue-600"
    },
    "Bedroom": {
      icon: Bed,
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600",
      barColor: "bg-gray-300",
      textColor: "text-gray-500"
    },
    "Kitchen": {
      icon: UtensilsCrossed,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      barColor: "bg-green-600",
      textColor: "text-green-600"
    },
    "Living Room": {
      icon: Sofa,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      barColor: "bg-purple-600",
      textColor: "text-purple-600"
    }
  };

  return configs[label] || configs["Overall"];
};

const getRatingLevel = (rating: number): { label: string; showLabel: boolean } => {
  if (rating >= 4.5) return { label: "Excellent", showLabel: true };
  if (rating >= 4.0) return { label: "Good", showLabel: false };
  if (rating >= 3.5) return { label: "Average", showLabel: false };
  if (rating >= 3.0) return { label: "Fair", showLabel: false };
  return { label: "Poor", showLabel: true };
};

export const RatingBar = ({ label, rating, className }: RatingBarProps) => {
  const config = getRatingConfig(label, rating);
  const Icon = config.icon;
  const { label: ratingLabel, showLabel } = getRatingLevel(rating);
  const segments = 5;
  const filledSegments = Math.round((rating / 5) * segments);

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl border border-gray-200 p-4 flex flex-col",
        className
      )}
    >
      {/* Header with Title and Icon */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.iconColor)} />
        </div>
      </div>

      {/* Rating Bars */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: segments }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-300",
              index < filledSegments ? config.barColor : "bg-gray-200"
            )}
          />
        ))}
      </div>

      {/* Score and Label */}
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-gray-900">
          {rating.toFixed(1)}
        </span>
        {showLabel && (
          <span className={cn("text-xs font-medium", config.textColor)}>
            {ratingLabel}
          </span>
        )}
      </div>
    </div>
  );
};

