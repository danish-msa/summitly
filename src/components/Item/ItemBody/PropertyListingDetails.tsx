"use client";

import { useState } from "react";
import RequestInfoModal from "./RequestInfoModal";
import { 
  Home,  
  MapPin, 
  Car, 
  Zap,
  Building2,
  TrendingUp,
  Info,
  Calendar,
  Maximize2,
  Layers,
  TreePine,
  Waves,
  Snowflake,
  Sun,
  Droplet,
  Gauge,
  DoorOpen,
  Sparkles,
  Shield,
  Dumbbell,
  Waves as Pool,
  Flame,
  ArrowUpDown,
  Square,
  Mountain,
  Eye,
  Lock,
  Wifi,
  Tv,
  UtensilsCrossed,
  Coffee,
  Gamepad2,
  ShoppingBag,
  CreditCard,
  User,
  Users,
  Briefcase,
  Palette,
  Sprout,
  Megaphone
} from "lucide-react";
import { PropertyListing } from "@/lib/types";

interface ListingDetailsProps {
  data: {
    keyFacts: Record<string, string | number>;
    listingHistory: Array<{
      dateStart: string;
      dateEnd: string;
      listPrice: string;
      price: string;
      event: string;
      listingId: string;
    }>;
    pricePrediction: {
      lower: number;
      mid: number;
      higher: number;
      confidence: number;
      appreciation: number;
      rentalIncome: number;
    };
    propertyDetails: {
      property: Record<string, string>;
      inside: Record<string, string | number>;
      utilities: Record<string, string>;
      building: Record<string, string>;
      parking: Record<string, string | number>;
      highlights: Record<string, string>;
      land: Record<string, string>;
    };
    rooms: Array<{
      name: string;
      dimensions: string;
      features: string[];
      level: string;
    }>;
    comparableSales: {
      count: number;
      medianPrice: number;
      avgDaysOnMarket: number;
    };
  };
  property?: PropertyListing;
}

export default function PropertyListingDetails({ data, property }: ListingDetailsProps) {
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  
  // Debug: Check if property has preCon data
  // console.log('Property preCon data:', property?.preCon);
  

  // Get icon for development team role
  const getTeamRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('developer')) return Building2;
    if (roleLower.includes('architect')) return Home;
    if (roleLower.includes('builder')) return Briefcase;
    if (roleLower.includes('interior')) return Palette;
    if (roleLower.includes('landscape')) return Sprout;
    if (roleLower.includes('marketing')) return Megaphone;
    return Users;
  };

  // Get appropriate icon for highlight key
