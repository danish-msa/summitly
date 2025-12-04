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
}

export const usePreConProjectsData = ({ slug, pageType, filters, teamType }: UsePreConProjectsDataProps) => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [allProjects, setAllProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [teamMemberInfo, setTeamMemberInfo] = useState<any>(null);

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

