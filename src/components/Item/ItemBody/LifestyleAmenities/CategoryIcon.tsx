import { Gamepad2, ShoppingBag, Church, Dumbbell, Utensils, MoreHorizontal } from "lucide-react";

interface CategoryIconProps {
  category: string;
}

export const CategoryIcon = ({ category }: CategoryIconProps) => {
  const getIconAndColors = (category: string) => {
    switch (category) {
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
      default:
        return {
          icon: MoreHorizontal,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
    }
  };

  const { icon: Icon, bgColor, iconColor, borderColor } = getIconAndColors(category);

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bgColor} border-2 ${borderColor}`}>
      {Icon && <Icon className={`h-8 w-8 ${iconColor}`} />}
    </div>
  );
};

