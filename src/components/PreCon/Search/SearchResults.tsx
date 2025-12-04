"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchResult {
  id: string;
  name: string;
  type: 'project' | 'page';
  // Project fields
  mlsNumber?: string;
  developer?: string;
  city?: string;
  neighborhood?: string;
  propertyType?: string;
  status?: string;
  price?: number;
  image?: string | null;
  address?: string | null;
  // Page fields
  location?: string;
  locationType?: string | null;
  description?: string | null;
}

export interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  className?: string;
  onResultClick?: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  isLoading = false,
  className,
  onResultClick,
}) => {
  if (isLoading) {
    return (
      <div className={cn("absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden", className)}>
        <div className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0 && query.length >= 2) {
    return (
      <div className={cn("absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden", className)}>
        <div className="p-4">
          <p className="text-sm text-gray-500 text-center py-4">
            No results found for &quot;{query}&quot;
          </p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatStatus = (status?: string) => {
    if (!status) return null;
    const statusMap: Record<string, string> = {
      'now-selling': 'Now Selling',
      'selling': 'Now Selling',
      'coming-soon': 'Coming Soon',
      'sold-out': 'Sold Out',
      'platinum-access': 'Platinum Access',
      'register-now': 'Register Now',
      'assignments': 'Assignments',
      'resale': 'Resale',
      'new-release': 'New Release',
    };
    
    const lowerStatus = status.toLowerCase();
    if (statusMap[lowerStatus]) {
      return statusMap[lowerStatus];
    }
    
    // Fallback: Format status by replacing hyphens with spaces and capitalizing words
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getProjectUrl = (result: SearchResult) => {
    if (result.type === 'project' && result.mlsNumber) {
      return `/pre-construction/${result.mlsNumber}`;
    }
    return '#';
  };

  const getPageUrl = (result: SearchResult) => {
    if (result.type === 'page' && result.location) {
      return `/pre-construction/${result.location.toLowerCase()}`;
    }
    return '#';
  };

  const projects = results.filter(r => r.type === 'project');
  const pages = results.filter(r => r.type === 'page');

  return (
    <div className={cn("absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden max-h-[600px] overflow-y-auto", className)}>
      <div className="p-4 space-y-4">
        {/* Projects Section */}
        {projects.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Projects ({projects.length})
            </h3>
            <div className="space-y-2">
              {projects.map((result) => (
                <Link
                  key={result.id}
                  href={getProjectUrl(result)}
                  onClick={onResultClick}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt={result.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                          {result.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {result.developer && (
                            <span className="text-xs text-gray-600">
                              by {result.developer}
                            </span>
                          )}
                          {result.propertyType && (
                            <span className="text-xs text-gray-500">
                              • {result.propertyType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {result.city && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{result.city}{result.neighborhood ? `, ${result.neighborhood}` : ''}</span>
                            </div>
                          )}
                          {result.price && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <DollarSign className="h-3 w-3" />
                              <span>From {formatPrice(result.price)}</span>
                            </div>
                          )}
                          {result.status && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              result.status === 'now-selling' || result.status === 'selling' 
                                ? "bg-green-100 text-green-700"
                                : result.status === 'coming-soon'
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            )}>
                              {formatStatus(result.status)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pages Section */}
        {pages.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations ({pages.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {pages.map((result) => (
                <Link
                  key={result.id}
                  href={getPageUrl(result)}
                  onClick={onResultClick}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                >
                  {/* Image */}
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt={result.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                      {result.name}
                    </h4>
                    {result.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {result.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

