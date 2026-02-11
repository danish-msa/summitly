import { Card, CardContent } from "@/components/ui/card";
import { Unit } from "./AvailableUnits";

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

// Floor plan images mapping
const getFloorPlanImage = (floorPlan: string): string => {
  const imageMap: Record<string, string> = {
    studio: '/images/floorplan/floorplan-studio.jpg',
    '1bed': '/images/floorplan/floorplan-1bed.jpg',
    '2bed': '/images/floorplan/floorplan-2bed.jpg',
  };
  
  return imageMap[floorPlan] || '/images/floorplan/floorplan-studio.jpg';
};

export function UnitCard({ unit, onClick }: UnitCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format unit type for display
  const getUnitTypeLabel = () => {
    if (unit.type === 'studio') return 'Studio';
    if (unit.type === '1bed') return '1 bed';
    if (unit.type === '2bed') return '2 bed';
    return unit.type;
  };

  // Format bathroom label
  const getBathLabel = () => {
    return unit.baths === 1 ? '1ba' : `${unit.baths}ba`;
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-md group border"
      onClick={onClick}
    >
      <div className="flex flex-row">
        {/* Image Section */}
        <div className="relative w-32 sm:w-36 flex-shrink-0 overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFloorPlanImage(unit.floorPlan)}
            alt={`Unit ${unit.id} floor plan`}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Section */}
        <CardContent className="p-5 flex-1 flex flex-col justify-center">
          <div className="space-y-1.5">
            {/* Price */}
            <div>
              <span className="text-3xl font-bold text-foreground">
                ${unit.price.toLocaleString()}
              </span>
            </div>
            
            {/* Details with dots separator */}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{getUnitTypeLabel()}</span>
              <span className="mx-1.5">·</span>
              <span>{getBathLabel()}</span>
              <span className="mx-1.5">·</span>
              <span>{unit.sqft} sqft</span>
            </div>
            
            {/* Availability */}
            <div className="text-sm text-muted-foreground">
              Available {formatDate(unit.availableDate)}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

