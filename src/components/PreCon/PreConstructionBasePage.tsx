"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { LayoutGrid, MapPin, Bell, TrendingUp, Home } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import { PropertyListing } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import BlogSection from '@/components/common/BlogSection';

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

// Helper function to convert slug back to city name
const unslugifyCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Convert PropertyListing to PreConstructionProperty format
const convertToPreConProperty = (property: PropertyListing): PreConstructionProperty | null => {
  if (!property.preCon) return null;

  const preCon = property.preCon;
  const address = property.address;

  return {
    id: property.mlsNumber,
    projectName: preCon.projectName,
    developer: preCon.developer,
    startingPrice: preCon.startingPrice,
    images: property.images?.allImages || [property.images?.imageUrl || '/images/p1.jpg'],
    address: {
      street: `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || address.location?.split(',')[0] || '',
      city: address.city || '',
      province: address.state || '',
      latitude: property.map?.latitude ?? undefined,
      longitude: property.map?.longitude ?? undefined,
    },
    details: {
      propertyType: property.details?.propertyType || preCon.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: typeof preCon.completion.progress === 'string' ? 0 : (preCon.completion.progress || 0),
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};

// Convert PreConstructionProperty to PropertyListing for map
const convertToPropertyListing = (project: PreConstructionProperty): PropertyListing => {
  const streetParts = project.address.street.split(' ');
  return {
    mlsNumber: project.id,
    status: project.status === 'selling' ? 'A' : 'U',
    class: 'residential',
    type: 'Sale',
    listPrice: project.startingPrice,
    listDate: new Date().toISOString(),
    lastStatus: project.status === 'selling' ? 'A' : 'U',
    soldPrice: '',
    soldDate: '',
    updatedOn: new Date().toISOString(),
    boardId: 0,
    address: {
      area: null,
      city: project.address.city || null,
      country: 'Canada',
      district: null,
      majorIntersection: null,
      neighborhood: null,
      streetDirection: null,
      streetName: streetParts.length > 1 ? streetParts.slice(1).join(' ') : null,
      streetNumber: streetParts[0] || null,
      streetSuffix: null,
      unitNumber: null,
      zip: null,
      state: project.address.province || null,
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: `${project.address.street}, ${project.address.city}, ${project.address.province}`,
    },
    map: {
      latitude: project.address.latitude || null,
      longitude: project.address.longitude || null,
      point: null,
    },
    images: {
      allImages: project.images,
      imageUrl: project.images[0],
    },
    details: {
      propertyType: project.details.propertyType || '',
      numBathrooms: parseInt(project.details.bathroomRange.split('-')[0]) || 1,
      numBathroomsPlus: parseInt(project.details.bathroomRange.split('-')[1]) || 1,
      numBedrooms: parseInt(project.details.bedroomRange.split('-')[0]) || 1,
      numBedroomsPlus: parseInt(project.details.bedroomRange.split('-')[1]) || 1,
      sqft: project.details.sqftRange || '',
    },
    lot: {
      acres: 0,
      depth: '',
      irregular: '',
      legalDescription: '',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 0,
      features: '',
      taxLot: '',
    },
    preCon: {
      projectName: project.projectName,
      developer: project.developer,
      startingPrice: project.startingPrice,
      status: project.status,
      details: project.details,
      completion: project.completion,
      features: project.features,
      depositStructure: project.depositStructure,
      description: '',
    },
  };
};

type PageType = 'city' | 'status' | 'propertyType' | 'subPropertyType' | 'completionYear';

interface PreConstructionBasePageProps {
  slug: string;
  pageType: PageType;
}

// Helper to format status for display
const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'selling': 'Selling',
    'coming-soon': 'Coming Soon',
    'sold-out': 'Sold Out',
  };
  return statusMap[status.toLowerCase()] || status;
};

// Helper to format property type for display
const formatPropertyType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'condos': 'Condos',
    'houses': 'Houses',
    'lofts': 'Lofts',
    'master-planned-communities': 'Master-Planned Communities',
    'multi-family': 'Multi Family',
    'offices': 'Offices',
  };
  return typeMap[type.toLowerCase()] || type;
};

// Helper to convert property type slug to database value
const slugToPropertyType = (slug: string): string => {
  const typeMap: Record<string, string> = {
    'condos': 'Condos',
    'houses': 'Houses',
    'lofts': 'Lofts',
    'master-planned-communities': 'Master-Planned Communities',
    'multi-family': 'Multi Family',
    'offices': 'Offices',
  };
  return typeMap[slug.toLowerCase()] || slug;
};

// Helper to parse sub-property type slug (e.g., "high-rise-condos" -> { subPropertyType: "High-Rise", propertyType: "Condos" })
const parseSubPropertyTypeSlug = (slug: string): { subPropertyType: string; propertyType: string } | null => {
  const slugLower = slug.toLowerCase();
  
  // Condos sub-types
  if (slugLower.endsWith('-condos')) {
    const subType = slugLower.replace('-condos', '');
    const subTypeMap: Record<string, string> = {
      'high-rise': 'High-Rise',
      'mid-rise': 'Mid-Rise',
      'low-rise': 'Low-Rise',
    };
    if (subTypeMap[subType]) {
      return { subPropertyType: subTypeMap[subType], propertyType: 'Condos' };
    }
  }
  
  // Houses sub-types
  if (slugLower.endsWith('-houses')) {
    const subType = slugLower.replace('-houses', '');
    const subTypeMap: Record<string, string> = {
      'link': 'Link',
      'townhouse': 'Townhouse',
      'semi-detached': 'Semi-Detached',
      'detached': 'Detached',
    };
    if (subTypeMap[subType]) {
      return { subPropertyType: subTypeMap[subType], propertyType: 'Houses' };
    }
  }
  
  return null;
};

// Helper to format sub-property type for display
const formatSubPropertyType = (subType: string, mainType: string): string => {
  return `${subType} ${mainType}`;
};

// Helper to convert status slug to database value
const slugToStatus = (slug: string): string => {
  const statusMap: Record<string, string> = {
    'selling': 'selling',
    'coming-soon': 'coming-soon',
    'sold-out': 'sold-out',
  };
  return statusMap[slug.toLowerCase()] || slug;
};

interface PageContent {
  id: string
  pageType: string
  pageValue: string
  title: string | null
  description: string | null
  heroImage: string | null
  metaTitle: string | null
  metaDescription: string | null
  customContent: string | null
  isPublished: boolean
}

const PreConstructionBasePage: React.FC<PreConstructionBasePageProps> = ({ slug, pageType }) => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [allProjects, setAllProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<{ 
    title: string; 
    numberOfProjects: number; 
    province?: string;
    description?: string;
  } | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'mixed' | 'map'>('list');
  const [selectedProject, setSelectedProject] = useState<PreConstructionProperty | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();

  // Helper to get pageValue from slug based on pageType
  const getPageValue = useMemo(() => {
    if (pageType === 'city') {
      // For city, use the slug as-is (e.g., "toronto")
      return slug.toLowerCase();
    } else if (pageType === 'status') {
      // Map status slug to database value
      return slugToStatus(slug);
    } else if (pageType === 'propertyType') {
      // Map property type slug to database value
      return slugToPropertyType(slug);
    } else if (pageType === 'completionYear') {
      // For completion year, slug is the year
      return slug;
    }
    return null;
  }, [slug, pageType]);

  // Fetch page content
  useEffect(() => {
    const fetchPageContent = async () => {
      if (!getPageValue) return;

      try {
        const response = await fetch(
          `/api/pre-con-projects/page-content?pageType=${pageType}&pageValue=${encodeURIComponent(getPageValue)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.pageContent) {
            setPageContent(data.pageContent);
          }
        }
      } catch (error) {
        console.error('Error fetching page content:', error);
      }
    };

    fetchPageContent();
  }, [pageType, getPageValue]);

  // Build API query based on page type
  const buildApiQuery = useMemo(() => {
    if (pageType === 'city') {
      const cityName = unslugifyCityName(slug);
      return `/api/pre-con-projects?city=${encodeURIComponent(cityName)}`;
    } else if (pageType === 'status') {
      const status = slugToStatus(slug);
      return `/api/pre-con-projects?status=${encodeURIComponent(status)}`;
    } else if (pageType === 'propertyType') {
      const propertyType = slugToPropertyType(slug);
      return `/api/pre-con-projects?propertyType=${encodeURIComponent(propertyType)}`;
    } else if (pageType === 'subPropertyType') {
      const parsed = parseSubPropertyTypeSlug(slug);
      if (parsed) {
        return `/api/pre-con-projects?propertyType=${encodeURIComponent(parsed.propertyType)}&subPropertyType=${encodeURIComponent(parsed.subPropertyType)}`;
      }
    } else if (pageType === 'completionYear') {
      // Slug is the year (e.g., "2025")
      return `/api/pre-con-projects?completionYear=${encodeURIComponent(slug)}`;
    }
    return '';
  }, [slug, pageType]);

  // Fetch pre-construction projects
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (!buildApiQuery) return;

        const response = await fetch(buildApiQuery);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        const fetchedProjects = data.projects || [];

        // Extract province from first project (if available)
        const province = fetchedProjects.length > 0 
          ? (fetchedProjects[0] as PropertyListing).address?.state || 'ON'
          : 'ON';

        // Build page info based on page type
        let title = '';
        let description = '';

        if (pageType === 'city') {
          const cityName = unslugifyCityName(slug);
          title = cityName;
          description = `Discover the latest pre-construction opportunities in ${cityName}. Explore upcoming developments, pricing, and availability.`;
        } else if (pageType === 'status') {
          const statusDisplay = formatStatus(slug);
          title = `${statusDisplay} Pre-Construction Projects`;
          description = `Browse all ${statusDisplay.toLowerCase()} pre-construction projects. Find your perfect new home with Summitly.`;
        } else if (pageType === 'propertyType') {
          const typeDisplay = formatPropertyType(slug);
          title = `${typeDisplay} Pre-Construction Projects`;
          description = `Explore ${typeDisplay.toLowerCase()} pre-construction projects. Discover new developments and find your ideal property.`;
        } else if (pageType === 'subPropertyType') {
          const parsed = parseSubPropertyTypeSlug(slug);
          if (parsed) {
            const typeDisplay = formatSubPropertyType(parsed.subPropertyType, parsed.propertyType);
            title = `${typeDisplay} Pre-Construction Projects`;
            description = `Explore ${typeDisplay.toLowerCase()} pre-construction projects. Discover new developments and find your ideal property.`;
          }
        } else if (pageType === 'completionYear') {
          // Slug is the year (e.g., "2025")
          title = `${slug} Completion Pre-Construction Projects`;
          description = `Discover pre-construction projects completing in ${slug}. Explore upcoming developments, pricing, and availability for projects expected to be ready in ${slug}.`;
        }

        setPageInfo({
          title,
          numberOfProjects: fetchedProjects.length,
          province,
          description,
        });

        setProjects(fetchedProjects);
        setAllProjects(fetchedProjects);
        
        // Extract unique communities from the projects
        const uniqueCommunities = Array.from(
          new Set(
            fetchedProjects
              .map((project: PropertyListing) => project.address?.neighborhood || project.address?.city)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug && buildApiQuery) {
      loadData();
    }
  }, [slug, buildApiQuery, pageType]);

  // Filter projects based on filter state
  useEffect(() => {
    if (allProjects.length === 0) return;

    let filtered = [...allProjects];

    // Filter by property type
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(project => {
        const projectPropertyType = (project.details?.propertyType || project.preCon?.details?.propertyType || '').toLowerCase();
        const filterPropertyType = filters.propertyType.toLowerCase();
        
        // Check if property type matches
        const propertyTypeMatch = projectPropertyType === filterPropertyType ||
          projectPropertyType === filterPropertyType + 's' || // Handle plural (house vs houses)
          projectPropertyType + 's' === filterPropertyType;
        
        // If subPropertyType is also selected, check that too
        if (filters.subPropertyType && filters.subPropertyType !== 'all') {
          const projectSubType = project.preCon?.details?.subPropertyType || '';
          return propertyTypeMatch && projectSubType === filters.subPropertyType;
        }
        
        return propertyTypeMatch;
      });
    }

    // Filter by price
    if (filters.minPrice > 0) {
      filtered = filtered.filter(project => 
        (project.preCon?.startingPrice || project.listPrice || 0) >= filters.minPrice
      );
    }
    if (filters.maxPrice < 2000000) {
      filtered = filtered.filter(project => 
        (project.preCon?.startingPrice || project.listPrice || 0) <= filters.maxPrice
      );
    }

    // Filter by location area (if selected)
    if (filters.locationArea !== 'all') {
      filtered = filtered.filter(project => 
        project.address?.neighborhood?.toLowerCase().includes(filters.locationArea.toLowerCase()) ||
        project.address?.area?.toLowerCase().includes(filters.locationArea.toLowerCase()) ||
        project.address?.city?.toLowerCase().includes(filters.locationArea.toLowerCase())
      );
    }

    setProjects(filtered);
  }, [filters, allProjects]);

  // Convert projects to PreConstructionProperty format
  const preConProjects = useMemo(() => {
    return projects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects]);

  // Convert projects to PropertyListing format for map
  const mapProperties = useMemo(() => {
    return preConProjects.map(convertToPropertyListing);
  }, [preConProjects]);

  // Find selected property for map
  const selectedPropertyForMap = useMemo(() => {
    if (!selectedProject) return null;
    return mapProperties.find(p => p.mlsNumber === selectedProject.id) || null;
  }, [selectedProject, mapProperties]);

  // Update document title and meta tags for SEO - must be called before early returns
  useEffect(() => {
    const title = pageContent?.title || pageInfo?.title || '';
    const metaTitle = pageContent?.metaTitle;
    
    if (metaTitle) {
      document.title = metaTitle;
    } else if (title) {
      document.title = `${title} | Summitly`;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (pageContent?.metaDescription) {
      if (metaDescription) {
        metaDescription.setAttribute('content', pageContent.metaDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = pageContent.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [pageContent, pageInfo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading pre-construction projects...</p>
        </div>
      </div>
    );
  }

  // Use custom content if available and published, otherwise use default
  const displayTitle = pageContent?.title || pageInfo?.title || '';
  const projectCount = pageInfo?.numberOfProjects || 0;
  const province = pageInfo?.province || 'ON';
  const displayCount = projectCount > 0 ? `${projectCount}+` : '120+';

  // Get current date for "Last Updated"
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Build description based on page type - use custom content if available
  const buildDescription = () => {
    // If custom description exists, use it
    if (pageContent?.description) {
      return pageContent.description;
    }
    
    // Otherwise use default descriptions
    if (pageType === 'city') {
      return `${displayCount} Pre construction Homes in ${displayTitle}, ${province} | Explore Floor Plans, Pricing & Availability. Summitly has over ${displayCount.toLowerCase()} pre construction homes from trusted builders in ${displayTitle}, ${province}. If you are looking to buy resale homes, Summitly is your trusted platform to find 1000+ homes for sale in ${displayTitle}. Whether you are looking to downsize to buy townhomes for sale in ${displayTitle} or looking to buy condos in ${displayTitle} for your family or browsing ${displayTitle} detached homes for sale, our platform is updated daily with latest resale listings every hour. For new development homes, easily filter by number of bedrooms (1 to 4+), project type, and construction status from budget-friendly condo to a pre construction homes, contact us to connect you to the most exciting real estate opportunities in ${displayTitle}.`;
    } else if (pageType === 'subPropertyType' || pageType === 'completionYear') {
      return pageInfo?.description || `Explore ${displayTitle.toLowerCase()} pre-construction projects. Discover new developments and find your ideal property.`;
    } else {
      return pageInfo?.description || '';
    }
  };

  // Build heading based on page type
  const buildHeading = () => {
    if (pageType === 'city') {
      return (
        <>
          {displayCount} Pre Construction Homes in <span className='text-secondary'>{displayTitle}</span>
        </>
      );
    } else {
      return (
        <>
          <span className='text-secondary'>{displayCount}</span> {displayTitle}
        </>
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Image Section */}
      {pageContent?.heroImage && (
        <div className="w-full h-64 md:h-96 relative overflow-hidden">
          <img 
            src={pageContent.heroImage} 
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      
      {/* Header Section */}
      <header className="border-b bg-card pt-10">
        <div className="container-1400 mx-auto py-6">
          <div className="flex flex-col justify-between gap-2">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {buildHeading()}
              </h1>
              <div className="space-y-3">
                <p className="text-muted-foreground text-base leading-relaxed">
                  {buildDescription()}
                </p>
                {pageContent?.customContent && (
                  <div 
                    className="text-muted-foreground text-base leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: pageContent.customContent }}
                  />
                )}
                <p className="text-sm text-muted-foreground/80">
                  Last Updated: {lastUpdatedDate}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-end lg:items-end gap-3">
              <p className="text-sm text-muted-foreground text-center lg:text-right">
                Be the first to hear about new properties
              </p>
              <button 
                onClick={() => {
                  toast({
                    title: "Alerts Coming Soon",
                    description: "Property alerts for pre-construction projects will be available soon.",
                    variant: "default",
                  });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm font-medium whitespace-nowrap"
              >
                <Bell className="w-5 h-5" />
                <span>Alert Me of New Properties</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">
        
        {/* Navigation Buttons */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pageType === 'city' && (
              <>
                <Link
                  href={`/${slug}/trends`}
                  className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Market Trends
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Explore housing market statistics and price trends for {displayTitle}
                    </p>
                  </div>
                </Link>

                <Link
                  href={`/${slug}/neighbourhoods`}
                  className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Neighbourhoods
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Discover different neighbourhoods and areas in {displayTitle}
                    </p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </section>
        <Separator />

        {/* Filters */}
        <section>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <GlobalFilters
                filters={filters}
                handleFilterChange={handleFilterChange}
                resetFilters={resetFilters}
                communities={communities}
                locations={LOCATIONS}
                showLocation={false}
                showPropertyType={true}
                showCommunity={false}
                showPrice={true}
                showBedrooms={false}
                showBathrooms={false}
                showAdvanced={true}
                showSellRentToggle={false}
                layout="horizontal"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Project Listings */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2">
                Projects {preConProjects.length}
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Sort by Date (Newest)
              </div>
              <div className="flex">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-l-lg ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="List View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-xs font-medium">List</span>
                </button>
                <button
                  onClick={() => setViewMode('mixed')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all ${
                    viewMode === 'mixed'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="Mixed View"
                >
                  <div className="flex gap-0.5 items-center">
                    <LayoutGrid className="w-3 h-3" />
                    <MapPin className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium">Mixed</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-r-lg ${
                    viewMode === 'map'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="Map View"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* View Content */}
          <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
            {/* Project Listings */}
            {(viewMode === 'list' || viewMode === 'mixed') && (
              <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'mixed' ? 'calc(100vh - 200px)' : 'auto' }}>
                {preConProjects.length > 0 ? (
                  <div className={`grid gap-6 ${
                    viewMode === 'mixed' 
                      ? 'grid-cols-1 sm:grid-cols-2' 
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {preConProjects.map((project) => (
                      <div
                        key={project.id}
                        className={`cursor-pointer transition-all ${
                          selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <PreConstructionPropertyCardV3
                          property={project}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-secondary/30 rounded-lg p-12 text-center">
                    <p className="text-lg text-muted-foreground">
                      No pre-construction projects found{pageType === 'city' ? ` in ${displayTitle}` : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'mixed') && (
              <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} style={{ height: viewMode === 'mixed' ? 'calc(100vh - 200px)' : '70vh' }}>
                <GooglePropertyMap
                  properties={mapProperties}
                  selectedProperty={selectedPropertyForMap}
                  onPropertySelect={(property) => {
                    if (property) {
                      const project = preConProjects.find(p => p.id === property.mlsNumber);
                      if (project) {
                        setSelectedProject(project);
                      }
                    }
                  }}
                  onBoundsChange={() => {}}
                />
              </div>
            )}
          </div>
        </section>

        {/* Blog Section */}
        <section>
          <BlogSection
            category="Pre-construction"
            heading={(() => {
              if (pageType === 'city') {
                return `Latest News and Insight in ${displayTitle}`;
              } else if (pageType === 'status') {
                return `Latest News and Insights for ${displayTitle}`;
              } else if (pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
                return `Latest News and Insights for ${displayTitle}`;
              }
              return 'Latest Pre-Construction News and Insights';
            })()}
            subheading="Stay Informed"
            description={(() => {
              if (pageType === 'city') {
                return `Discover the latest news, market insights, and expert advice about pre-construction properties in ${displayTitle}, ${province}. Stay ahead with Summitly's comprehensive coverage of the real estate market.`;
              } else if (pageType === 'status') {
                return `Stay updated with the latest news, market trends, and expert insights about ${displayTitle.toLowerCase()}. Get valuable information to help you make informed decisions with Summitly.`;
              } else if (pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
                return `Explore the latest news, market insights, and expert advice about ${displayTitle.toLowerCase()}. Stay informed with Summitly's comprehensive coverage of pre-construction real estate.`;
              }
              return 'Discover the latest news, market insights, and expert advice about pre-construction properties. Stay ahead with Summitly\'s comprehensive coverage of the real estate market.';
            })()}
            limit={3}
            viewAllLink={(() => {
              if (pageType === 'city') {
                return `/blogs?category=Pre-construction&search=${encodeURIComponent(displayTitle)}`;
              } else if (pageType === 'status') {
                const statusSlug = slug.toLowerCase();
                return `/blogs?category=Pre-construction&search=${encodeURIComponent(statusSlug)}`;
              } else if (pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
                return `/blogs?category=Pre-construction&search=${encodeURIComponent(displayTitle)}`;
              }
              return '/blogs?category=Pre-construction';
            })()}
          />
        </section>
      </main>
    </div>
  );
};

export default PreConstructionBasePage;

