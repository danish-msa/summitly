import { Footprints, Car, Navigation } from "lucide-react";
import { Amenity } from './types';
import { CategoryIcon } from './CategoryIcon';

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

  return (
    <div
      className="flex items-center gap-4 rounded-xl bg-[#F9F9FA] py-2 px-4 transition-shadow hover:bg-[#f2f2f3] cursor-pointer"
      onClick={onClick}
    >
      <CategoryIcon category={categoryId} rating={amenity.rating} />

      <div className="flex-1">
        <h3 className="text-lg font-semibold">{amenity.name}</h3>
        <p className="text-sm text-gray-600">{amenity.type}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Footprints className="h-4 w-4" />
          <span>{amenity.walkTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Car className="h-4 w-4" />
          <span>{amenity.driveTime}</span>
        </div>
        <span>{amenity.distance}</span>
        {shouldShowDirections && (
          <a
            href={directionsUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
            title="Get directions"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
};

