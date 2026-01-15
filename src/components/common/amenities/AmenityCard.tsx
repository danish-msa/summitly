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
      className="relative rounded-xl bg-white p-4  transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      {/* Top Section */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex-1 leading-tight">
            {amenity.name}
          </h3>
          {amenity.rating && (
            <div className="flex items-center gap-1 bg-yellow-50 rounded-lg px-2 py-1 flex-shrink-0">
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-bold text-gray-900">{amenity.rating}</span>
            </div>
          )}
        </div>
        <div className="inline-block bg-gray-100 rounded-md px-2 py-0.5">
          <span className="text-xs text-gray-600 font-medium">
            {formatCategoryName(categoryId)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3" />

      {/* Bottom Section - Transportation Details */}
      <div className="grid grid-cols-3 gap-4">
        {/* Walk Time */}
        <div className="flex items-center gap-3">
          <div className="bg-secondary/10 rounded-lg p-2 flex-shrink-0">
            <Clock className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-600">Walk</span>
            <span className="text-sm font-semibold text-gray-900">{amenity.walkTime}</span>
          </div>
        </div>

        {/* Drive Time */}
        <div className="flex items-center gap-3">
          <div className="bg-green-50 rounded-lg p-2 flex-shrink-0">
            <Car className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-600">Drive</span>
            <span className="text-sm font-semibold text-gray-900">{amenity.driveTime}</span>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 rounded-lg p-2 flex-shrink-0">
            <MapPin className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-600">Distance</span>
            <span className="text-sm font-semibold text-gray-900">{amenity.distance}</span>
          </div>
        </div>
      </div>

      {/* Directions Link (if applicable) */}
      {shouldShowDirections && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a
            href={directionsUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-sm"
            title="Get directions"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="h-4 w-4" />
            <span>Get Directions</span>
          </a>
        </div>
      )}
    </div>
  );
};

