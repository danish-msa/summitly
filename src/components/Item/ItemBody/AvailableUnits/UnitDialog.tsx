import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bed, Bath, Maximize2, Calendar } from "lucide-react";
import { Unit } from "./AvailableUnits";
import { EstimateCalculator } from "./EstimateCalculator";
import { ContactProperty } from "./ContactProperty";

interface UnitDialogProps {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allUnits: Unit[];
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

export function UnitDialog({ unit, open, onOpenChange, allUnits }: UnitDialogProps) {
  if (!unit) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">Unit {unit.id}</span>
            <Badge className="bg-green-600 text-white">Available</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Left Column - Information */}
          <div className="space-y-6 lg:pr-4">
            {/* Basic Info */}
            <div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-primary">
                  ${unit.price.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{unit.sqft} sqft</span>
                </div>
                {unit.beds > 0 && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{unit.beds} bedroom{unit.beds > 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{unit.baths} bathroom{unit.baths > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Available {formatDate(unit.availableDate)}</span>
                </div>
              </div>
            </div>
            <Separator />
            {/* About the Unit */}
            <div>
              <h3 className="text-xl font-semibold mb-3">About the Unit</h3>
              <p className="text-muted-foreground leading-relaxed">{unit.about}</p>
            </div>
            <Separator />
            {/* Lease Terms */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Lease Terms</h3>
              <ul className="space-y-2">
                {unit.leaseTerms.map((term, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{term}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            {/* Estimate Calculator */}
            <EstimateCalculator allUnits={allUnits} selectedUnit={unit} />
            <Separator />
            {/* Contact Property */}
            <ContactProperty />
          </div>
          {/* Right Column - Images (Sticky) */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div>
              <h3 className="text-xl font-semibold mb-3">Floor Plan</h3>
              <div className="rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFloorPlanImage(unit.floorPlan)}
                  alt={`Unit ${unit.id} floor plan`}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

