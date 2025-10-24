import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Footprints, Car, Gamepad2, ShoppingBag, Church, Dumbbell, Utensils, MoreHorizontal } from "lucide-react";
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
    id: "entertainment",
    label: "Entertainment",
    filters: [
      { label: "All", count: 8 },
      { label: "Casinos", count: 2 },
      { label: "Cinemas", count: 3 },
      { label: "Theaters", count: 3 },
    ],
    items: [
      {
        id: "e1",
        name: "Casino at Great Canadian Toronto",
        type: "Casino",
        walkTime: "25.00 mins",
        driveTime: "8.00 mins",
        distance: "3.2 km",
      },
      {
        id: "e2",
        name: "Cineplex Cinemas",
        type: "Movie Theater",
        walkTime: "18.00 mins",
        driveTime: "5.00 mins",
        distance: "2.1 km",
      },
      {
        id: "e3",
        name: "Royal Theatre",
        type: "Live Theater",
        walkTime: "22.00 mins",
        driveTime: "6.00 mins",
        distance: "2.8 km",
      },
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    filters: [
      { label: "All", count: 12 },
      { label: "Malls", count: 4 },
      { label: "Department Stores", count: 3 },
      { label: "Grocery", count: 5 },
    ],
    items: [
      {
        id: "s1",
        name: "Walmart Supercentre",
        type: "Department Store",
        walkTime: "12.00 mins",
        driveTime: "3.00 mins",
        distance: "1.5 km",
      },
      {
        id: "s2",
        name: "Yorkdale Shopping Centre",
        type: "Shopping Mall",
        walkTime: "35.00 mins",
        driveTime: "12.00 mins",
        distance: "8.5 km",
      },
      {
        id: "s3",
        name: "Metro Grocery Store",
        type: "Grocery Store",
        walkTime: "8.00 mins",
        driveTime: "2.00 mins",
        distance: "1.0 km",
      },
    ],
  },
  {
    id: "worship",
    label: "Worship",
    filters: [
      { label: "All", count: 6 },
      { label: "Churches", count: 3 },
      { label: "Temples", count: 2 },
      { label: "Mosques", count: 1 },
    ],
    items: [
      {
        id: "w1",
        name: "BAPS Shri Swaminarayan Mandir, Toronto",
        type: "Hindu Temple",
        walkTime: "15.00 mins",
        driveTime: "4.00 mins",
        distance: "2.0 km",
      },
      {
        id: "w2",
        name: "St. Mary's Catholic Church",
        type: "Catholic Church",
        walkTime: "10.00 mins",
        driveTime: "2.50 mins",
        distance: "1.2 km",
      },
      {
        id: "w3",
        name: "Toronto Central Mosque",
        type: "Mosque",
        walkTime: "20.00 mins",
        driveTime: "6.00 mins",
        distance: "3.5 km",
      },
    ],
  },
  {
    id: "sports",
    label: "Sports",
    filters: [
      { label: "All", count: 10 },
      { label: "Arenas", count: 3 },
      { label: "Gyms", count: 4 },
      { label: "Parks", count: 3 },
    ],
    items: [
      {
        id: "sp1",
        name: "Westwood Arena",
        type: "Athletic Field",
        walkTime: "8.00 mins",
        driveTime: "2.00 mins",
        distance: "1.0 km",
      },
      {
        id: "sp2",
        name: "CWENCH Centre by Canlan Sports",
        type: "Sports Complex",
        walkTime: "12.00 mins",
        driveTime: "3.00 mins",
        distance: "1.8 km",
      },
      {
        id: "sp3",
        name: "GoodLife Fitness",
        type: "Gym",
        walkTime: "6.00 mins",
        driveTime: "1.50 mins",
        distance: "0.8 km",
      },
    ],
  },
  {
    id: "food",
    label: "Food",
    filters: [
      { label: "All", count: 15 },
      { label: "Restaurants", count: 8 },
      { label: "Fast Food", count: 4 },
      { label: "Cafes", count: 3 },
    ],
    items: [
      {
        id: "f1",
        name: "Chaatter Box Restaurant Etobicoke",
        type: "Restaurant",
        walkTime: "5.00 mins",
        driveTime: "1.00 mins",
        distance: "0.5 km",
      },
      {
        id: "f2",
        name: "Tim Hortons",
        type: "Coffee Shop",
        walkTime: "3.00 mins",
        driveTime: "0.50 mins",
        distance: "0.3 km",
      },
      {
        id: "f3",
        name: "McDonald's",
        type: "Fast Food",
        walkTime: "7.00 mins",
        driveTime: "1.50 mins",
        distance: "0.9 km",
      },
    ],
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    filters: [
      { label: "All", count: 8 },
      { label: "Services", count: 4 },
      { label: "Utilities", count: 2 },
      { label: "Other", count: 2 },
    ],
    items: [
      {
        id: "m1",
        name: "Toronto Public Library",
        type: "Library",
        walkTime: "18.00 mins",
        driveTime: "5.00 mins",
        distance: "2.5 km",
      },
      {
        id: "m2",
        name: "RBC Bank",
        type: "Bank",
        walkTime: "10.00 mins",
        driveTime: "2.50 mins",
        distance: "1.3 km",
      },
      {
        id: "m3",
        name: "Canada Post",
        type: "Post Office",
        walkTime: "12.00 mins",
        driveTime: "3.00 mins",
        distance: "1.6 km",
      },
    ],
  },
];

const CategoryIcon = ({ category }: { category: string }) => {
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

export const LifestyleAmenities = ({ address = "80 Esther Lorrie Drive" }) => {
  const [activeTab, setActiveTab] = useState("entertainment");
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({
    entertainment: "All",
    shopping: "All",
    worship: "All",
    sports: "All",
    food: "All",
    miscellaneous: "All",
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
          Discover lifestyle amenities and services near{" "}
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
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="High Rated">High Rated</SelectItem>
                  <SelectItem value="Nearby">Nearby</SelectItem>
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
                  <CategoryIcon category={activeTab} />

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
