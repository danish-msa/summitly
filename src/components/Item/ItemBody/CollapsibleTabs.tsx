import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Features from './Features'
import Location from './Location'
import Demographics from './Demographics'
import PropertyListingDetails from './PropertyListingDetails'
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
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set(['listing-details']));

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
          <p className="text-gray-500 font-light">{property.lot.legalDescription}</p>
        </div>
      )
    },
    {
      id: 'features',
      label: 'Amenities & Features',
      content: (
        <div className="mt-4">
          <Features />
        </div>
      )
    },
    {
      id: 'location',
      label: 'Map Location',
      content: (
        <div className="mt-4">
          <Location property={property} />
        </div>
      )
    },
    {
      id: 'demographics',
      label: 'Demographics',
      content: (
        <div className="mt-4">
          <Demographics />
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
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <span className="text-lg font-semibold text-gray-900">
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
                isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
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
