import { Clock, Car, MapPin, Star, Navigation } from "lucide-react";
import { Amenity } from './types';

interface AmenityCardProps {
  amenity: Amenity;
  categoryId: string;
  showDirections?: boolean;
  onClick?: () => void;
}

export const AmenityCard = ({ amenity, categoryId, showDirections = false, onClick }: AmenityCardProps) => {
  // Generate Google Directions URL
  const getDirectionsUrl = () => {
    if (amenity.latitude && amenity.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${amenity.latitude},${amenity.longitude}`;
    }
    return null;
  };

  const directionsUrl = getDirectionsUrl();
  const shouldShowDirections = showDirections && categoryId === 'transit' && directionsUrl;

  // Format category name for display
  const formatCategoryName = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div
      className="relative rounded-lg sm:rounded-xl bg-white p-3 sm:p-4 transition-shadow cursor-pointer border border-gray-200 min-w-0"
      onClick={onClick}
    >
      {/* Top Section */}
      <div className="mb-2 sm:mb-3">
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1.5 sm:mb-2">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex-1 min-w-0 leading-tight truncate">
            {amenity.name}
          </h3>
          {amenity.rating && (
            <div className="flex items-center gap-1 bg-yellow-50 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 flex-shrink-0">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-500 text-yellow-500" aria-hidden />
              <span className="text-xs sm:text-sm font-bold text-gray-900">{amenity.rating}</span>
            </div>
          )}
        </div>
        <div className="inline-block bg-gray-100 rounded-md px-2 py-0.5">
          <span className="text-[10px] sm:text-xs text-gray-600 font-medium">
            {formatCategoryName(categoryId)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-2 sm:my-3" />

      {/* Bottom Section - Transportation Details */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Walk Time */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-secondary/10 rounded-md sm:rounded-lg p-1.5 sm:p-2 flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" aria-hidden />
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[10px] sm:text-xs text-gray-600">Walk</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{amenity.walkTime}</span>
          </div>
        </div>

        {/* Drive Time */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-green-50 rounded-md sm:rounded-lg p-1.5 sm:p-2 flex-shrink-0">
            <Car className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" aria-hidden />
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[10px] sm:text-xs text-gray-600">Drive</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{amenity.driveTime}</span>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-purple-50 rounded-md sm:rounded-lg p-1.5 sm:p-2 flex-shrink-0">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" aria-hidden />
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[10px] sm:text-xs text-gray-600">Distance</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{amenity.distance}</span>
          </div>
        </div>
      </div>

      {/* Directions Link (if applicable) */}
      {shouldShowDirections && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
          <a
            href={directionsUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-xs sm:text-sm"
            title="Get directions"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden />
            <span>Get Directions</span>
          </a>
        </div>
      )}
    </div>
  );
};

