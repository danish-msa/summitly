import React, { useState, useEffect } from 'react';
import { ProcessedLocation, LocationStats } from '@/data/types';
import { useLocationData, useLocationDemographics, useLocationSearch } from '@/hooks/useLocationData';

/**
 * Demo component showing how to use organized location data
 * This demonstrates the data structure and capabilities
 */
const LocationDemographicsDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<ProcessedLocation | null>(null);
  const [showHierarchy, setShowHierarchy] = useState(false);
  
  const {
    locations,
    loading,
    error,
    fetchLocations,
    getPopularLocations,
    getLocationsByType,
    getLocationHierarchy,
    updateFilters
  } = useLocationData();

  const { stats, loading: statsLoading } = useLocationDemographics(selectedLocation);
  
  const {
    query,
    results,
    isSearching,
    search,
    clearSearch
  } = useLocationSearch();

  // Initialize with sample data
  useEffect(() => {
    // In a real app, you'd call fetchLocations with your API key
    // fetchLocations('your-api-key');
    
    // For demo, we'll use mock data
    const mockLocations: ProcessedLocation[] = [
      {
        id: 'area-toronto',
        name: 'Toronto',
        type: 'area',
        activeCount: 3312,
        coordinates: { lat: 43.653226, lng: -79.3831843 },
        demographics: {
          residential: 2000,
          condo: 1000,
          commercial: 312,
          total: 3312
        },
        children: [
          {
            id: 'city-toronto-downtown',
            name: 'Downtown Toronto',
            type: 'city',
            parent: 'Toronto',
            activeCount: 1200,
            coordinates: { lat: 43.653226, lng: -79.3831843 },
            demographics: {
              residential: 600,
              condo: 500,
              commercial: 100,
              total: 1200
            },
            children: [
              {
                id: 'neighborhood-annex',
                name: 'Annex',
                type: 'neighborhood',
                parent: 'Downtown Toronto',
                activeCount: 67,
                coordinates: { lat: 43.6740289, lng: -79.3960032 },
                demographics: {
                  residential: 40,
                  condo: 25,
                  commercial: 2,
                  total: 67
                }
              }
            ]
          }
        ]
      }
    ];
    
    // Set mock data
    setTimeout(() => {
      // This would normally be set by the hook after API call
    }, 1000);
  }, []);

  const handleLocationSelect = (location: ProcessedLocation) => {
    setSelectedLocation(location);
    setShowHierarchy(false);
  };

  const handleShowHierarchy = () => {
    if (selectedLocation) {
      setShowHierarchy(true);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    updateFilters({ [filterType]: value });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Location Demographics Demo</h1>
      
      {/* Search Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Location Search</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search locations..."
            value={query}
            onChange={(e) => search(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        {results.length > 0 && (
          <div className="mt-2 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {results.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-gray-600">
                  {location.type} • {location.activeCount} properties
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Filters</h2>
        <div className="flex gap-4">
          <select
            onChange={(e) => handleFilterChange('class', e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Classes</option>
            <option value="residential">Residential</option>
            <option value="condo">Condo</option>
            <option value="commercial">Commercial</option>
          </select>
          
          <select
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Types</option>
            <option value="area">Areas</option>
            <option value="city">Cities</option>
            <option value="neighborhood">Neighborhoods</option>
          </select>
        </div>
      </div>

      {/* Popular Locations */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Popular Locations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getPopularLocations(6).map((location) => (
            <div
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
            >
              <h3 className="font-medium">{location.name}</h3>
              <p className="text-sm text-gray-600">{location.type}</p>
              <div className="mt-2 text-sm">
                <div>Total: {location.demographics.total}</div>
                <div>Residential: {location.demographics.residential}</div>
                <div>Condo: {location.demographics.condo}</div>
                <div>Commercial: {location.demographics.commercial}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Selected Location</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium">{selectedLocation.name}</h3>
            <p className="text-gray-600">{selectedLocation.type}</p>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedLocation.demographics.total}
                </div>
                <div className="text-sm text-gray-600">Total Properties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedLocation.demographics.residential}
                </div>
                <div className="text-sm text-gray-600">Residential</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedLocation.demographics.condo}
                </div>
                <div className="text-sm text-gray-600">Condo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {selectedLocation.demographics.commercial}
                </div>
                <div className="text-sm text-gray-600">Commercial</div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleShowHierarchy}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Show Location Hierarchy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Hierarchy */}
      {showHierarchy && selectedLocation && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Location Hierarchy</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {getLocationHierarchy(selectedLocation.name).map((location, index) => (
              <div key={location.id} className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="ml-3">
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-gray-600">
                    {location.type} • {location.activeCount} properties
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Location Statistics</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {statsLoading ? (
              <div className="text-center">Loading statistics...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Property Distribution</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Residential:</span>
                      <span className="font-medium">{stats.residentialCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Condo:</span>
                      <span className="font-medium">{stats.condoCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commercial:</span>
                      <span className="font-medium">{stats.commercialCount}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span>Total:</span>
                      <span className="font-medium">{stats.totalProperties}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Market Info</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">
                        {new Date(stats.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    {stats.marketTrend && (
                      <div className="flex justify-between">
                        <span>Trend:</span>
                        <span className={`font-medium ${
                          stats.marketTrend === 'rising' ? 'text-green-600' :
                          stats.marketTrend === 'falling' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {stats.marketTrend}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Structure Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Data Structure</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">ProcessedLocation Interface:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`interface ProcessedLocation {
  id: string;
  name: string;
  type: 'area' | 'city' | 'neighborhood';
  parent?: string;
  activeCount: number;
  coordinates: LocationCoordinates;
  polygon?: LocationPolygon;
  children?: ProcessedLocation[];
  demographics: {
    residential: number;
    condo: number;
    commercial: number;
    total: number;
  };
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LocationDemographicsDemo;
