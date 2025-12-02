import { NextRequest, NextResponse } from 'next/server';

const LOCAL_LOGIC_CLIENT_ID = process.env.LOCAL_LOGIC_CLIENT_ID;
const LOCAL_LOGIC_CLIENT_SECRET = process.env.LOCAL_LOGIC_CLIENT_SECRET;
const LOCAL_LOGIC_API_BASE = 'https://api.locallogic.co';

// Demographic data interfaces
export interface DemographicStats {
  population: number;
  averageAge: number;
  averageIncome: number;
  renters: number;
  householdSize: number;
  single: number;
  householdsWithChildren: number;
  notInLabourForce: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
  percentage?: number;
}

export interface DemographicsData {
  stats: DemographicStats;
  charts: {
    income: ChartDataItem[];
    age: ChartDataItem[];
    occupation: ChartDataItem[];
    ethnicity: ChartDataItem[];
    language: ChartDataItem[];
    yearBuilt: ChartDataItem[];
    propertyType: ChartDataItem[];
    commute: ChartDataItem[];
  };
  disseminationArea?: string;
  lastUpdated?: string;
}

// Local Logic API response types
interface LocalLogicDistributionItem {
  range?: string;
  label?: string;
  name?: string;
  category?: string;
  language?: string;
  type?: string;
  method?: string;
  count?: number;
  value?: number;
  percentage?: number;
}

interface LocalLogicStats {
  population?: number;
  total_population?: number;
  average_age?: number;
  median_age?: number;
  average_household_income?: number;
  median_household_income?: number;
  renters_percentage?: number;
  renter_rate?: number;
  average_household_size?: number;
  median_household_size?: number;
  single_person_households_percentage?: number;
  households_with_children?: number;
  not_in_labour_force_percentage?: number;
}

interface LocalLogicDemographics {
  stats?: LocalLogicStats;
  distributions?: {
    income?: LocalLogicDistributionItem[];
    household_income?: LocalLogicDistributionItem[];
    age?: LocalLogicDistributionItem[];
    occupation?: LocalLogicDistributionItem[];
    employment?: LocalLogicDistributionItem[];
    ethnicity?: LocalLogicDistributionItem[];
    visible_minority?: LocalLogicDistributionItem[];
    language?: LocalLogicDistributionItem[];
    mother_tongue?: LocalLogicDistributionItem[];
    year_built?: LocalLogicDistributionItem[];
    housing_age?: LocalLogicDistributionItem[];
    property_type?: LocalLogicDistributionItem[];
    housing_type?: LocalLogicDistributionItem[];
    commute?: LocalLogicDistributionItem[];
    commute_method?: LocalLogicDistributionItem[];
  };
}

interface LocalLogicApiResponse {
  demographics?: LocalLogicDemographics;
  dissemination_area?: string;
  da_code?: string;
  last_updated?: string;
}

interface LocalLogicTokenResponse {
  access_token?: string;
}

/**
 * Get access token from Local Logic API
 */
async function getLocalLogicAccessToken(): Promise<string | null> {
  if (!LOCAL_LOGIC_CLIENT_ID || !LOCAL_LOGIC_CLIENT_SECRET) {
    return null;
  }

  try {
    const tokenUrl = `${LOCAL_LOGIC_API_BASE}/oauth/token?client_id=${LOCAL_LOGIC_CLIENT_ID}&client_secret=${LOCAL_LOGIC_CLIENT_SECRET}`;
    const response = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Local Logic token request failed:', response.statusText);
      return null;
    }

    const data = (await response.json()) as LocalLogicTokenResponse;
    return data.access_token || null;
  } catch (error) {
    console.error('Error getting Local Logic access token:', error);
    return null;
  }
}

/**
 * Transform Local Logic demographics data to our format
 */
