import React from 'react'
import { PropertyListing } from '@/lib/types'
import {
  Waves,
  Dumbbell,
  Shield,
  UtensilsCrossed,
  Coffee,
  Car,
  Gamepad2,
  TreePine,
  ArrowUpDown,
  Flame,
  Baby,
  Users,
  BookOpen,
  Building2,
  Sparkles,
  Film,
  DoorOpen,
  Briefcase,
  Shirt,
  Package,
  Flower2,
  Heart,
  Droplets,
  Sun,
  Archive
} from 'lucide-react'

interface ProjectAmenitiesProps {
  property: PropertyListing;
}

const ProjectAmenities: React.FC<ProjectAmenitiesProps> = ({ property }) => {
  const preCon = property.preCon;
  
  if (!preCon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Project amenities not available
      </div>
    );
  }

  // Get appropriate icon for amenity name
  const getAmenityIcon = (amenityName: string) => {
    const amenityLower = amenityName.toLowerCase();
    
    // Pool/Swimming
    if (amenityLower.includes('pool') || amenityLower.includes('swim')) {
      return Waves;
    }
    
    // Spa/Steam/Sauna
    if (amenityLower.includes('spa') || amenityLower.includes('steam') || amenityLower.includes('sauna')) {
      return Droplets;
    }
    
    // Gym/Fitness/Training
    if (amenityLower.includes('gym') || amenityLower.includes('fitness') || amenityLower.includes('exercise') || amenityLower.includes('training')) {
      return Dumbbell;
    }
    
    // Yoga/Meditation
    if (amenityLower.includes('yoga') || amenityLower.includes('meditation')) {
      return Flower2;
    }
    
    // Kids/Children/Play
    if (amenityLower.includes('kid') || amenityLower.includes('children') || amenityLower.includes('play')) {
      return Baby;
    }
    
    // Dining/Restaurant/Kitchen
    if (amenityLower.includes('dining') || amenityLower.includes('restaurant') || amenityLower.includes('kitchen') || amenityLower.includes('catering')) {
      return UtensilsCrossed;
    }
    
    // Coffee/Bar
    if (amenityLower.includes('coffee') || amenityLower.includes('bar')) {
      return Coffee;
    }
    
    // Lounge/Lobby
    if (amenityLower.includes('lounge') || amenityLower.includes('lobby')) {
      return Users;
    }
    
    // Concierge
    if (amenityLower.includes('concierge')) {
      return Shield;
    }
    
    // Parking/Visitor
    if (amenityLower.includes('parking') || amenityLower.includes('visitor')) {
      return Car;
    }
    
    // Party/Event
    if (amenityLower.includes('party') || amenityLower.includes('event')) {
      return Sparkles;
    }
    
    // Conference/Meeting/Co-working
    if (amenityLower.includes('conference') || amenityLower.includes('meeting') || amenityLower.includes('co-working') || amenityLower.includes('coworking')) {
      return Briefcase;
    }
    
    // Games/Billiard/Table Tennis
    if (amenityLower.includes('game') || amenityLower.includes('billiard') || amenityLower.includes('table tennis') || amenityLower.includes('ping pong')) {
      return Gamepad2;
    }
    
    // Screening/Media/Movie
    if (amenityLower.includes('screening') || amenityLower.includes('media') || amenityLower.includes('movie') || amenityLower.includes('cinema')) {
      return Film;
    }
    
    // Library
    if (amenityLower.includes('library')) {
      return BookOpen;
    }
    
    // Rooftop/Deck/Patio/Outdoor
    if (amenityLower.includes('rooftop') || amenityLower.includes('deck') || amenityLower.includes('patio') || amenityLower.includes('outdoor')) {
      return Sun;
    }
    
    // BBQ
    if (amenityLower.includes('bbq') || amenityLower.includes('barbecue')) {
      return Flame;
    }
    
    // Laundry
    if (amenityLower.includes('laundry')) {
      return Shirt;
    }
    
    // Storage
    if (amenityLower.includes('storage')) {
      return Archive;
    }
    
    // Spin
    if (amenityLower.includes('spin')) {
      return ArrowUpDown;
    }
    
    // Porte Cochere
    if (amenityLower.includes('porte') || amenityLower.includes('cochere')) {
      return DoorOpen;
    }
    
    // Treatment Room
    if (amenityLower.includes('treatment')) {
      return Heart;
    }
    
    // Parents Lounge
    if (amenityLower.includes('parent')) {
      return Users;
    }
    
    // Garden
    if (amenityLower.includes('garden')) {
      return TreePine;
    }
    
    // Parcel
    if (amenityLower.includes('parcel')) {
      return Package;
    }
    
    // Default icon
    return Building2;
  };

  // Only use real amenities data from database - don't show fallback list
  const allAmenities = preCon.amenities && preCon.amenities.length > 0 ? preCon.amenities : [];

  // Remove duplicates and sort
  const uniqueAmenities = Array.from(new Set(allAmenities)).sort();

  // Handle both string and object format amenities
  const processedAmenities = uniqueAmenities.map(amenity => {
    if (typeof amenity === 'string') {
      return amenity;
    }
    // Handle object format { name: string, icon: string }
    return (amenity as { name: string; icon: string }).name;
  }).filter(Boolean);

  if (processedAmenities.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No amenities available for this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-muted-foreground">
          View available facilities at {preCon.projectName || 'this development'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {processedAmenities.map((amenity, index) => {
          const Icon = getAmenityIcon(amenity);
          
          return (
            <div
              key={index}
              className="flex items-center gap-2 py-2 group"
            >
              <Icon className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground leading-tight">
                {amenity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectAmenities;

