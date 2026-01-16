import { useEffect, useState, useMemo, useCallback } from 'react';
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
  convertApiV1ToPropertyListing,
  type ApiV1Project,
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [_totalProjects, setTotalProjects] = useState(0);
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

  // Build base API query (without pagination params) based on page type
  const buildBaseApiQuery = useMemo(() => {
    // Helper to add city filter if location is provided
    const addCityFilter = (baseQuery: string): string => {
      if (locationType === 'city' && locationName) {
        return `${baseQuery}&city=${encodeURIComponent(locationName)}`;
      }
      return baseQuery;
    };

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
      return `/api/v1/pre-con-projects?city=${encodeURIComponent(cityName)}`;
    } else if (pageType === 'status') {
      const status = slugToStatus(slug);
      const baseQuery = `/api/v1/pre-con-projects?status=${encodeURIComponent(status)}`;
      return addCityFilter(baseQuery);
    } else if (pageType === 'propertyType') {
      const propertyType = slugToPropertyType(slug);
      const baseQuery = `/api/v1/pre-con-projects?propertyType=${encodeURIComponent(propertyType)}`;
      return addCityFilter(baseQuery);
    } else if (pageType === 'subPropertyType') {
      const parsed = parseSubPropertyTypeSlug(slug);
      if (parsed) {
        const baseQuery = `/api/v1/pre-con-projects?propertyType=${encodeURIComponent(parsed.propertyType)}&subPropertyType=${encodeURIComponent(parsed.subPropertyType)}`;
        return addCityFilter(baseQuery);
      }
    } else if (pageType === 'completionYear') {
      const baseQuery = `/api/v1/pre-con-projects?completionYear=${encodeURIComponent(slug)}`;
      const finalQuery = addCityFilter(baseQuery);
      console.log('[PreConstructionBasePage] Building completionYear API query:', {
        slug,
        locationType,
        locationName,
        baseQuery,
        finalQuery,
      });
      return finalQuery;
    } else if (['developer', 'architect', 'interior-designer', 'builder', 'landscape-architect', 'marketing'].includes(pageType)) {
      // For development team pages, fetch by developer name
      const developerName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      return `/api/v1/pre-con-projects?developer=${encodeURIComponent(developerName)}`;
    }
    return '';
  }, [slug, pageType, locationType, locationName]);

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

  // Load projects function (supports pagination)
  const loadProjects = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!buildBaseApiQuery) return;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const limit = 12;
      
      // Add filter parameters to API query
      const filterParams: string[] = [];
      
      // Add bedroom filter
      if (filters.bedrooms) {
        filterParams.push(`bedrooms=${filters.bedrooms}`);
      }
      
      // Add bathroom filter
      if (filters.bathrooms) {
        filterParams.push(`bathrooms=${filters.bathrooms}`);
      }
      
      // Add price range filters
      if (filters.minPrice) {
        filterParams.push(`minPrice=${filters.minPrice}`);
      }
      if (filters.maxPrice) {
        filterParams.push(`maxPrice=${filters.maxPrice}`);
      }
      
      // Add sqft filters
      if (filters.minSquareFeet) {
        filterParams.push(`minSqft=${filters.minSquareFeet}`);
      }
      if (filters.maxSquareFeet) {
        filterParams.push(`maxSqft=${filters.maxSquareFeet}`);
      }
      
      const filterQuery = filterParams.length > 0 ? `&${filterParams.join('&')}` : '';
      const apiQuery = `${buildBaseApiQuery}&limit=${limit}&page=${page}${filterQuery}`;
      
      console.log('[PreConstructionBasePage] Fetching projects with query:', {
        apiQuery,
        pageType,
        slug,
        locationType,
        locationName,
        page,
        limit,
        filters,
      });
      const response = await fetch(apiQuery);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[PreConstructionBasePage] API error response:', errorText);
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[PreConstructionBasePage] API response:', {
        success: data.success,
        hasData: !!data.data,
        projectsCount: data.data?.projects?.length || data.projects?.length || 0,
        meta: data.meta,
        rawData: data,
      });
      
      // Handle v1 API response format: { success, data: { projects }, meta: { pagination } }
      const apiProjects = data.success && data.data 
        ? (data.data.projects || [])
        : (data.projects || []);
      
      console.log('[PreConstructionBasePage] Extracted projects:', {
        count: apiProjects.length,
        firstProject: apiProjects[0] ? {
          mlsNumber: apiProjects[0].mlsNumber,
          projectName: apiProjects[0].projectName,
          city: apiProjects[0].city,
          occupancyDate: apiProjects[0].occupancyDate,
        } : null,
      });
      
      // Convert v1 API format to PropertyListing format
      const fetchedProjects = apiProjects.map((apiProject: ApiV1Project) => 
        convertApiV1ToPropertyListing(apiProject)
      );
      
      console.log('[PreConstructionBasePage] Converted projects:', {
        count: fetchedProjects.length,
        firstProject: fetchedProjects[0] ? {
          mlsNumber: fetchedProjects[0].mlsNumber,
          hasPreCon: !!fetchedProjects[0].preCon,
        } : null,
      });
      
      const pagination = data.meta?.pagination || data.pagination;
      const total = pagination?.total || fetchedProjects.length;
      const totalPages = pagination?.totalPages || Math.ceil(total / limit);
      
      console.log('[PreConstructionBasePage] Fetched projects:', {
        count: fetchedProjects.length,
        page,
        total,
        totalPages,
        hasMore: page < totalPages,
      });

      if (append) {
        setAllProjects(prev => [...prev, ...fetchedProjects]);
      } else {
        setAllProjects(fetchedProjects);
        setCurrentPage(1); // Reset to 1 for new loads
      }
      
      setTotalProjects(total);
      const hasMorePages = page < totalPages;
      setHasMore(hasMorePages);
      // Only update currentPage if appending, otherwise it's already set to 1 above
      if (append) {
        setCurrentPage(page);
      }
      
      console.log('[PreConstructionBasePage] Pagination state updated:', {
        page,
        totalPages,
        hasMore: hasMorePages,
        currentPage: append ? page : 1,
        append,
        fetchedCount: fetchedProjects.length,
      });

      // Extract province from first project (if available)
      const province = fetchedProjects.length > 0 
        ? (fetchedProjects[0] as PropertyListing).address?.state || 'ON'
        : 'ON';

      // Build page info based on page type (only on initial load)
      if (!append) {
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
          // Include city name if available
          if (locationType === 'city' && locationName) {
            title = `${slug} Completion Pre-Construction Projects in ${locationName}`;
            description = `Discover pre-construction projects completing in ${slug} in ${locationName}. Explore upcoming developments, pricing, and availability for projects expected to be ready in ${slug}.`;
          } else {
            title = `${slug} Completion Pre-Construction Projects`;
            description = `Discover pre-construction projects completing in ${slug}. Explore upcoming developments, pricing, and availability for projects expected to be ready in ${slug}.`;
          }
        } else if (['developer', 'architect', 'interior-designer', 'builder', 'landscape-architect', 'marketing'].includes(pageType)) {
          const developerName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
          try {
            const teamResponse = await fetch(`/api/development-team/${teamType || pageType}/${slug}`);
            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              const teamMember = teamData.teamMember;
              if (teamMember) {
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
          numberOfProjects: total,
          province,
          description,
        });

        // Extract unique communities from all projects (will be updated as more load)
        const uniqueCommunities = Array.from(
          new Set(
            fetchedProjects
              .map((project: PropertyListing) => project.address?.neighborhood || project.address?.city)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } else {
        // Update communities when loading more
        setCommunities(prev => {
          const newCommunities = Array.from(
            new Set([
              ...prev,
              ...fetchedProjects
                .map((project: PropertyListing) => project.address?.neighborhood || project.address?.city)
                .filter(Boolean) as string[]
            ])
          ).sort();
          return newCommunities;
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildBaseApiQuery, pageType, slug, teamType]);

  // Load more projects function
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      console.log('[PreConstructionBasePage] loadMore blocked:', { loadingMore, hasMore });
      return;
    }
    const nextPage = currentPage + 1;
    console.log('[PreConstructionBasePage] Loading more projects, page:', nextPage, 'currentPage:', currentPage);
    await loadProjects(nextPage, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProjects, currentPage, loadingMore, hasMore]);

  // Initial fetch pre-construction projects
  useEffect(() => {
    if (slug && buildBaseApiQuery) {
      loadProjects(1, false);
    }
  }, [slug, buildBaseApiQuery, loadProjects]);

  // Reset pagination and reload data when filters change
  useEffect(() => {
    if (allProjects.length > 0 && buildBaseApiQuery) {
      // Reset pagination state
      setCurrentPage(1);
      setHasMore(true);
      // Clear existing projects and reload from page 1
      setAllProjects([]);
      setProjects([]);
      loadProjects(1, false);
    }
  }, [filters.bedrooms, filters.bathrooms, filters.propertyType, filters.minPrice, filters.maxPrice, filters.locationArea, buildBaseApiQuery, loadProjects]);

  // Filter projects based on filter state
  useEffect(() => {
    if (allProjects.length === 0) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps

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
          project.preCon?.details?.bedroomRange ||
          (project as PropertyListing & { bedroomRange?: string }).bedroomRange; // Direct property (fallback)
        
        if (!bedroomRange) {
          // If no bedroom range, check units for bedroom count
          const units = project.preCon?.units || [];
          if (units.length > 0) {
            // Check if any unit has the required bedrooms
            return units.some((unit) => {
              const unitBedrooms = unit.beds || 0;
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
        // Check if project has bathroom range in preCon details
        const bathroomRange = project.preCon?.details?.bathroomRange;
        if (!bathroomRange) {
          // If no bathroom range, check units for bathroom count
          const units = project.preCon?.units || [];
          if (units.length > 0) {
            // Check if any unit has the required bathrooms
            return units.some(unit => {
              const unitBathrooms = unit.baths || 0;
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
    const converted = projects.map(convertToPreConProperty);
    const valid = converted.filter((project): project is PreConstructionProperty => project !== null);
    const invalid = converted.filter(project => project === null);
    
    if (invalid.length > 0) {
      console.warn('[PreConstructionBasePage] Projects filtered out during conversion:', invalid.length);
      console.warn('[PreConstructionBasePage] Sample invalid project:', projects[converted.indexOf(null)]);
    }
    
    console.log('[PreConstructionBasePage] Project conversion:', {
      total: projects.length,
      valid: valid.length,
      invalid: invalid.length,
    });
    
    return valid;
  }, [projects]);

  // Convert projects to PropertyListing format for map
  const mapProperties = useMemo(() => {
    return preConProjects.map(convertToPropertyListing);
  }, [preConProjects]);

  return {
    projects,
    allProjects,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    pageInfo,
    pageContent,
    communities,
    preConProjects,
    mapProperties,
    teamMemberInfo,
  };
};

