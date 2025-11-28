import React from 'react'
import { PropertyListing } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
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
  Megaphone,
} from 'lucide-react'
import { FaBuildingUser } from 'react-icons/fa6'
import DevelopmentTeamSection from './DevelopmentTeamSection'

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

  const extractYear = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const yearMatch = dateString.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : dateString;
  };

  // Helper function to generate slug for property type
  const getPropertyTypeSlug = (propertyType: string): string => {
    const typeMap: Record<string, string> = {
      'Condos': 'condos',
      'Houses': 'houses',
      'Lofts': 'lofts',
      'Master-Planned Communities': 'master-planned-communities',
      'Multi Family': 'multi-family',
      'Offices': 'offices',
      'Condominium': 'condos',
      'Condo': 'condos',
    };
    return typeMap[propertyType] || propertyType.toLowerCase().replace(/\s+/g, '-');
  };

  // Helper function to generate slug for sub-property type
  const getSubPropertyTypeSlug = (subPropertyType: string, propertyType: string): string => {
    const subTypeSlug = subPropertyType.toLowerCase().replace(/\s+/g, '-');
    const propertyTypeSlug = getPropertyTypeSlug(propertyType);
    
    // For Condos: high-rise-condos, mid-rise-condos, low-rise-condos
    if (propertyTypeSlug === 'condos') {
      return `${subTypeSlug}-condos`;
    }
    // For Houses: link-houses, townhouse-houses, semi-detached-houses, detached-houses
    if (propertyTypeSlug === 'houses') {
      return `${subTypeSlug}-houses`;
    }
    
    return `${subTypeSlug}-${propertyTypeSlug}`;
  };

  // Helper function to generate slug for status
  const getStatusSlug = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'selling' || statusLower === 'active' || statusLower === 'available') {
      return 'selling';
    }
    if (statusLower === 'coming-soon' || statusLower === 'coming soon') {
      return 'coming-soon';
    }
    if (statusLower === 'sold-out' || statusLower === 'sold out' || statusLower === 'sold') {
      return 'sold-out';
    }
    return statusLower.replace(/\s+/g, '-');
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
      show: !!preCon.projectName,
    },
    {
      label: 'Developer',
      value: preCon.developer,
      icon: FaBuildingUser,
      show: !!preCon.developer,
    },
    {
      label: 'Starting Price',
      value: preCon.startingPrice && preCon.startingPrice > 0
        ? formatPrice(preCon.startingPrice)
        : preCon.priceRange 
        ? formatPrice(preCon.priceRange.min)
        : null,
      icon: DollarSign,
      show: (preCon.startingPrice && preCon.startingPrice > 0) || !!preCon.priceRange,
    },
    {
      label: 'Status',
      value: preCon.status,
      icon: Home,
      show: !!preCon.status,
    },
    {
      label: 'Occupancy Date',
      value: preCon.completion?.date,
      icon: Calendar,
      show: !!preCon.completion?.date,
    },
    {
      label: 'Completion Year',
      value: extractYear(preCon.completion?.date),
      icon: Calendar,
      show: !!preCon.completion?.date && extractYear(preCon.completion.date) !== 'N/A',
    },
    {
      label: 'Bedroom Range',
      value: preCon.details?.bedroomRange,
      icon: Bed,
      show: !!preCon.details?.bedroomRange,
    },
    {
      label: 'Bathroom Range',
      value: preCon.details?.bathroomRange,
      icon: Bath,
      show: !!preCon.details?.bathroomRange,
    },
    {
      label: 'Square Footage Range',
      value: preCon.details?.sqftRange,
      icon: Ruler,
      show: !!preCon.details?.sqftRange,
    },
    {
      label: 'Total Units',
      value: preCon.details?.totalUnits?.toString(),
      icon: Building2,
      show: preCon.details?.totalUnits !== undefined && preCon.details.totalUnits !== null && preCon.details.totalUnits > 0,
    },
    {
      label: 'Available Units',
      value: preCon.details?.availableUnits?.toString(),
      icon: Building2,
      show: preCon.details?.availableUnits !== undefined && preCon.details.availableUnits !== null && preCon.details.availableUnits > 0,
    },
  ].filter(detail => detail.show);

  // Add additional details if available
  if (preCon.details?.storeys) {
    details.push({
      label: 'Storeys',
      value: preCon.details.storeys.toString(),
      icon: Building2,
    });
  }
  if (preCon.details?.height) {
    details.push({
      label: 'Height',
      value: typeof preCon.details.height === 'string' ? preCon.details.height : `${preCon.details.height}m`,
      icon: Building2,
    });
  }
  if (preCon.details?.propertyType) {
    details.push({
      label: 'Property Type',
      value: preCon.details.propertyType,
      icon: Home,
    });
  }
  if (preCon.details?.subPropertyType) {
    details.push({
      label: 'Sub Property Type',
      value: preCon.details.subPropertyType,
      icon: Home,
    });
  }

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
              
              // Determine if this detail should be a link and what URL to use
              let linkUrl: string | null = null;
              if (detail.value) {
                if (detail.label === 'Status') {
                  linkUrl = `/pre-construction/${getStatusSlug(detail.value)}`;
                } else if (detail.label === 'Completion Year') {
                  const year = extractYear(detail.value);
                  if (year && /^\d{4}$/.test(year)) {
                    linkUrl = `/pre-construction/${year}`;
                  }
                } else if (detail.label === 'Property Type') {
                  linkUrl = `/pre-construction/${getPropertyTypeSlug(detail.value)}`;
                } else if (detail.label === 'Sub Property Type') {
                  const propertyType = preCon.details?.propertyType || 'Condominium';
                  linkUrl = `/pre-construction/${getSubPropertyTypeSlug(detail.value, propertyType)}`;
                }
              }
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-celestial/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{detail.label}</p>
                    {linkUrl && detail.value ? (
                      <Link 
                        href={linkUrl}
                        className="text-sm font-semibold text-foreground capitalize underline hover:text-primary transition-colors"
                      >
                        {detail.value}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-foreground capitalize">{detail.value || ''}</p>
                    )}
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
                const featureName = typeof feature === 'string' ? feature : (feature as { name: string; icon: string }).name;
                const featureIconName = typeof feature === 'string' ? null : (feature as { name: string; icon: string }).icon;
                
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
        <DevelopmentTeamSection developmentTeam={preCon.developmentTeam} />
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

