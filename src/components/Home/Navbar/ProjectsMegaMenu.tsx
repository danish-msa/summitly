"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Calendar, 
  Tag, 
  Users, 
  Home, 
  Warehouse, 
  Building, 
  CheckCircle, 
  Clock, 
  XCircle,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { getBlogPosts } from '@/data/data';

interface ProjectsMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
  children: React.ReactNode;
}

type CategoryType = 'property-type' | 'occupancy-year' | 'selling-status' | 'developer' | 'top-cities';

interface CategoryItem {
  id: CategoryType;
  title: string;
  description: string;
}

interface ContentItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface FilterData {
  propertyTypes: string[];
  developers: string[];
  sellingStatuses: string[];
  occupancyYears: number[];
  cities: string[];
}

interface City {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

interface DevelopmentTeamMember {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  projectCount: number;
  url: string;
}

interface DevelopmentTeamGroup {
  type: string;
  typeLabel: string;
  typeUrl: string;
  members: DevelopmentTeamMember[];
}

const mainCategories: CategoryItem[] = [
  {
    id: 'property-type',
    title: 'Property Type',
    description: 'Browse by building category'
  },
  {
    id: 'top-cities',
    title: 'Top Cities',
    description: 'Explore by location'
  },
  {
    id: 'occupancy-year',
    title: 'Occupancy Year',
    description: 'Filter by move-in date'
  },
  {
    id: 'selling-status',
    title: 'Selling Status',
    description: 'View by availability'
  },
  {
    id: 'developer',
    title: 'Development Team',
    description: 'Explore by team member'
  }
];

const propertyTypes: ContentItem[] = [
  { id: 'condos', label: 'Condos', description: 'Explore condominium projects', href: '/pre-con/condos', icon: Building2 },
  { id: 'houses', label: 'Houses', description: 'Browse house developments', href: '/pre-con/houses', icon: Home },
  { id: 'lofts', label: 'Lofts', description: 'Discover loft projects', href: '/pre-con/lofts', icon: Warehouse },
  { id: 'master-planned', label: 'Master-Planned Communities', description: 'View master-planned communities', href: '/pre-con/master-planned-communities', icon: Building },
  { id: 'multi-family', label: 'Multi Family', description: 'Multi-family developments', href: '/pre-con/multi-family', icon: Building2 },
  { id: 'offices', label: 'Offices', description: 'Find office spaces', href: '/pre-con/offices', icon: Building2 },
];

const currentYear = new Date().getFullYear();
const occupancyYears: ContentItem[] = Array.from({ length: 7 }, (_, i) => ({
  id: `year-${currentYear + i}`,
  label: `Move in ${currentYear + i}`,
  description: `Projects completing in ${currentYear + i}`,
  href: `/pre-con/${currentYear + i}`,
  icon: Calendar
}));

const sellingStatuses: ContentItem[] = [
  { id: 'platinum-access', label: 'Platinum Access', description: 'Exclusive early access projects', href: '/pre-con/platinum-access', icon: CheckCircle },
  { id: 'now-selling', label: 'Now Selling', description: 'Currently available for purchase', href: '/pre-con/now-selling', icon: CheckCircle },
  { id: 'coming-soon', label: 'Coming Soon', description: 'Upcoming projects launching soon', href: '/pre-con/coming-soon', icon: Clock },
  { id: 'assignments', label: 'Assignments', description: 'Assignment opportunities available', href: '/assignments', icon: Tag },
  { id: 'register-now', label: 'Register Now', description: 'Projects accepting registrations', href: '/pre-con/register-now', icon: Clock },
  { id: 'resale', label: 'Resale', description: 'Resale properties available', href: '/pre-con/resale', icon: Tag },
  { id: 'sold-out', label: 'Sold Out', description: 'Fully sold projects', href: '/pre-con/sold-out', icon: XCircle },
];

const getCategoryTitle = (category: CategoryType): string => {
  const titles: Record<CategoryType, string> = {
    'property-type': 'Browse by Property Type',
    'top-cities': 'Explore Top Cities',
    'occupancy-year': 'Select Occupancy Year',
    'selling-status': 'Filter by Status',
    'developer': 'Development Team'
  };
  return titles[category];
};

const getCategoryDescription = (category: CategoryType): string => {
  const descriptions: Record<CategoryType, string> = {
    'property-type': 'Find your perfect property type from condos to master-planned communities.',
    'top-cities': 'Discover pre-construction projects in the most popular cities across Canada.',
    'occupancy-year': 'Plan ahead with projects organized by their expected completion dates.',
    'selling-status': 'Discover opportunities from platinum access to resale properties.',
    'developer': 'Explore projects from developers, architects, builders, and other team members.'
  };
  return descriptions[category];
};

// Helper function to slugify city name for URL
const slugifyCityName = (cityName: string): string => {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const getContentForCategory = (
  category: CategoryType, 
  developers: string[],
  citiesFromFilter: string[] = [],
  developmentTeams: DevelopmentTeamGroup[] = [],
  citiesFromDb: City[] = []
): ContentItem[] => {
  switch (category) {
    case 'property-type': 
      return propertyTypes;
    case 'top-cities':
      // Use cities from database if available, otherwise fall back to filter cities
      if (citiesFromDb.length > 0) {
        return citiesFromDb.map((city) => ({
          id: city.id,
          label: city.name,
          description: `View ${city.numberOfProjects || 0} pre-construction project${city.numberOfProjects !== 1 ? 's' : ''} in ${city.name}`,
          href: `/pre-con/${city.id}`,
          icon: MapPin
        }));
      }
      // Fallback to filter cities if database cities not loaded yet
      return citiesFromFilter.map((city) => ({
        id: slugifyCityName(city),
        label: city,
        description: `View pre-construction projects in ${city}`,
        href: `/pre-con/${slugifyCityName(city)}`,
        icon: MapPin
      }));
    case 'occupancy-year': 
      return occupancyYears;
    case 'selling-status': 
      return sellingStatuses;
    case 'developer': 
      // Flatten all development team members from all groups
      return developmentTeams.flatMap((group) =>
        group.members.map((member) => ({
          id: member.slug,
          label: member.name,
          description: member.description || `View all projects by ${member.name}`,
          href: member.url,
          icon: Users
        }))
      );
    default: 
      return propertyTypes;
  }
};

export const ProjectsMegaMenu: React.FC<ProjectsMegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  className = "",
  children
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('property-type');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [filterData, setFilterData] = useState<FilterData>({
    propertyTypes: [],
    developers: [],
    sellingStatuses: [],
    occupancyYears: [],
    cities: [],
  });
  const [cities, setCities] = useState<City[]>([]);
  const [developmentTeams, setDevelopmentTeams] = useState<DevelopmentTeamGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch data once when component mounts, not every time menu opens
    if (mounted && !dataFetched) {
      fetchFilterData();
    }
  }, [mounted, dataFetched]);

  // Also fetch when menu opens if data hasn't been fetched yet
  useEffect(() => {
    if (isOpen && mounted && !dataFetched && !loading) {
      console.log('Menu opened, fetching data...');
      fetchFilterData();
    }
  }, [isOpen, mounted, dataFetched, loading]);

  const fetchFilterData = async () => {
    try {
      setLoading(true);
      // Fetch filter data
      const filterResponse = await fetch('/api/pre-con-projects/filters');
      if (filterResponse.ok) {
        const filterData = await filterResponse.json();
        setFilterData(filterData);
      }
      
      // Fetch cities from database
      const citiesResponse = await fetch('/api/pre-con-cities?limit=12');
      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json();
        setCities(citiesData.cities || []);
      } else {
        console.error('Failed to fetch cities:', citiesResponse.status);
        setCities([]);
      }
      
      // Fetch development teams
      console.log('Fetching development teams from API...');
      const teamsResponse = await fetch('/api/development-team');
      console.log('Teams response status:', teamsResponse.status);
      
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        console.log('Development teams data received:', teamsData); // Debug log
        console.log('Teams array:', teamsData.teams);
        console.log('Teams array length:', teamsData.teams?.length);
        
        if (teamsData.teams && Array.isArray(teamsData.teams)) {
          console.log(`Setting ${teamsData.teams.length} team groups`);
          setDevelopmentTeams(teamsData.teams);
        } else {
          console.warn('Invalid teams data format:', teamsData);
          console.warn('Expected teams array but got:', typeof teamsData.teams);
          setDevelopmentTeams([]);
        }
      } else {
        const errorText = await teamsResponse.text().catch(() => 'Unknown error');
        console.error('Failed to fetch development teams:', teamsResponse.status, teamsResponse.statusText);
        console.error('Error response:', errorText);
        setDevelopmentTeams([]);
      }
      
      setDataFetched(true);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get blogs related to pre-construction
  const preConBlogs = getBlogPosts({ 
    category: 'Pre-Construction',
    search: 'pre-construction'
  }).slice(0, 2);

  // If no category match, try searching by tags/title
  const fallbackBlogs = preConBlogs.length === 0 
    ? getBlogPosts({ search: 'construction' }).slice(0, 2)
    : preConBlogs;

  const contentItems = getContentForCategory(activeCategory, filterData.developers, filterData.cities, developmentTeams, cities);

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-[9999] flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-background rounded-xl shadow-[0px_20px_40px_0px_rgba(0,0,0,0.1)] pointer-events-auto mt-2 overflow-hidden border border-border"
            style={{
              width: 'min(95vw, 1200px)',
              maxWidth: '1200px'
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div className="flex min-h-[400px]">
              {/* Left Column - Main Categories */}
              <div className="w-64 border-r border-border bg-white p-2">
                <div className="space-y-1">
                  {mainCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      onMouseEnter={() => setActiveCategory(category.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center justify-between group",
                        activeCategory === category.id
                          ? "bg-secondary/10 border-l-2 border-l-secondary"
                          : "hover:bg-muted/50 border-l-2 border-l-transparent"
                      )}
                    >
                      <div>
                        <h3 className={cn(
                          "font-semibold text-sm transition-colors",
                          activeCategory === category.id ? "text-primary" : "text-foreground"
                        )}>
                          {category.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {category.description}
                        </p>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-all",
                        activeCategory === category.id 
                          ? "text-primary opacity-100" 
                          : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      )} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Middle Column - Dynamic Content */}
              <div className="flex-1 p-6 bg-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">
                      {getCategoryTitle(activeCategory)}
                    </h4>
                    {activeCategory === 'developer' ? (
                      developmentTeams.length > 0 ? (
                        <div className="space-y-4">
                          {(() => {
                            // Separate groups into Developers, Architects, and Others
                            const developersGroup = developmentTeams.find(g => g.type === 'DEVELOPER');
                            const architectsGroup = developmentTeams.find(g => g.type === 'ARCHITECT');
                            const othersGroups = developmentTeams.filter(g => 
                              !['DEVELOPER', 'ARCHITECT'].includes(g.type)
                            );
                            
                            // Combine all "others" into one group
                            const combinedOthers = othersGroups.flatMap(g => g.members);
                            
                            return (
                              <>
                                {/* Developers Section */}
                                {developersGroup && developersGroup.members.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                      {developersGroup.typeLabel}
                                    </h5>
                                    <div className="grid grid-cols-2 gap-1">
                                      {developersGroup.members.slice(0, 4).map((member) => (
                                        <Link
                                          key={member.id}
                                          href={member.url}
                                          className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                                            hoveredItem === member.id 
                                              ? "bg-secondary/10" 
                                              : "hover:bg-muted/50"
                                          )}
                                          onMouseEnter={() => setHoveredItem(member.id)}
                                          onMouseLeave={() => setHoveredItem(null)}
                                        >
                                          <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                                            hoveredItem === member.id 
                                              ? "bg-primary/20" 
                                              : "bg-secondary/20"
                                          )}>
                                            <Users className={cn(
                                              "w-5 h-5 transition-colors",
                                              hoveredItem === member.id ? "text-primary" : "text-muted-foreground"
                                            )} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h5 className={cn(
                                              "text-sm font-semibold transition-colors",
                                              hoveredItem === member.id ? "text-primary" : "text-foreground"
                                            )}>
                                              {member.name}
                                            </h5>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                              {member.description || `${member.projectCount} project${member.projectCount !== 1 ? 's' : ''}`}
                                            </p>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                    {developersGroup.members.length > 4 && (
                                      <Link
                                        href="/developer"
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary hover:underline"
                                      >
                                        View all developers
                                      </Link>
                                    )}
                                  </div>
                                )}
                                
                                {/* Architects Section */}
                                {architectsGroup && architectsGroup.members.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                      {architectsGroup.typeLabel}
                                    </h5>
                                    <div className="grid grid-cols-2 gap-1">
                                      {architectsGroup.members.slice(0, 4).map((member) => (
                                        <Link
                                          key={member.id}
                                          href={member.url}
                                          className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                                            hoveredItem === member.id 
                                              ? "bg-secondary/10" 
                                              : "hover:bg-muted/50"
                                          )}
                                          onMouseEnter={() => setHoveredItem(member.id)}
                                          onMouseLeave={() => setHoveredItem(null)}
                                        >
                                          <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                                            hoveredItem === member.id 
                                              ? "bg-primary/20" 
                                              : "bg-secondary/20"
                                          )}>
                                            <Users className={cn(
                                              "w-5 h-5 transition-colors",
                                              hoveredItem === member.id ? "text-primary" : "text-muted-foreground"
                                            )} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h5 className={cn(
                                              "text-sm font-semibold transition-colors",
                                              hoveredItem === member.id ? "text-primary" : "text-foreground"
                                            )}>
                                              {member.name}
                                            </h5>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                              {member.description || `${member.projectCount} project${member.projectCount !== 1 ? 's' : ''}`}
                                            </p>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                    {architectsGroup.members.length > 4 && (
                                      <Link
                                        href="/architect"
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary hover:underline"
                                      >
                                        View all architects
                                      </Link>
                                    )}
                                  </div>
                                )}
                                
                                {/* Others Section */}
                                {combinedOthers.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                      Others
                                    </h5>
                                    <div className="grid grid-cols-2 gap-1">
                                      {combinedOthers.slice(0, 4).map((member) => {
                                        return (
                                          <Link
                                            key={member.id}
                                            href={member.url}
                                            className={cn(
                                              "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                                              hoveredItem === member.id 
                                                ? "bg-secondary/10" 
                                                : "hover:bg-muted/50"
                                            )}
                                            onMouseEnter={() => setHoveredItem(member.id)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                          >
                                            <div className={cn(
                                              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                                              hoveredItem === member.id 
                                                ? "bg-primary/20" 
                                                : "bg-secondary/20"
                                            )}>
                                              <Users className={cn(
                                                "w-5 h-5 transition-colors",
                                                hoveredItem === member.id ? "text-primary" : "text-muted-foreground"
                                              )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h5 className={cn(
                                                "text-sm font-semibold transition-colors",
                                                hoveredItem === member.id ? "text-primary" : "text-foreground"
                                              )}>
                                                {member.name}
                                              </h5>
                                              <p className="text-xs text-muted-foreground line-clamp-1">
                                                {member.description || `${member.projectCount} project${member.projectCount !== 1 ? 's' : ''}`}
                                              </p>
                                            </div>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                    {combinedOthers.length > 4 && (
                                      <Link
                                        href="/pre-con/projects"
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary hover:underline"
                                      >
                                        View all others
                                      </Link>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            {loading ? 'Loading development teams...' : 'No development teams found.'}
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {contentItems.slice(0, 10).map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                                hoveredItem === item.id 
                                  ? "bg-secondary/10" 
                                  : "hover:bg-muted/50"
                              )}
                              onMouseEnter={() => setHoveredItem(item.id)}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                                hoveredItem === item.id 
                                  ? "bg-primary/20" 
                                  : "bg-secondary/20"
                              )}>
                                <Icon className={cn(
                                  "w-5 h-5 transition-colors",
                                  hoveredItem === item.id ? "text-primary" : "text-muted-foreground"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className={cn(
                                  "text-sm font-semibold transition-colors",
                                  hoveredItem === item.id ? "text-primary" : "text-foreground"
                                )}>
                                  {item.label}
                                </h5>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    {activeCategory !== 'developer' && (
                      <Link
                        href={activeCategory === 'top-cities' ? '/pre-con/cities' : '/pre-con/projects'}
                        className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary hover:underline"
                      >
                        View all {activeCategory === 'top-cities' ? 'cities' : activeCategory.replace('-', ' ')}
                      </Link>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Column - Featured Blogs */}
              <div className="w-72 bg-muted/30 p-6 border-l border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                  Latest News
                </h4>
                <p className="text-sm text-foreground font-semibold leading-relaxed mb-3">
                  {getCategoryDescription(activeCategory)}
                </p>
                <div className="space-y-3">
                  {fallbackBlogs.map((blog) => (
                    <Link
                      key={blog.id}
                      href={`/news?id=${blog.id}`}
                      className="block group"
                    >
                      <div className="flex gap-3 p-2 hover:bg-background rounded-lg transition-colors">
                        {blog.image && (
                          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                            <Image
                              src={blog.image}
                              alt={blog.title}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {blog.title}
                          </h5>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {blog.excerpt}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/news"
                  className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary hover:underline"
                >
                  View all articles
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      {mounted && createPortal(menuContent, document.body)}
    </div>
  );
};
