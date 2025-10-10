import { useState, useEffect } from 'react';
import { PropertyListing, PropertyFilters } from '@/lib/types';
import { getListings } from '@/lib/api/properties';

export const useProperties = (filters: PropertyFilters = {}) => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 12
  });

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params: Record<string, string | number> = {
          resultsPerPage: pagination.resultsPerPage,
          pageNum: pagination.currentPage,
          status: "A" // Active listings
        };
        
        // Add filters to params
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = value;
          }
        });
        
        const data = await getListings(params);
        
        setProperties(data.listings);
        setPagination(prev => ({
          ...prev,
          totalPages: data.numPages,
          totalResults: data.count
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters, pagination.currentPage, pagination.resultsPerPage]);

  const refetch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const setPage = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  return {
    properties,
    loading,
    error,
    pagination,
    refetch,
    setPage
  };
};
