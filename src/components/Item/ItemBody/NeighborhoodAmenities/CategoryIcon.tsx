import { Trees, Shield, Bus } from "lucide-react";

interface CategoryIconProps {
  category: string;
  rating?: number;
}

export const CategoryIcon = ({ category, rating }: CategoryIconProps) => {
  const getIconAndColors = (category: string) => {
    switch (category) {
      case 'parks':
        return {
          icon: Trees,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'safety':
        return {
          icon: Shield,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      case 'transit':
        return {
          icon: Bus,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
      default: // schools
        return {
          icon: null,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 7) return "text-green-500";
    if (rating >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 7) return "bg-green-50";
    if (rating >= 5) return "bg-yellow-50";
    return "bg-red-50";
  };

  const { icon: Icon, bgColor, iconColor, borderColor } = getIconAndColors(category);

  // No rating and no icon - show N/A
  if (!rating && !Icon) {
    return (
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg className="h-16 w-16 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className={`absolute flex h-12 w-12 items-center justify-center rounded-full ${bgColor} border-2 ${borderColor}`}>
          <span className="text-sm font-medium text-gray-500">N/A</span>
        </div>
      </div>
    );
  }

  // Has icon but no rating
  if (!rating) {
    return (
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bgColor} border-2 ${borderColor}`}>
        {Icon && <Icon className={`h-8 w-8 ${iconColor}`} />}
      </div>
    );
  }

  // Has rating - show circular progress indicator
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (rating / 10) * circumference;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-16 w-16 transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-gray-200"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className={getRatingColor(rating)}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      <div className={`absolute flex h-12 w-12 items-center justify-center rounded-full ${getRatingBgColor(rating)} text-lg font-bold ${getRatingColor(rating)}`}>
        {rating}
      </div>
    </div>
  );
};

