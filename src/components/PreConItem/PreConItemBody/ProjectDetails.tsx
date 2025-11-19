import React from 'react'
import { PropertyListing } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Building2, 
  DollarSign, 
  Home, 
  Ruler, 
  Bed, 
  Bath, 
  Construction,
  Waves,
  Dumbbell,
  Square,
  Shield,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Car,
  Lock,
  Wifi,
  Tv,
  Gamepad2,
  ShoppingBag,
  TreePine,
  Mountain,
  Eye,
  ArrowUpDown,
  Flame,
  Users,
  Palette,
  Hammer,
  Sprout,
  Megaphone
} from 'lucide-react'
import { FaBuildingUser } from 'react-icons/fa6'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Icon mapping for stored icon names
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Waves,
  Dumbbell,
  Square,
  Shield,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Car,
  Lock,
  Wifi,
  Tv,
  Gamepad2,
  ShoppingBag,
  TreePine,
  Mountain,
  Eye,
  ArrowUpDown,
  Flame,
  Users,
  Palette,
  Hammer,
  Sprout,
  Megaphone,
  Building2,
  Home,
  Ruler,
  Bed,
  Bath,
  Calendar,
  DollarSign,
  Construction,
}

interface ProjectDetailsProps {
  property: PropertyListing;
}

