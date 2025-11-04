import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Demographics from './Demographics'
import PropertyListingDetails from './PropertyListingDetails'
import { NeighborhoodAmenities } from './NeighborhoodAmenities'
import { LifestyleAmenities } from './LifestyleAmenities'
import { MortgageCalculator } from './MortgageCalculator'
import { MarketAnalytics } from './MarketAnalytics'
import SimilarListings from './SimilarListings'
import { generateMockListingData } from './mockListingData'
import { PropertyListing } from '@/lib/types'
import PropertyHistory from './PropertyHistory'

interface CollapsibleTabsProps {
  property: PropertyListing;
}

interface TabSection {
  id: string;
  label: string;
  content: React.ReactNode;
}

const CollapsibleTabs: React.FC<CollapsibleTabsProps> = ({ property }) => {
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(
    new Set(['listing-details', 'description', 'features', 'lifestyle', 'location', 'demographics', 'market-analytics', 'tools', 'similar', 'history'])
  );

  const toggleTab = (tabId: string) => {
    setExpandedTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  };

  // Listen for navigation clicks to expand sections
  useEffect(() => {
    const handleSectionNavigation = (event: CustomEvent<string>) => {
      const sectionId = event.detail;
      // Expand the section if it's collapsed
      setExpandedTabs(prev => {
        if (!prev.has(sectionId)) {
          const newSet = new Set(prev);
          newSet.add(sectionId);
          return newSet;
        }
        return prev;
      });
    };

    window.addEventListener('expandSection' as keyof WindowEventMap, handleSectionNavigation as EventListener);
    return () => window.removeEventListener('expandSection' as keyof WindowEventMap, handleSectionNavigation as EventListener);
  }, []);

  const sections: TabSection[] = [
    {
      id: 'description',
      label: 'Description',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About this property</h3>
          <p className="text-gray-500 font-light">{property.lot.legalDescription}</p>
        </div>
      )
    },
    {
      id: 'listing-details',
      label: 'Listing Details',
      content: (
        <PropertyListingDetails data={generateMockListingData()} />
      )
    },
    {
      id: 'history',
      label: 'Property History',
      content: (
        <PropertyHistory listingHistory={generateMockListingData().listingHistory} property={property} />
      )
    },
    {
      id: 'features',
      label: 'Neighborhood Amenities',
      content: (
        <NeighborhoodAmenities address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()} />
      )
    },
    {
      id: 'lifestyle',
      label: 'Lifestyle Amenities',
      content: (
        <LifestyleAmenities address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()} />
      )
    },
    {
      id: 'demographics',
      label: 'Neighbourhood Demographics',
      content: (
        <Demographics 
          latitude={property.map.latitude} 
          longitude={property.map.longitude} 
          address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()} 
        />
      )
    },
    {
      id: 'market-analytics',
      label: 'Market Analytics',
      content: (
        <MarketAnalytics 
          propertyAddress={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()}
          propertyClass={property.class || 'residential'}
        />
      )
    },
    {
      id: 'tools',
      label: 'Tools',
      content: (
        <MortgageCalculator />
      )
    },
    {
      id: 'similar',
      label: 'Similar Properties',
      content: (
        <SimilarListings currentProperty={property} />
      )
    }
  ];

  return (
    <div className="w-full">
      

      {/* Sections Content */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isExpanded = expandedTabs.has(section.id);
          
          return (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Tab Header */}
                <button
                  onClick={() => toggleTab(section.id)}
                  className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    isExpanded 
                      ? 'border-l-4 border-l-primary' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-lg font-semibold ${
                    isExpanded ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {section.label}
                  </span>
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Tab Content */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollapsibleTabs;
