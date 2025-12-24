import { useEffect, useState, useMemo } from 'react';
import type { PropertyListing } from '@/lib/types';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import type { PageType, PageContent, PageInfo } from './types';
import type { FilterState } from '@/lib/types/filters';
import { 
  unslugifyCityName, 
  slugToStatus, 
  slugToPropertyType, 
  parseSubPropertyTypeSlug,
  formatStatus,
  formatPropertyType,
  formatSubPropertyType,
  convertToPreConProperty,
  convertToPropertyListing,
} from './utils';

interface UsePreConProjectsDataProps {
  slug: string;
  pageType: PageType;
  filters: FilterState;
  teamType?: string; // For development team pages: 'developer', 'architect', etc.
  locationType?: 'city' | 'neighbourhood' | 'intersection' | null;
  locationName?: string | null;
}

export const usePreConProjectsData = ({ slug, pageType, filters, teamType, locationType, locationName }: UsePreConProjectsDataProps) => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [allProjects, setAllProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [teamMemberInfo, setTeamMemberInfo] = useState<{
    id: string;
    name: string;
    image: string | null;
    description: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
  } | null>(null);

  // Helper to get pageValue from slug based on pageType
  const getPageValue = useMemo(() => {
    if (pageType === 'by-location') {
      return slug.toLowerCase();
    } else if (pageType === 'status') {
      return slugToStatus(slug);
    } else if (pageType === 'propertyType') {
      return slugToPropertyType(slug);
    } else if (pageType === 'completionYear') {
      return slug;
    } else if (['developer', 'architect', 'interior-designer', 'builder', 'landscape-architect', 'marketing'].includes(pageType)) {
      // For development team pages, convert slug to name
      return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
    return null;
  }, [slug, pageType]);

  // Build API query based on page type
  const buildApiQuery = useMemo(() => {
    if (pageType === 'by-location') {
      // Extract city name from slug (handle cases where slug might include filters like "toronto/2-beds")
      // Split by '/' and take the first part (city)
      const slugParts = slug.split('/');
      const citySlug = slugParts[0];
      const cityName = unslugifyCityName(citySlug);
      console.log('[PreConstructionBasePage] Building API query:', {
        slug,
        citySlug,
        cityName,
      });
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
      return `/api/pre-con-projects?completionYear=${encodeURIComponent(slug)}`;
    } else if (['developer', 'architect', 'interior-designer', 'builder', 'landscape-architect', 'marketing'].includes(pageType)) {
      // For development team pages, fetch by developer name
      const developerName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      return `/api/pre-con-projects?developer=${encodeURIComponent(developerName)}`;
    }
    return '';
  }, [slug, pageType]);

  // Fetch page content
  useEffect(() => {
    const fetchPageContent = async () => {
      if (!getPageValue) return;

      try {
        // Use 'by-location' as pageType for location pages when fetching page content
        const apiPageType = pageType === 'by-location' ? 'by-location' : pageType;
        const response = await fetch(
          `/api/pre-con-projects/page-content?pageType=${apiPageType}&pageValue=${encodeURIComponent(getPageValue)}`
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

  // Fetch pre-construction projects
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (!buildApiQuery) return;

        console.log('[PreConstructionBasePage] Fetching projects with query:', buildApiQuery);
        const response = await fetch(buildApiQuery);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        const fetchedProjects = data.projects || [];
        console.log('[PreConstructionBasePage] Fetched projects:', {
          count: fetchedProjects.length,
          query: buildApiQuery,
          firstProject: fetchedProjects[0] ? {
            mlsNumber: fetchedProjects[0].mlsNumber,
            city: fetchedProjects[0].address?.city,
            bedroomRange: fetchedProjects[0].preCon?.details?.bedroomRange || fetchedProjects[0].details?.bedroomRange,
          } : null,
        });

        // Extract province from first project (if available)
        const province = fetchedProjects.length > 0 
          ? (fetchedProjects[0] as PropertyListing).address?.state || 'ON'
          : 'ON';

        // Build page info based on page type
        let title = '';
        let description = '';

        if (pageType === 'by-location') {
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
          title = `${slug} Completion Pre-Construction Projects`;
          description = `Discover pre-construction projects completing in ${slug}. Explore upcoming developments, pricing, and availability for projects expected to be ready in ${slug}.`;
        } else if (['developer', 'architect', 'interior-designer', 'builder', 'landscape-architect', 'marketing'].includes(pageType)) {
          // For development team pages, fetch team member info
          const developerName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
          try {
            const teamResponse = await fetch(`/api/development-team/${teamType || pageType}/${slug}`);
            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              const teamMember = teamData.teamMember;
              if (teamMember) {
                // Store team member info for use in HeroSection
                setTeamMemberInfo({
                  id: teamMember.id,
                  name: teamMember.name,
                  image: teamMember.image,
                  description: teamMember.description,
                  website: teamMember.website,
                  email: teamMember.email,
                  phone: teamMember.phone,
                });
                
                const typeLabels: Record<string, string> = {
                  'developer': 'Developer',
                  'architect': 'Architect',
                  'interior-designer': 'Interior Designer',
                  'builder': 'Builder',
                  'landscape-architect': 'Landscape Architect',
                  'marketing': 'Marketing',
                };
                const typeLabel = typeLabels[pageType] || 'Development Team Member';
                title = teamMember.name;
                description = teamMember.description || `Explore pre-construction projects by ${teamMember.name}, a leading ${typeLabel.toLowerCase()} in the industry.`;
              } else {
                title = developerName;
                description = `Explore pre-construction projects by ${developerName}.`;
              }
            } else {
              title = developerName;
              description = `Explore pre-construction projects by ${developerName}.`;
            }
          } catch (error) {
            console.error('Error fetching team member info:', error);
            title = developerName;
            description = `Explore pre-construction projects by ${developerName}.`;
          }
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
  }, [slug, buildApiQuery, pageType, teamType]);

  // Filter projects based on filter state
  useEffect(() => {
    if (allProjects.length === 0) return;

    let filtered = [...allProjects];
    
    console.log('[PreConstructionBasePage] Starting filter with:', {
      totalProjects: allProjects.length,
      filters: {
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        propertyType: filters.propertyType,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      },
    });

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

    // Filter by location (neighbourhood or intersection) if provided
    if (locationType && locationName) {
      filtered = filtered.filter(project => {
        if (locationType === 'neighbourhood') {
          const projectNeighbourhood = project.address?.neighborhood?.toLowerCase() || '';
          const searchNeighbourhood = locationName.toLowerCase();
          return projectNeighbourhood === searchNeighbourhood || 
                 projectNeighbourhood.includes(searchNeighbourhood) || 
                 searchNeighbourhood.includes(projectNeighbourhood);
        } else if (locationType === 'intersection') {
          const projectIntersection = project.address?.majorIntersection?.toLowerCase() || '';
          const searchIntersection = locationName.toLowerCase();
          return projectIntersection === searchIntersection || 
                 projectIntersection.includes(searchIntersection) || 
                 searchIntersection.includes(projectIntersection);
        }
        return true;
      });
    }

    // Filter by bedrooms
    if (filters.bedrooms > 0) {
      const beforeFilterCount = filtered.length;
      filtered = filtered.filter(project => {
        // Check multiple possible locations for bedroomRange
        const bedroomRange = 
          project.details?.bedroomRange || 
          project.preCon?.details?.bedroomRange ||
          (project as PropertyListing & { bedroomRange?: string }).bedroomRange; // Direct property
        
        if (!bedroomRange) {
          // If no bedroom range, check units for bedroom count
          const units = project.preCon?.units || (project as PropertyListing & { units?: Array<{ beds?: number; numBedrooms?: number; details?: { numBedrooms?: number } }> }).units || [];
          if (units.length > 0) {
            // Check if any unit has the required bedrooms
            return units.some((unit) => {
              const unitBedrooms = unit.details?.numBedrooms || unit.beds || unit.numBedrooms || 0;
              return unitBedrooms >= filters.bedrooms;
            });
          }
          // If no units and no range, exclude the project
          console.log('[PreConstructionBasePage] Project excluded - no bedroom data:', {
            mlsNumber: project.mlsNumber,
            projectName: (project as PropertyListing & { projectName?: string }).projectName,
            hasDetails: !!project.details,
            hasPreCon: !!project.preCon,
            detailsKeys: project.details ? Object.keys(project.details) : [],
          });
          return false;
        }
        
        // Parse bedroom range (e.g., "1-3" or "2-4")
        // Handle different formats: "1-3", "2+", "2", etc.
        let minBeds = 0;
        let maxBeds = Infinity;
        
        if (bedroomRange.includes('-')) {
          const parts = bedroomRange.split('-');
          minBeds = parseInt(parts[0]) || 0;
          maxBeds = parseInt(parts[1]) || Infinity;
        } else if (bedroomRange.includes('+')) {
          minBeds = parseInt(bedroomRange.replace('+', '')) || 0;
          maxBeds = Infinity;
        } else {
          // Single number, treat as exact
          minBeds = parseInt(bedroomRange) || 0;
          maxBeds = minBeds;
        }
        
        // Include project if the filter bedrooms falls within the range
        // e.g., if range is "1-3" and filter is 2, include it (has 2-bedroom units)
        // if range is "2-4" and filter is 2, include it (has 2-bedroom units)
        // if range is "3-4" and filter is 2, exclude it (no 2-bedroom units)
        const matches = filters.bedrooms >= minBeds && filters.bedrooms <= maxBeds;
        
        if (!matches) {
          console.log('[PreConstructionBasePage] Project excluded by bedroom filter:', {
            mlsNumber: project.mlsNumber,
            bedroomRange,
            minBeds,
            maxBeds,
            filterBedrooms: filters.bedrooms,
          });
        }
        return matches;
      });
      console.log('[PreConstructionBasePage] Bedroom filter applied:', {
        filterBedrooms: filters.bedrooms,
        beforeFilter: beforeFilterCount,
        afterFilter: filtered.length,
        filteredCount: filtered.length,
      });
    }

    // Filter by bathrooms
    if (filters.bathrooms > 0) {
      filtered = filtered.filter(project => {
        // Check if project has bathroom range in details
        const bathroomRange = project.details?.bathroomRange || project.preCon?.details?.bathroomRange;
        if (!bathroomRange) {
          // If no bathroom range, check units for bathroom count
          const units = project.preCon?.units || [];
          if (units.length > 0) {
            // Check if any unit has the required bathrooms
            return units.some(unit => {
              const unitBathrooms = unit.details?.numBathrooms || 0;
              return unitBathrooms >= filters.bathrooms;
            });
          }
          return false;
        }
        
        // Parse bathroom range (e.g., "1-2" or "2-3")
        const [minBaths] = bathroomRange.split('-').map(Number);
        return minBaths >= filters.bathrooms;
      });
      console.log('[PreConstructionBasePage] Bathroom filter applied:', {
        filterBathrooms: filters.bathrooms,
        filteredCount: filtered.length,
      });
    }

    setProjects(filtered);
  }, [filters, allProjects, locationType, locationName]);

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

  return {
    projects,
    allProjects,
    loading,
    pageInfo,
    pageContent,
    communities,
    preConProjects,
    mapProperties,
    teamMemberInfo,
  };
};