// Helper function to get color class for stat blocks
const getStatBlockColor = (statType: string): string => {
  const colorMap: { [key: string]: string } = {
    'activelySelling': 'bg-green-50 text-green-700 border-green-200',
    'launchingSoon': 'bg-blue-50 text-blue-700 border-blue-200',
    'registrationPhase': 'bg-purple-50 text-purple-700 border-purple-200',
    'soldOut': 'bg-gray-50 text-gray-700 border-gray-200',
    'resale': 'bg-orange-50 text-orange-700 border-orange-200',
    'cancelled': 'bg-red-50 text-red-700 border-red-200',
  };
  return colorMap[statType] || 'bg-muted text-foreground border-border';
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ property }) => {
  const preCon = property.preCon;
  
  if (!preCon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Project details not available
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const extractYear = (dateString: string) => {
    const yearMatch = dateString.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : dateString;
  };

  // Get appropriate icon for feature name
  const getFeatureIcon = (featureName: string) => {
    const featureLower = featureName.toLowerCase();
    
    // Pool/Swimming
    if (featureLower.includes('pool') || featureLower.includes('swim')) {
      return Waves;
    }
    
    // Gym/Fitness
    if (featureLower.includes('gym') || featureLower.includes('fitness') || featureLower.includes('exercise')) {
      return Dumbbell;
    }
    
    // Terrace/Rooftop/Balcony/Deck/Patio
    if (featureLower.includes('terrace') || featureLower.includes('rooftop') || featureLower.includes('balcony') || featureLower.includes('deck') || featureLower.includes('patio')) {
      return Square;
    }
    
    // Concierge/Security
    if (featureLower.includes('concierge') || featureLower.includes('security') || featureLower.includes('guard')) {
      return Shield;
    }
    
    // Restaurant/Dining
    if (featureLower.includes('restaurant') || featureLower.includes('dining') || featureLower.includes('cafe')) {
      return UtensilsCrossed;
    }
    
    // Coffee/Bar
    if (featureLower.includes('coffee') || featureLower.includes('bar')) {
      return Coffee;
    }
    
    // Parking/Garage
    if (featureLower.includes('parking') || featureLower.includes('garage')) {
      return Car;
    }
    
    // Lock/Secure
    if (featureLower.includes('lock') || featureLower.includes('secure')) {
      return Lock;
    }
    
    // WiFi/Internet
    if (featureLower.includes('wifi') || featureLower.includes('internet')) {
      return Wifi;
    }
    
    // TV/Entertainment
    if (featureLower.includes('tv') || featureLower.includes('entertainment') || featureLower.includes('media')) {
      return Tv;
    }
    
    // Game/Recreation
    if (featureLower.includes('game') || featureLower.includes('recreation') || featureLower.includes('play')) {
      return Gamepad2;
    }
    
    // Shopping
    if (featureLower.includes('shopping') || featureLower.includes('mall') || featureLower.includes('store')) {
      return ShoppingBag;
    }
    
    // Garden/Yard
    if (featureLower.includes('garden') || featureLower.includes('yard') || featureLower.includes('landscape')) {
      return TreePine;
    }
    
    // View/Scenic
    if (featureLower.includes('view') || featureLower.includes('scenic') || featureLower.includes('ocean') || featureLower.includes('mountain')) {
      return Eye;
    }
    
    // Elevator
    if (featureLower.includes('elevator') || featureLower.includes('lift')) {
      return ArrowUpDown;
    }
    
    // Fireplace
    if (featureLower.includes('fireplace') || featureLower.includes('fire')) {
      return Flame;
    }
    
    // Mountain/Nature
    if (featureLower.includes('mountain') || featureLower.includes('nature')) {
      return Mountain;
    }
    
    // Default - use Sparkles for general features
    return Sparkles;
  };

  const details = [
    {
      label: 'Project Name',
      value: preCon.projectName,
      icon: Building2,
    },
    {
      label: 'Developer',
      value: preCon.developer,
      icon: FaBuildingUser,
    },
    {
      label: 'Price Range',
      value: preCon.priceRange 
        ? `${formatPrice(preCon.priceRange.min)} - ${formatPrice(preCon.priceRange.max)}`
        : formatPrice(preCon.startingPrice),
      icon: DollarSign,
    },
    {
      label: 'Status',
      value: preCon.status,
      icon: Home,
    },
    {
      label: 'Completion Date',
      value: preCon.completion.date,
      icon: Calendar,
    },
    {
      label: 'Completion Year',
      value: extractYear(preCon.completion.date),
      icon: Calendar,
    },
    {
      label: 'Progress',
      value: `${preCon.completion.progress}%`,
      icon: Construction,
    },
    {
      label: 'Bedroom Range',
      value: preCon.details.bedroomRange,
      icon: Bed,
    },
    {
      label: 'Bathroom Range',
      value: preCon.details.bathroomRange,
      icon: Bath,
    },
    {
      label: 'Square Footage Range',
      value: preCon.details.sqftRange,
      icon: Ruler,
    },
    {
      label: 'Total Units',
      value: preCon.details.totalUnits.toString(),
      icon: Building2,
    },
    {
      label: 'Available Units',
      value: preCon.details.availableUnits.toString(),
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {details.map((detail, index) => {
              const Icon = detail.icon;
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-celestial/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{detail.label}</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{detail.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {preCon.features && preCon.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preCon.features.map((feature, index) => {
                // Handle both old format (string) and new format (object with name and icon)
                const featureName = typeof feature === 'string' ? feature : feature.name;
                const featureIconName = typeof feature === 'string' ? null : feature.icon;
                
                // Use stored icon if available, otherwise fall back to getFeatureIcon
                const FeatureIcon = featureIconName 
                  ? (iconMap[featureIconName as keyof typeof iconMap] || getFeatureIcon(featureName))
                  : getFeatureIcon(featureName);
                
                // Array of light color classes for badges
                const badgeColors = [
                  'bg-blue-50 text-blue-700 border-blue-200',
                  'bg-purple-50 text-purple-700 border-purple-200',
                  'bg-pink-50 text-pink-700 border-pink-200',
                  'bg-green-50 text-green-700 border-green-200',
                  'bg-yellow-50 text-yellow-700 border-yellow-200',
                  'bg-indigo-50 text-indigo-700 border-indigo-200',
                  'bg-teal-50 text-teal-700 border-teal-200',
                  'bg-orange-50 text-orange-700 border-orange-200',
                ];
                const colorClass = badgeColors[index % badgeColors.length];
                return (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className={`px-3 py-2 flex items-center gap-1.5 text-sm ${colorClass}`}
                  >
                    <FeatureIcon className="h-4 w-4" />
                    {featureName}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {preCon.developmentTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Development Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Team Overview */}
            {preCon.developmentTeam.overview && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {preCon.developmentTeam.overview}
                </p>
              </div>
            )}

            {/* Team Tabs */}
            <Tabs 
              defaultValue={
                preCon.developmentTeam.developer ? "developer" :
                preCon.developmentTeam.architect ? "architect" :
                preCon.developmentTeam.interiorDesigner ? "interior-designer" :
                preCon.developmentTeam.builder ? "builder" :
                preCon.developmentTeam.landscapeArchitect ? "landscape-architect" :
                preCon.developmentTeam.marketing ? "marketing" : "developer"
              } 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 gap-1">
                {preCon.developmentTeam.developer && (
                  <TabsTrigger value="developer" className="text-xs md:text-sm py-2">
                    Developer
                  </TabsTrigger>
                )}
                {preCon.developmentTeam.architect && (
                  <TabsTrigger value="architect" className="text-xs md:text-sm py-2">
                    Architect
                  </TabsTrigger>
                )}
                {preCon.developmentTeam.interiorDesigner && (
                  <TabsTrigger value="interior-designer" className="text-xs md:text-sm py-2">
                    Interior Designer
                  </TabsTrigger>
                )}
                {preCon.developmentTeam.builder && (
                  <TabsTrigger value="builder" className="text-xs md:text-sm py-2">
                    Builder
                  </TabsTrigger>
                )}
                {preCon.developmentTeam.landscapeArchitect && (
                  <TabsTrigger value="landscape-architect" className="text-xs md:text-sm py-2">
                    Landscape
                  </TabsTrigger>
                )}
                {preCon.developmentTeam.marketing && (
                  <TabsTrigger value="marketing" className="text-xs md:text-sm py-2">
                    Marketing
                  </TabsTrigger>
                )}
              </TabsList>

              {preCon.developmentTeam.developer && (
                <TabsContent value="developer" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {preCon.developmentTeam.developer.name}
                        </h3>
                        {preCon.developmentTeam.developer.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {preCon.developmentTeam.developer.description}
                          </p>
                        )}
                        {preCon.developmentTeam.developer.website && (
                          <a 
                            href={preCon.developmentTeam.developer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Section */}
                    {preCon.developmentTeam.developer.stats && (
                      <div className="p-4 bg-card border border-border rounded-lg">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            {preCon.developmentTeam.developer.stats.totalProjects} Total Projects
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('activelySelling')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.developer.stats.activelySelling}
                            </p>
                            <p className="text-xs mt-1">Actively Selling</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('launchingSoon')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.developer.stats.launchingSoon}
                            </p>
                            <p className="text-xs mt-1">Launching Soon</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('registrationPhase')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.developer.stats.registrationPhase}
                            </p>
                            <p className="text-xs mt-1">Registration Phase</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('soldOut')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.developer.stats.soldOut}
                            </p>
                            <p className="text-xs mt-1">Sold Out</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('resale')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.developer.stats.resale}
                            </p>
                            <p className="text-xs mt-1">Resale</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('cancelled')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.developer.stats.cancelled}
                            </p>
                            <p className="text-xs mt-1">Cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {preCon.developmentTeam.architect && (
                <TabsContent value="architect" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {preCon.developmentTeam.architect.name}
                        </h3>
                        {preCon.developmentTeam.architect.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {preCon.developmentTeam.architect.description}
                          </p>
                        )}
                        {preCon.developmentTeam.architect.website && (
                          <a 
                            href={preCon.developmentTeam.architect.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Section */}
                    {preCon.developmentTeam.architect.stats && (
                      <div className="p-4 bg-card border border-border rounded-lg">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            {preCon.developmentTeam.architect.stats.totalProjects} Total Projects
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('activelySelling')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.architect.stats.activelySelling}
                            </p>
                            <p className="text-xs mt-1">Actively Selling</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('launchingSoon')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.architect.stats.launchingSoon}
                            </p>
                            <p className="text-xs mt-1">Launching Soon</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('registrationPhase')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.architect.stats.registrationPhase}
                            </p>
                            <p className="text-xs mt-1">Registration Phase</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('soldOut')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.architect.stats.soldOut}
                            </p>
                            <p className="text-xs mt-1">Sold Out</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('resale')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.architect.stats.resale}
                            </p>
                            <p className="text-xs mt-1">Resale</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('cancelled')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.architect.stats.cancelled}
                            </p>
                            <p className="text-xs mt-1">Cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {preCon.developmentTeam.interiorDesigner && (
                <TabsContent value="interior-designer" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Palette className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {preCon.developmentTeam.interiorDesigner.name}
                        </h3>
                        {preCon.developmentTeam.interiorDesigner.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {preCon.developmentTeam.interiorDesigner.description}
                          </p>
                        )}
                        {preCon.developmentTeam.interiorDesigner.website && (
                          <a 
                            href={preCon.developmentTeam.interiorDesigner.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Section */}
                    {preCon.developmentTeam.interiorDesigner.stats && (
                      <div className="p-4 bg-card border border-border rounded-lg">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            {preCon.developmentTeam.interiorDesigner.stats.totalProjects} Total Projects
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('activelySelling')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.interiorDesigner.stats.activelySelling}
                            </p>
                            <p className="text-xs mt-1">Actively Selling</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('launchingSoon')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.interiorDesigner.stats.launchingSoon}
                            </p>
                            <p className="text-xs mt-1">Launching Soon</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('registrationPhase')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.interiorDesigner.stats.registrationPhase}
                            </p>
                            <p className="text-xs mt-1">Registration Phase</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('soldOut')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.interiorDesigner.stats.soldOut}
                            </p>
                            <p className="text-xs mt-1">Sold Out</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('resale')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.interiorDesigner.stats.resale}
                            </p>
                            <p className="text-xs mt-1">Resale</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('cancelled')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.interiorDesigner.stats.cancelled}
                            </p>
                            <p className="text-xs mt-1">Cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {preCon.developmentTeam.builder && (
                <TabsContent value="builder" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Hammer className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {preCon.developmentTeam.builder.name}
                        </h3>
                        {preCon.developmentTeam.builder.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {preCon.developmentTeam.builder.description}
                          </p>
                        )}
                        {preCon.developmentTeam.builder.website && (
                          <a 
                            href={preCon.developmentTeam.builder.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Section */}
                    {preCon.developmentTeam.builder.stats && (
                      <div className="p-4 bg-card border border-border rounded-lg">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            {preCon.developmentTeam.builder.stats.totalProjects} Total Projects
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('activelySelling')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.builder.stats.activelySelling}
                            </p>
                            <p className="text-xs mt-1">Actively Selling</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('launchingSoon')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.builder.stats.launchingSoon}
                            </p>
                            <p className="text-xs mt-1">Launching Soon</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('registrationPhase')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.builder.stats.registrationPhase}
                            </p>
                            <p className="text-xs mt-1">Registration Phase</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('soldOut')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.builder.stats.soldOut}
                            </p>
                            <p className="text-xs mt-1">Sold Out</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('resale')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.builder.stats.resale}
                            </p>
                            <p className="text-xs mt-1">Resale</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('cancelled')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.builder.stats.cancelled}
                            </p>
                            <p className="text-xs mt-1">Cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {preCon.developmentTeam.landscapeArchitect && (
                <TabsContent value="landscape-architect" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sprout className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {preCon.developmentTeam.landscapeArchitect.name}
                        </h3>
                        {preCon.developmentTeam.landscapeArchitect.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {preCon.developmentTeam.landscapeArchitect.description}
                          </p>
                        )}
                        {preCon.developmentTeam.landscapeArchitect.website && (
                          <a 
                            href={preCon.developmentTeam.landscapeArchitect.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Section */}
                    {preCon.developmentTeam.landscapeArchitect.stats && (
                      <div className="p-4 bg-card border border-border rounded-lg">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            {preCon.developmentTeam.landscapeArchitect.stats.totalProjects} Total Projects
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('activelySelling')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.landscapeArchitect.stats.activelySelling}
                            </p>
                            <p className="text-xs mt-1">Actively Selling</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('launchingSoon')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.landscapeArchitect.stats.launchingSoon}
                            </p>
                            <p className="text-xs mt-1">Launching Soon</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('registrationPhase')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.landscapeArchitect.stats.registrationPhase}
                            </p>
                            <p className="text-xs mt-1">Registration Phase</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('soldOut')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.landscapeArchitect.stats.soldOut}
                            </p>
                            <p className="text-xs mt-1">Sold Out</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('resale')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.landscapeArchitect.stats.resale}
                            </p>
                            <p className="text-xs mt-1">Resale</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('cancelled')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.landscapeArchitect.stats.cancelled}
                            </p>
                            <p className="text-xs mt-1">Cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {preCon.developmentTeam.marketing && (
                <TabsContent value="marketing" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {preCon.developmentTeam.marketing.name}
                        </h3>
                        {preCon.developmentTeam.marketing.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {preCon.developmentTeam.marketing.description}
                          </p>
                        )}
                        {preCon.developmentTeam.marketing.website && (
                          <a 
                            href={preCon.developmentTeam.marketing.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Section */}
                    {preCon.developmentTeam.marketing.stats && (
                      <div className="p-4 bg-card border border-border rounded-lg">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            {preCon.developmentTeam.marketing.stats.totalProjects} Total Projects
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('activelySelling')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.marketing.stats.activelySelling}
                            </p>
                            <p className="text-xs mt-1">Actively Selling</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('launchingSoon')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.marketing.stats.launchingSoon}
                            </p>
                            <p className="text-xs mt-1">Launching Soon</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('registrationPhase')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.marketing.stats.registrationPhase}
                            </p>
                            <p className="text-xs mt-1">Registration Phase</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('soldOut')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.marketing.stats.soldOut}
                            </p>
                            <p className="text-xs mt-1">Sold Out</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('resale')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.marketing.stats.resale}
                            </p>
                            <p className="text-xs mt-1">Resale</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${getStatBlockColor('cancelled')}`}>
                            <p className="text-2xl font-bold">
                              {preCon.developmentTeam.marketing.stats.cancelled}
                            </p>
                            <p className="text-xs mt-1">Cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
      {/* CTA Section */}
      <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to start your pre-construction journey?
          </p>
          <button className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg">
            Schedule a Consultation
          </button>
        </div>
    </div>
  );
};

export default ProjectDetails;

