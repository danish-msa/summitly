import { Trees, Shield, Bus, Gamepad2, ShoppingBag, Church, Dumbbell, Utensils, MoreHorizontal } from "lucide-react";

interface CategoryIconProps {
  category: string;
  rating?: number;
}

export const CategoryIcon = ({ category, rating }: CategoryIconProps) => {
  const getIconAndColors = (category: string) => {
    // Neighborhood amenities
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
      // Lifestyle amenities
      case 'entertainment':
        return {
          icon: Gamepad2,
          bgColor: 'bg-purple-100',
          iconColor: 'text-purple-600',
          borderColor: 'border-purple-200'
        };
      case 'shopping':
        return {
          icon: ShoppingBag,
          bgColor: 'bg-orange-100',
          iconColor: 'text-orange-600',
          borderColor: 'border-orange-200'
        };
      case 'worship':
        return {
          icon: Church,
          bgColor: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          borderColor: 'border-indigo-200'
        };
      case 'sports':
        return {
          icon: Dumbbell,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      case 'food':
        return {
          icon: Utensils,
          bgColor: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200'
        };
      case 'miscellaneous':
        return {
          icon: MoreHorizontal,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
      default: // schools or unknown
        return {
          icon: null,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 4) return "bg-green-50";
    if (rating >= 3) return "bg-yellow-50";
    return "bg-red-50";
  };

  const { icon: Icon, bgColor, iconColor, borderColor } = getIconAndColors(category);

  // No rating and no icon - show N/A (for schools without rating)
  if (!rating && !Icon) {
    return (
      <div className="relative flex h-10 w-10 items-center justify-center">
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

  // Has icon but no rating (lifestyle amenities or transit/parks/safety without rating)
  if (!rating) {
    return (
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor} border-2 ${borderColor}`}>
        {Icon && <Icon className={`h-6 w-6 ${iconColor}`} />}
      </div>
    );
  }

  // Has rating - show circular progress indicator (for schools with rating)
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (rating / 5) * circumference;

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="h-12 w-12 transform -rotate-90" viewBox="0 0 36 36">
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
      <div className={`absolute flex h-8 w-8 items-center justify-center rounded-full ${getRatingBgColor(rating)} text-base font-bold ${getRatingColor(rating)}`}>
        {rating}
      </div>
    </div>
  );
};