const getHighlightIcon = (key: string) => {
    const keyLower = key.toLowerCase();
    
    // Pool/Swimming
    if (keyLower.includes('pool') || keyLower.includes('swim')) {
      return Pool;
    }
    
    // Security/Safety
    if (keyLower.includes('security') || keyLower.includes('safe') || keyLower.includes('guard') || keyLower.includes('alarm')) {
      return Shield;
    }
    
    // Gym/Fitness
    if (keyLower.includes('gym') || keyLower.includes('fitness') || keyLower.includes('exercise')) {
      return Dumbbell;
    }
    
    // Fireplace
    if (keyLower.includes('fireplace') || keyLower.includes('fire')) {
      return Flame;
    }
    
    // Elevator
    if (keyLower.includes('elevator') || keyLower.includes('lift')) {
      return ArrowUpDown;
    }
    
    // Balcony/Deck/Patio
    if (keyLower.includes('balcony') || keyLower.includes('deck') || keyLower.includes('patio') || keyLower.includes('terrace')) {
      return Square;
    }
    
    // View
    if (keyLower.includes('view') || keyLower.includes('scenic') || keyLower.includes('ocean') || keyLower.includes('mountain')) {
      return Eye;
    }
    
    // Lock/Security
    if (keyLower.includes('lock') || keyLower.includes('secure')) {
      return Lock;
    }
    
    // WiFi/Internet
    if (keyLower.includes('wifi') || keyLower.includes('internet') || keyLower.includes('network')) {
      return Wifi;
    }
    
    // TV/Entertainment
    if (keyLower.includes('tv') || keyLower.includes('television') || keyLower.includes('entertainment')) {
      return Tv;
    }
    
    // Kitchen/Dining
    if (keyLower.includes('kitchen') || keyLower.includes('dining') || keyLower.includes('cafe')) {
      return UtensilsCrossed;
    }
    
    // Coffee/Bar
    if (keyLower.includes('coffee') || keyLower.includes('bar') || keyLower.includes('cafe')) {
      return Coffee;
    }
    
    // Game/Recreation
    if (keyLower.includes('game') || keyLower.includes('recreation') || keyLower.includes('play')) {
      return Gamepad2;
    }
    
    // Shopping
    if (keyLower.includes('shopping') || keyLower.includes('mall') || keyLower.includes('store')) {
      return ShoppingBag;
    }
    
    // Parking
    if (keyLower.includes('parking') || keyLower.includes('garage')) {
      return Car;
    }
    
    // Garden/Yard
    if (keyLower.includes('garden') || keyLower.includes('yard') || keyLower.includes('landscape')) {
      return TreePine;
    }
    
    // Water/Beach
    if (keyLower.includes('water') || keyLower.includes('beach') || keyLower.includes('lake')) {
      return Waves;
    }
    
    // Mountain/Nature
    if (keyLower.includes('mountain') || keyLower.includes('nature') || keyLower.includes('forest')) {
      return Mountain;
    }
    
    // Default - use Sparkles for general highlights
    return Sparkles;
  };

  // Get appropriate icon for fact key
  const getFactIcon = (key: string) => {
    const keyLower = key.toLowerCase();
    
    // Year/Built related
    if (keyLower.includes('year') || keyLower.includes('built')) {
      return Calendar;
    }
    
    // Size/Dimensions related
    if (keyLower.includes('size') || keyLower.includes('sqft') || keyLower.includes('square') || keyLower.includes('area')) {
      return Maximize2;
    }
    
    // Lot/Land related
    if (keyLower.includes('lot') || keyLower.includes('land') || keyLower.includes('acre')) {
      return TreePine;
    }
    
    // Stories/Levels
    if (keyLower.includes('stor') || keyLower.includes('level') || keyLower.includes('floor')) {
      return Layers;
    }
    
    // Property Type
    if (keyLower.includes('type') || keyLower.includes('property')) {
      return Home;
    }
    
    // Rooms
    if (keyLower.includes('room') || keyLower.includes('den') || keyLower.includes('family')) {
      return DoorOpen;
    }
    
    // Bedrooms
    if (keyLower.includes('bed')) {
      return Home;
    }
    
    // Bathrooms
    if (keyLower.includes('bath')) {
      return Droplet;
    }
    
    // Parking/Garage
    if (keyLower.includes('parking') || keyLower.includes('garage') || keyLower.includes('driveway')) {
      return Car;
    }
    
    // Heating
    if (keyLower.includes('heat')) {
      return Sun;
    }
    
    // Cooling/AC
    if (keyLower.includes('cool') || keyLower.includes('ac') || keyLower.includes('air conditioning')) {
      return Snowflake;
    }
    
    // Water/Water Source
    if (keyLower.includes('water') || keyLower.includes('waterfront')) {
      return Waves;
    }
    
    // Sewer
    if (keyLower.includes('sewer')) {
      return Waves;
    }
    
    // View
    if (keyLower.includes('view')) {
      return Eye;
    }
    
    // Fireplace
    if (keyLower.includes('fireplace') || keyLower.includes('fire')) {
      return Flame;
    }
    
    // Swimming Pool
    if (keyLower.includes('pool') || keyLower.includes('swim')) {
      return Pool;
    }
    
    // Elevator
    if (keyLower.includes('elevator') || keyLower.includes('lift')) {
      return ArrowUpDown;
    }
    
    // Patio/Balcony
    if (keyLower.includes('patio') || keyLower.includes('balcony') || keyLower.includes('deck')) {
      return Square;
    }
    
    // Basement
    if (keyLower.includes('basement')) {
      return Layers;
    }
    
    // Exterior
    if (keyLower.includes('exterior')) {
      return Building2;
    }
    
    // Foundation
    if (keyLower.includes('foundation')) {
      return Building2;
    }
    
    // Roof
    if (keyLower.includes('roof')) {
      return Building2;
    }
    
    // Flooring
    if (keyLower.includes('flooring') || keyLower.includes('floor')) {
      return Layers;
    }
    
    // Style
    if (keyLower.includes('style')) {
      return Home;
    }
    
    // Zoning
    if (keyLower.includes('zoning')) {
      return MapPin;
    }
    
    // Furnished
    if (keyLower.includes('furnished')) {
      return Home;
    }
    
    // Central Vacuum
    if (keyLower.includes('vacuum') || keyLower.includes('central vac')) {
      return Zap;
    }
    
    // Laundry
    if (keyLower.includes('laundry')) {
      return Zap;
    }
    
    // HOA Fee
    if (keyLower.includes('hoa') || keyLower.includes('fee')) {
      return CreditCard;
    }
    
    // Construction Status
    if (keyLower.includes('construction')) {
      return Building2;
    }
    
    // Energy/EnerGuide
    if (keyLower.includes('energy') || keyLower.includes('energuide') || keyLower.includes('certification')) {
      return Zap;
    }
    
    // Status
    if (keyLower.includes('status') || keyLower.includes('condition')) {
      return Gauge;
    }
    
    // Days on Market
    if (keyLower.includes('days') || keyLower.includes('market')) {
      return Calendar;
    }
    
    // Price
    if (keyLower.includes('price') || keyLower.includes('per sq')) {
      return TrendingUp;
    }
    
    // Default
    return Info;
  };

  // Check if sections have data
  const hasKeyFacts = Object.keys(data.keyFacts).length > 0 || 
    (property && property.preCon && property.preCon.completion && property.preCon.completion.date) ||
    Object.keys(data.propertyDetails.property).length > 0 ||
    Object.keys(data.propertyDetails.building).length > 0 ||
    Object.keys(data.propertyDetails.inside).length > 0 ||
    Object.keys(data.propertyDetails.parking).length > 0 ||
    Object.keys(data.propertyDetails.highlights).length > 0;
  const hasPropertyDetails = Object.keys(data.propertyDetails.property).length > 0;
  const hasBuildingDetails = Object.keys(data.propertyDetails.building).length > 0;
  const hasInsideDetails = Object.keys(data.propertyDetails.inside).length > 0;
  const hasUtilitiesDetails = Object.keys(data.propertyDetails.utilities).length > 0;
  const hasParkingDetails = Object.keys(data.propertyDetails.parking).length > 0;
  const hasLandDetails = Object.keys(data.propertyDetails.land).length > 0;
  const hasHighlights = Object.keys(data.propertyDetails.highlights).length > 0;
  const hasRooms = data.rooms && data.rooms.length > 0;
  const hasComparableSales = data.comparableSales && data.comparableSales.count > 0;
  
  // Determine default tab (first available)
  const hasDetailsTab = hasPropertyDetails || hasBuildingDetails || hasInsideDetails || 
    hasUtilitiesDetails || hasParkingDetails || hasLandDetails || hasHighlights;
  const defaultTab = hasDetailsTab ? 'details' : hasRooms ? 'rooms' : 'comparable';

  return (
    <div className="w-full pl-14">
      {/* Key Facts Section - All Details Combined */}
      {hasKeyFacts && (
        <div>
          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight mb-6">Key Facts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Original Key Facts */}
              {Object.entries(data.keyFacts).map(([key, value]) => {
                const Icon = getFactIcon(key);
                return (
                  <div key={key} className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                    {/* Icon Container */}
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm font-bold text-gray-900">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Property Details */}
              {hasPropertyDetails && Object.entries(data.propertyDetails.property).map(([key, value]) => {
                const Icon = getFactIcon(key);
                return (
                  <div key={`property-${key}`} className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm font-bold text-gray-900">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Building Details */}
              {hasBuildingDetails && Object.entries(data.propertyDetails.building).map(([key, value]) => {
                const Icon = getFactIcon(key);
                return (
                  <div key={`building-${key}`} className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm font-bold text-gray-900">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Interior Details */}
              {hasInsideDetails && Object.entries(data.propertyDetails.inside).map(([key, value]) => {
                const Icon = getFactIcon(key);
                return (
                  <div key={`inside-${key}`} className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm font-bold text-gray-900">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Parking Details */}
              {hasParkingDetails && Object.entries(data.propertyDetails.parking).map(([key, value]) => {
                const Icon = getFactIcon(key);
                return (
                  <div key={`parking-${key}`} className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm font-bold text-gray-900">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Amenities/Highlights */}
              {hasHighlights && Object.entries(data.propertyDetails.highlights).map(([key, value]) => {
                const Icon = getHighlightIcon(key);
                return (
                  <div key={`highlight-${key}`} className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{key}</p>
                      <p className="text-sm font-bold text-gray-900">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Occupancy / Completion Year for Pre-Construction Properties */}
              {property && property.preCon && property.preCon.completion && property.preCon.completion.date && (
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Occupancy / Completion Year</p>
                    <p className="text-sm font-bold text-gray-900">
                      {(() => {
                        const completionDate = property.preCon.completion.date;
                        const yearMatch = completionDate.match(/\d{4}/);
                        if (yearMatch) {
                          return yearMatch[0];
                        }
                        try {
                          const parsedDate = new Date(completionDate);
                          if (!isNaN(parsedDate.getTime())) {
                            return parsedDate.getFullYear().toString();
                          }
                        } catch {
                          // If parsing fails, return the original string
                        }
                        return completionDate;
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Development Team Section - Only for Pre-Con Projects */}
      {property && property.preCon && property.preCon.developmentTeam && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground leading-tight mb-6">Development Team</h2>
          
          {/* Overview */}
          {property.preCon.developmentTeam.overview && (
            <p className="text-sm text-muted-foreground mb-6">{property.preCon.developmentTeam.overview}</p>
          )}

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Developer */}
            {property.preCon.developmentTeam.developer && (
              <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Developer</p>
                  <p className="text-sm font-bold text-gray-900">{property.preCon.developmentTeam.developer.name}</p>
                </div>
              </div>
            )}

            {/* Architect */}
            {property.preCon.developmentTeam.architect && (
              <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                  <Home className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Architect</p>
                  <p className="text-sm font-bold text-gray-900">{property.preCon.developmentTeam.architect.name}</p>
                </div>
              </div>
            )}

            {/* Builder */}
            {property.preCon.developmentTeam.builder && (
              <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                  <Briefcase className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Builder</p>
                  <p className="text-sm font-bold text-gray-900">{property.preCon.developmentTeam.builder.name}</p>
                </div>
              </div>
            )}

            {/* Interior Designer */}
            {property.preCon.developmentTeam.interiorDesigner && (
              <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                  <Palette className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Interior Designer</p>
                  <p className="text-sm font-bold text-gray-900">{property.preCon.developmentTeam.interiorDesigner.name}</p>
                </div>
              </div>
            )}

            {/* Landscape Architect */}
            {property.preCon.developmentTeam.landscapeArchitect && (
              <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                  <Sprout className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Landscape Architect</p>
                  <p className="text-sm font-bold text-gray-900">{property.preCon.developmentTeam.landscapeArchitect.name}</p>
                </div>
              </div>
            )}

            {/* Marketing */}
            {property.preCon.developmentTeam.marketing && (
              <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                  <Megaphone className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Marketing</p>
                  <p className="text-sm font-bold text-gray-900">{property.preCon.developmentTeam.marketing.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      

      {/* Tabbed Content */}
      {/* {(hasPropertyDetails || hasBuildingDetails || hasInsideDetails || hasUtilitiesDetails || hasParkingDetails || hasLandDetails || hasHighlights || hasRooms || hasComparableSales) && (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList>
            {(hasPropertyDetails || hasBuildingDetails || hasInsideDetails || hasUtilitiesDetails || hasParkingDetails || hasLandDetails || hasHighlights) && (
              <TabsTrigger value="details">Property Details</TabsTrigger>
            )}
            {hasRooms && (
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
            )}
            {hasComparableSales && (
              <TabsTrigger value="comparable" className="hidden lg:block">
                Comparable Sales
              </TabsTrigger>
            )}
          </TabsList>

          {(hasPropertyDetails || hasBuildingDetails || hasInsideDetails || hasUtilitiesDetails || hasParkingDetails || hasLandDetails || hasHighlights) && (
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hasPropertyDetails && (
                  <Card variant="light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Home className="h-4 w-4" />
                        Property
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(data.propertyDetails.property).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {hasBuildingDetails && (
                  <Card variant="light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-4 w-4" />
                        Building
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(data.propertyDetails.building).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {hasInsideDetails && (
                  <Card variant="light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Ruler className="h-4 w-4" />
                        Inside
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(data.propertyDetails.inside).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {hasUtilitiesDetails && (
                  <Card variant="light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="h-4 w-4" />
                        Utilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(data.propertyDetails.utilities).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {hasParkingDetails && (
                  <Card variant="light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Car className="h-4 w-4" />
                        Parking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(data.propertyDetails.parking).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {hasLandDetails && (
                  <Card variant="light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-4 w-4" />
                        Land
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(data.propertyDetails.land).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {hasHighlights && (
                <Card variant="light">
                  <CardHeader>
                    <CardTitle className="text-lg">Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.propertyDetails.highlights).map(([key, value]) => {
                        const Icon = getHighlightIcon(key);
                        return (
                          <Badge key={key} variant="secondary" className="px-3 py-2 flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" />
                            {key}: {value}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {hasRooms && (
            <TabsContent value="rooms">
              <Card>
                <CardHeader>
                  <CardTitle>Room Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.rooms.map((room, index) => (
                      <div
                        key={index}
                        className="p-4 bg-brand-celestial/10 rounded-lg transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{room.name}</h4>
                            <p className="text-sm text-muted-foreground">{room.dimensions}</p>
                          </div>
                          <Badge variant="default" className="bg-brand-celestial text-white">{room.level}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {room.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-brand-mist px-2 py-1 rounded border"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasComparableSales && (
            <TabsContent value="comparable">
              <Card>
                <CardHeader>
                  <CardTitle>Comparable Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Comparable Sales</p>
                      <p className="text-3xl font-bold">{data.comparableSales.count}</p>
                    </div>
                    <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/30">
                      <p className="text-sm text-muted-foreground mb-2">Median Sale Price</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(data.comparableSales.medianPrice)}
                      </p>
                    </div>
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Avg. Days On Market</p>
                      <p className="text-3xl font-bold">{data.comparableSales.avgDaysOnMarket}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )} */}

      
      
      <RequestInfoModal 
        open={isRequestInfoModalOpen} 
        onOpenChange={setIsRequestInfoModalOpen} 
      />
    </div>
  );
}
