import { Footprints, Car } from "lucide-react";
import { Amenity } from './types';
import { CategoryIcon } from './CategoryIcon';

interface AmenityCardProps {
  amenity: Amenity;
  categoryId: string;
}

export const AmenityCard = ({ amenity, categoryId }: AmenityCardProps) => {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md">
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
        <span className="text-gray-300">•</span>
        <div className="flex items-center gap-1.5">
          <Car className="h-4 w-4" />
          <span>{amenity.driveTime}</span>
        </div>
        <span className="text-gray-300">•</span>
        <span>{amenity.distance}</span>
      </div>
    </div>
  );
};

