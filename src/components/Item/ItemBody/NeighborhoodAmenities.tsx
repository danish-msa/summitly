import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, Plus, Footprints, Car, Trees, Shield, Bus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Amenity {
  id: string;
  name: string;
  type: string;
  rating?: number;
  walkTime: string;
  driveTime: string;
  distance: string;
}

interface AmenityCategory {
  id: string;
  label: string;
  items: Amenity[];
  filters: { label: string; count: number }[];
}

const MOCK_DATA: AmenityCategory[] = [
  {
    id: "schools",
    label: "Schools",
    filters: [
      { label: "All", count: 6 },
      { label: "Assigned", count: 4 },
      { label: "Elementary", count: 3 },
      { label: "Secondary", count: 3 },
      { label: "French Immersion", count: 2 },
    ],
    items: [
      {
        id: "1",
        name: "West Humber Collegiate Institute",
        type: "Public",
        rating: 7,
        walkTime: "7.59 mins",
        driveTime: "1.22 mins",
        distance: "810 m",
      },
      {
        id: "2",
        name: "West Humber Junior Middle School",
        type: "Public",
        rating: 5.7,
        walkTime: "8.91 mins",
        driveTime: "1.43 mins",
        distance: "950 m",
      },
      {
        id: "3",
        name: "Melody Village Junior School",
        type: "Public",
        walkTime: "15.00 mins",
        driveTime: "2.40 mins",
        distance: "1.6 km",
      },
      {
        id: "4",
        name: "ÉÉ Félix-Leclerc",
        type: "Public",
        rating: 7,
        walkTime: "45.66 mins",
        driveTime: "7.30 mins",
        distance: "4.87 km",
      },
      {
        id: "5",
        name: "Western Technical-Commercial School",
        type: "Public",
        rating: 5.4,
        walkTime: "109.22 mins",
        driveTime: "17.48 mins",
        distance: "11.65 km",
      },
    ],
  },
  {
    id: "parks",
    label: "Parks",
    filters: [
      { label: "All", count: 8 },
      { label: "Playgrounds", count: 5 },
      { label: "Dog Parks", count: 2 },
    ],
    items: [
      {
        id: "p1",
        name: "Humber Valley Park",
        type: "Public Park",
        walkTime: "12.00 mins",
        driveTime: "3.00 mins",
        distance: "1.2 km",
      },
      {
        id: "p2",
        name: "Riverside Park",
        type: "Community Park",
        walkTime: "8.00 mins",
        driveTime: "2.00 mins",
        distance: "850 m",
      },
    ],
  },
  {
    id: "safety",
    label: "Safety Zones",
    filters: [
      { label: "All", count: 4 },
      { label: "Fire Stations", count: 2 },
      { label: "Police Stations", count: 2 },
    ],
    items: [
      {
        id: "s1",
        name: "Fire Station 423",
        type: "Emergency Service",
        walkTime: "18.00 mins",
        driveTime: "4.50 mins",
        distance: "2.1 km",
      },
    ],
  },
  {
    id: "transit",
    label: "Transit Stops",
    filters: [
      { label: "All", count: 12 },
      { label: "Bus Stops", count: 8 },
      { label: "Subway", count: 4 },
    ],
    items: [
      {
        id: "t1",
        name: "Islington Station",
        type: "Subway Station",
        walkTime: "15.00 mins",
        driveTime: "5.00 mins",
        distance: "1.8 km",
      },
    ],
  },
];

const CategoryIcon = ({ category, rating }: { category: string; rating?: number }) => {
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

  const { icon: Icon, bgColor, iconColor, borderColor } = getIconAndColors(category);

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

  if (!rating) {
    return (
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bgColor} border-2 ${borderColor}`}>
        {Icon && <Icon className={`h-8 w-8 ${iconColor}`} />}
      </div>
    );
  }

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

const RatingBadge = ({ rating }: { rating?: number }) => {
  if (!rating) {
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
        <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
          N/A
        </div>
      </div>
    );
  }

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

  const circumference = 2 * Math.PI * 15.9155; // radius = 15.9155
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (rating / 10) * circumference;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-16 w-16 transform -rotate-90" viewBox="0 0 36 36">
        {/* Background circle */}
        <path
          className="text-gray-200"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        {/* Progress circle */}
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

export const NeighborhoodAmenities = ({ address = "80 Esther Lorrie Drive" }) => {
  const [activeTab, setActiveTab] = useState("schools");
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({
    schools: "All",
    parks: "All",
    safety: "All",
    transit: "All",
  });
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});

  const currentCategory = MOCK_DATA.find((cat) => cat.id === activeTab);
  const displayItems = currentCategory
    ? showAll[activeTab]
      ? currentCategory.items
      : currentCategory.items.slice(0, 5)
    : [];

  return (
    <div className="w-full p-2">
      <div className="mb-6">
        <p className="text-gray-600">
          Find out information about nearby public amenities for{" "}
          <span className="font-semibold text-gray-900">{address}</span>
        </p>
      </div>

      <div className="w-full">
        <div className="mb-6 flex w-full justify-start overflow-x-auto border-b border-gray-200">
          {MOCK_DATA.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`whitespace-nowrap px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === category.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {MOCK_DATA.map((category) => (
          <div
            key={category.id}
            className={`space-y-6 ${activeTab === category.id ? "block" : "hidden"}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Filters:</span>
              <Select
                value={activeFilter[category.id]}
                onValueChange={(value) =>
                  setActiveFilter({ ...activeFilter, [category.id]: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {category.filters.map((filter) => (
                  <Badge
                    key={filter.label}
                    variant={
                      activeFilter[category.id] === filter.label ? "default" : "outline"
                    }
                    className="cursor-pointer px-4 py-1.5"
                    onClick={() =>
                      setActiveFilter({ ...activeFilter, [category.id]: filter.label })
                    }
                  >
                    {filter.label} ({filter.count})
                  </Badge>
                ))}
              </div>
            </div>

             <div className="space-y-4">
               {displayItems.map((item) => (
                 <div
                   key={item.id}
                   className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                 >
                   <CategoryIcon category={activeTab} rating={item.rating} />

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.type}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Footprints className="h-4 w-4" />
                      <span>{item.walkTime}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <Car className="h-4 w-4" />
                      <span>{item.driveTime}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span>{item.distance}</span>
                  </div>
                </div>
              ))}
            </div>

            {category.items.length > 5 && (
              <button
                onClick={() =>
                  setShowAll({ ...showAll, [category.id]: !showAll[category.id] })
                }
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {showAll[category.id] ? "Show less" : `Show all ${category.label}`}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showAll[category.id] ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
