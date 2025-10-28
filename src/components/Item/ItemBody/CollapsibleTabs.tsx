import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Demographics from './Demographics'
import PropertyListingDetails from './PropertyListingDetails'
import { NeighborhoodAmenities } from './NeighborhoodAmenities'
import { LifestyleAmenities } from './LifestyleAmenities'
// import { MortgageCalculator } from './MortgageCalculator'
import { MortgageCalculator } from '@/components/Calculator'
import { MarketAnalytics } from './MarketAnalytics'
import SimilarListings from './SimilarListings'
import { generateMockListingData } from './mockListingData'
import { PropertyListing } from '@/lib/types'

interface CollapsibleTabsProps {
  property: PropertyListing;
}

interface TabSection {
  id: string;
  label: string;
  content: React.ReactNode;
}

const CollapsibleTabs: React.FC<CollapsibleTabsProps> = ({ property }) => {
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set(['listing-details', 'description', 'features', 'lifestyle', 'location', 'demographics', 'market-analytics', 'tools', 'similar']));

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

  const sections: TabSection[] = [
    {
      id: 'listing-details',
      label: 'Listing Details',
      content: (
        <div className="mt-4">
          <PropertyListingDetails data={generateMockListingData()} />
        </div>
      )
    },
    {
      id: 'description',
      label: 'Description',
      content: (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900">About this property</h3>
          <p className="text-gray-500 font-light">{property.lot.legalDescription}</p>
        </div>
      )
    },
    {
      id: 'features',
      label: 'Neighborhood Amenities',
      content: (
        <div className="mt-4">
          <NeighborhoodAmenities address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()} />
        </div>
      )
    },
    {
      id: 'lifestyle',
      label: 'Lifestyle Amenities',
      content: (
        <div className="mt-4">
          <LifestyleAmenities address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()} />
        </div>
      )
    },
    // {
    //   id: 'location',
    //   label: 'Map Location',
    //   content: (
    //     <div className="mt-4">
    //       <Location property={property} />
    //     </div>
    //   )
    // },
    {
      id: 'demographics',
      label: 'Neighbourhood Demographics',
      content: (
        <div className="mt-4">
          <Demographics 
            latitude={property.map.latitude} 
            longitude={property.map.longitude} 
            address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()} 
          />
        </div>
      )
    },
    {
      id: 'market-analytics',
      label: 'Market Analytics',
      content: (
        <div className="mt-4">
          <MarketAnalytics 
            propertyAddress={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()}
            propertyClass={property.class || 'residential'}
          />
        </div>
      )
    },
    {
      id: 'tools',
      label: 'Tools',
      content: (
        <div className="mt-4">
          {/* <MortgageCalculator /> */}
          <MortgageCalculator property={property} />
        </div>
      )
    },
    {
      id: 'similar',
      label: 'Similar Properties',
      content: (
        <div className="mt-4">
          <SimilarListings currentProperty={property} />
        </div>
      )
    }
  ];

  return (
    <div className="w-full space-y-2">
      {sections.map((section) => {
        const isExpanded = expandedTabs.has(section.id);
        
        return (
          <div 
            key={section.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          >
            {/* Tab Header */}
            <button
              onClick={() => toggleTab(section.id)}
              className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                isExpanded 
                  ? 'bg-brand-tide/50 border-l-4 border-l-primary' 
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
        );
      })}
    </div>
  );
};

export default CollapsibleTabs;