function transformLocalLogicData(localLogicData: LocalLogicApiResponse): DemographicsData {
  // Extract demographic data from Local Logic response
  const demographics = localLogicData.demographics || {};
  const stats = demographics.stats || {};
  const distributions = demographics.distributions || {};

  // Transform statistics
  const transformedStats: DemographicStats = {
    population: stats.population || stats.total_population || 0,
    averageAge: stats.average_age || stats.median_age || 0,
    averageIncome: stats.average_household_income || stats.median_household_income || 0,
    renters: stats.renters_percentage || stats.renter_rate || 0,
    householdSize: stats.average_household_size || stats.median_household_size || 0,
    single: stats.single_person_households_percentage || 0,
    householdsWithChildren: stats.households_with_children || 0,
    notInLabourForce: stats.not_in_labour_force_percentage || 0,
  };

  // Transform income distribution
  const incomeDistribution = distributions.income || distributions.household_income || [];
  const incomeChart: ChartDataItem[] = incomeDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.range || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage || ((item.count || 0) / (transformedStats.population || 1)) * 100,
  }));

  // Transform age distribution
  const ageDistribution = distributions.age || [];
  const ageChart: ChartDataItem[] = ageDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.range || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage,
  }));

  // Transform occupation distribution
  const occupationDistribution = distributions.occupation || distributions.employment || [];
  const occupationChart: ChartDataItem[] = occupationDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.category || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage,
  }));

  // Transform ethnicity distribution
  const ethnicityDistribution = distributions.ethnicity || distributions.visible_minority || [];
  const ethnicityChart: ChartDataItem[] = ethnicityDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.category || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage,
  }));

  // Transform language distribution
  const languageDistribution = distributions.language || distributions.mother_tongue || [];
  const languageChart: ChartDataItem[] = languageDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.language || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage,
  }));

  // Transform year built distribution
  const yearBuiltDistribution = distributions.year_built || distributions.housing_age || [];
  const yearBuiltChart: ChartDataItem[] = yearBuiltDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.range || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage,
  }));

  // Transform property type distribution
  const propertyTypeDistribution = distributions.property_type || distributions.housing_type || [];
  const propertyTypeChart: ChartDataItem[] = propertyTypeDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.type || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage,
  }));

  // Transform commute method distribution
  const commuteDistribution = distributions.commute || distributions.commute_method || [];
  const commuteChart: ChartDataItem[] = commuteDistribution.map((item: LocalLogicDistributionItem) => ({
    name: item.method || item.label || item.name || 'Unknown',
    value: item.count || item.value || 0,
    percentage: item.percentage,
  }));

  return {
    stats: transformedStats,
    charts: {
      income: incomeChart,
      age: ageChart,
      occupation: occupationChart,
      ethnicity: ethnicityChart,
      language: languageChart,
      yearBuilt: yearBuiltChart,
      propertyType: propertyTypeChart,
      commute: commuteChart,
    },
    disseminationArea: localLogicData.dissemination_area || localLogicData.da_code,
    lastUpdated: localLogicData.last_updated || new Date().toISOString(),
  };
}

/**
 * Fetch demographic data from Local Logic API
 */
async function fetchDemographicData(
  lat: number,
  lng: number
): Promise<DemographicsData | null> {
  if (!LOCAL_LOGIC_CLIENT_ID || !LOCAL_LOGIC_CLIENT_SECRET) {
    return null;
  }

  try {
    // Get access token
    const accessToken = await getLocalLogicAccessToken();
    if (!accessToken) {
      console.error('Failed to get Local Logic access token');
      return null;
    }

    // Fetch demographics data from Local Logic API
    // NOTE: The endpoint structure may vary. Check Local Logic documentation for the correct endpoint.
    // Common patterns: /v1/demographics, /v1/location/demographics, /v1/locations/{id}/demographics
    // The API might also require different parameter names (lat/lng vs latitude/longitude)
    
    // Try primary endpoint
    let demographicsUrl = `${LOCAL_LOGIC_API_BASE}/v1/demographics?lat=${lat}&lng=${lng}`;
    let response = await fetch(demographicsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    // If primary endpoint fails, try alternative endpoint structures
    if (!response.ok) {
      console.warn('Primary Local Logic endpoint failed, trying alternatives...');
      
      // Try alternative 1: Different parameter names
      demographicsUrl = `${LOCAL_LOGIC_API_BASE}/v1/demographics?latitude=${lat}&longitude=${lng}`;
      response = await fetch(demographicsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
    }

    if (!response.ok) {
      // Try alternative 2: Different endpoint path
      demographicsUrl = `${LOCAL_LOGIC_API_BASE}/v1/location/demographics?lat=${lat}&lng=${lng}`;
      response = await fetch(demographicsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
    }

    if (!response.ok) {
      console.error('All Local Logic API endpoints failed:', response.status, response.statusText);
      const errorText = await response.text().catch(() => '');
      console.error('Error response:', errorText);
      return null;
    }

    const data = (await response.json()) as LocalLogicApiResponse;
    return transformLocalLogicData(data);
  } catch (error) {
    console.error('Error fetching demographic data from Local Logic:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Fetch demographic data from Local Logic API
    const demographicData = await fetchDemographicData(lat, lng);

    if (!demographicData) {
      // Check if Local Logic credentials are configured
      if (!LOCAL_LOGIC_CLIENT_ID || !LOCAL_LOGIC_CLIENT_SECRET) {
        return NextResponse.json(
          {
            error: 'Local Logic API credentials not configured',
            message: 'Please set LOCAL_LOGIC_CLIENT_ID and LOCAL_LOGIC_CLIENT_SECRET environment variables to enable demographic data.',
            coordinates: { lat, lng },
          },
          { status: 503 } // Service Unavailable
        );
      }

      // Return error if credentials are set but API call failed
      return NextResponse.json(
        {
          error: 'Failed to fetch demographic data from Local Logic API',
          message: 'The API request failed. Please check your Local Logic API credentials and ensure the service is available.',
          coordinates: { lat, lng },
        },
        { status: 502 } // Bad Gateway
      );
    }

    return NextResponse.json(demographicData);
  } catch (error) {
    console.error('Error fetching demographics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch demographics' },
      { status: 500 }
    );
  }
}

