import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitCard } from "./UnitCard";
import { UnitDialog } from "./UnitDialog";
import { FileText } from "lucide-react";

export interface Unit {
  id: string;
  type: "studio" | "1bed" | "2bed";
  price: number;
  sqft: number;
  beds: number;
  baths: number;
  floorPlan: string;
  availableDate: string;
  about: string;
  leaseTerms: string[];
}

// Mock data - in production, this would come from an API
const units: Unit[] = [
  {
    id: "A101",
    type: "studio",
    price: 2850,
    sqft: 550,
    beds: 0,
    baths: 1,
    floorPlan: "studio",
    availableDate: "2025-12-01",
    about: "Bright and airy studio apartment featuring modern finishes, hardwood floors, and energy-efficient appliances. Large windows provide abundant natural light.",
    leaseTerms: [
      "12-month lease required",
      "Security deposit: $2,850",
      "Pet policy: Cats and dogs allowed with $100/month pet rent",
      "Utilities: Tenant responsible for electricity and internet",
    ],
  },
  {
    id: "B201",
    type: "1bed",
    price: 3250,
    sqft: 750,
    beds: 1,
    baths: 1,
    floorPlan: "1bed",
    availableDate: "2025-11-20",
    about: "Spacious one-bedroom unit with separate living area, updated kitchen with granite countertops, and generous closet space. Includes in-unit washer/dryer.",
    leaseTerms: [
      "12-month lease required",
      "Security deposit: $3,250",
      "Pet policy: Cats and dogs allowed with $100/month pet rent",
      "Utilities: Tenant responsible for electricity and internet",
    ],
  },
  {
    id: "C301",
    type: "1bed",
    price: 3400,
    sqft: 800,
    beds: 1,
    baths: 1,
    floorPlan: "1bed",
    availableDate: "2025-11-25",
    about: "Corner unit with extra windows and city views. Features stainless steel appliances, hardwood floors throughout, and private balcony.",
    leaseTerms: [
      "12-month lease required",
      "Security deposit: $3,400",
      "Pet policy: Cats and dogs allowed with $100/month pet rent",
      "Utilities: Tenant responsible for electricity and internet",
    ],
  },
  {
    id: "D401",
    type: "2bed",
    price: 4200,
    sqft: 1100,
    beds: 2,
    baths: 2,
    floorPlan: "2bed",
    availableDate: "2025-12-15",
    about: "Luxurious two-bedroom, two-bath apartment with open concept living. Master suite includes walk-in closet and ensuite bathroom. Modern kitchen with island seating.",
    leaseTerms: [
      "12-month lease required",
      "Security deposit: $4,200",
      "Pet policy: Cats and dogs allowed with $100/month pet rent",
      "Utilities: Tenant responsible for electricity and internet",
    ],
  },
  {
    id: "E501",
    type: "2bed",
    price: 4500,
    sqft: 1200,
    beds: 2,
    baths: 2,
    floorPlan: "2bed",
    availableDate: "2025-12-01",
    about: "Premium penthouse-level unit with vaulted ceilings and panoramic views. Two full bathrooms, gourmet kitchen, and spacious bedrooms with custom closet systems.",
    leaseTerms: [
      "12-month lease required",
      "Security deposit: $4,500",
      "Pet policy: Cats and dogs allowed with $100/month pet rent",
      "Utilities: Tenant responsible for electricity and internet",
    ],
  },
];

export function AvailableUnits() {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const filteredUnits = units.filter((unit) => {
    if (activeTab === "all") return true;
    return unit.type === activeTab;
  });

  const getCounts = () => ({
    all: units.length,
    studio: units.filter((u) => u.type === "studio").length,
    "1bed": units.filter((u) => u.type === "1bed").length,
    "2bed": units.filter((u) => u.type === "2bed").length,
  });

  const counts = getCounts();

  return (
    <section className="py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Available Units
          </h2>
          <p className="text-muted-foreground">
            Find your perfect apartment from our available units
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Cost & Fees Breakdown
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="studio">Studio ({counts.studio})</TabsTrigger>
          <TabsTrigger value="1bed">1 Bed ({counts["1bed"]})</TabsTrigger>
          <TabsTrigger value="2bed">2 Bed ({counts["2bed"]})</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onClick={() => setSelectedUnit(unit)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <UnitDialog
        unit={selectedUnit}
        open={!!selectedUnit}
        onOpenChange={(open) => !open && setSelectedUnit(null)}
        allUnits={units}
      />
    </section>
  );
}

