import { useState, useEffect } from "react";
import { DemographicsProps } from './types';
import { StatisticsGrid } from './StatisticsGrid';
import { DemographicsMap } from './DemographicsMap';
import { DemographicsTabs } from './DemographicsTabs';
import { DemographicStats, ChartDataItem } from './types';

interface DemographicsData {
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

const NeighbourhoodDemographics = ({ latitude, longitude, address }: DemographicsProps) => {
  const [activeTab, setActiveTab] = useState("income");
  const [demographicsData, setDemographicsData] = useState<DemographicsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemographics = async () => {
      if (!latitude || !longitude) {
        setError('Location coordinates are required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/demographics?lat=${latitude}&lng=${longitude}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Check if it's a service unavailable error (not configured)
          if (response.status === 503) {
            setError(
              errorData.message || 
              'Demographic data service is not configured. Please contact the administrator.'
            );
            return;
          }

          const errorMessage = errorData.error || `Failed to fetch demographics (${response.status})`;
          throw new Error(errorMessage);
        }

        const data: DemographicsData = await response.json();
        setDemographicsData(data);
      } catch (err) {
        console.error('Error fetching demographics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load demographics');
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchDemographics();
    }
  }, [latitude, longitude]);

  return (
    <div className="w-full">
      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-1">
          Gain quick insights into local demographics with Statistics Canada's data on this Dissemination Area. 
          A dissemination area is essentially a small neighbourhood consisting of 400 to 700 residents.
        </p>
        <div className="py-6">
          {/* Map */}
          <DemographicsMap latitude={latitude} longitude={longitude} address={address} />

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-sm text-gray-600">Loading demographic data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium mb-1">Unable to load demographic data</p>
              <p className="text-xs text-amber-700">{error}</p>
              {!latitude || !longitude ? (
                <p className="text-xs text-amber-600 mt-2">
                  Location coordinates are required to load demographics.
                </p>
              ) : null}
            </div>
          )}

          {/* Demographics Data */}
          {demographicsData && !loading && !error && (
            <>
              {/* Key Statistics Grid */}
              <StatisticsGrid stats={demographicsData.stats} />

              {/* Tabs and Charts */}
              <DemographicsTabs 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                chartsData={demographicsData.charts}
              />

              {/* Footer info */}
              {demographicsData.disseminationArea && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Dissemination Area: {demographicsData.disseminationArea}
                  {demographicsData.lastUpdated && ` • Last updated: ${demographicsData.lastUpdated}`}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeighbourhoodDemographics;

