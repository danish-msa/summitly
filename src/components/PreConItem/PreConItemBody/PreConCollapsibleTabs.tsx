import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Demographics from '../../Item/ItemBody/Demographics'
import { NeighborhoodAmenities } from '../../Item/ItemBody/NeighborhoodAmenities'
import { LifestyleAmenities } from '../../Item/ItemBody/LifestyleAmenities'
import { MortgageCalculator } from '../../Item/ItemBody/MortgageCalculator'
import AffordabilityCalculator from '../../Item/ItemBody/AffordabilityCalculator'
import { PropertyListing } from '@/lib/types'
import Description from '../../Item/ItemBody/Description'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProjectDetails from './ProjectDetails'
import DepositStructure from './DepositStructure'
import PricingIncentives from './PricingIncentives'
import ProjectAmenities from './ProjectAmenities'
import AvailableUnits from './AvailableUnits'
import ProjectDocuments from './ProjectDocuments'

interface PreConCollapsibleTabsProps {
  property: PropertyListing;
}

interface TabSection {
  id: string;
  label: string;
  content: React.ReactNode;
}

const PreConCollapsibleTabs: React.FC<PreConCollapsibleTabsProps> = ({ property }) => {
  // Pre-construction sections are expanded by default
  const defaultExpanded = [
    'description', 
    'project-details',
    'pricing-incentives',
    'deposit-structure',
    'available-units',
    'amenities-neighborhood-lifestyle',
    'documents',
    'market-analytics', 
    'calculators'
  ];
  
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(
    new Set(defaultExpanded)
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
        <Description property={property} isPreCon={true} />
      )
    },
    {
      id: 'project-details',
      label: 'Details',
      content: (
        <ProjectDetails property={property} />
      )
    },
    {
      id: 'pricing-incentives',
      label: 'Pricing & Incentives',
      content: (
        <PricingIncentives property={property} />
      )
    },
    {
      id: 'deposit-structure',
      label: 'Deposit Structure',
      content: (
        <DepositStructure property={property} />
      )
    },
    {
      id: 'documents',
      label: 'Documents (PDFs)',
      content: (
        <ProjectDocuments property={property} />
      )
    },
    {
      id: 'available-units',
      label: 'Available Units',
      content: (
        <AvailableUnits property={property} />
      )
    },
    {
      id: 'amenities-neighborhood-lifestyle',
      label: 'Amenities & Lifestyle',
      content: (
        <Tabs defaultValue="project-amenities" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 p-1">
            <TabsTrigger value="project-amenities" className="py-2 text-sm">Project Amenities</TabsTrigger>
            <TabsTrigger value="neighborhood" className="py-2 text-sm">Neighborhood</TabsTrigger>
            <TabsTrigger value="lifestyle" className="py-2 text-sm">Lifestyle</TabsTrigger>
            <TabsTrigger value="demographics" className="py-2 text-sm">Demographics</TabsTrigger>
          </TabsList>
          <TabsContent value="project-amenities" className="mt-6">
            <ProjectAmenities property={property} />
          </TabsContent>
          <TabsContent value="neighborhood" className="mt-6">
            <NeighborhoodAmenities 
              address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()}
              latitude={property.map?.latitude || null}
              longitude={property.map?.longitude || null}
            />
          </TabsContent>
          <TabsContent value="lifestyle" className="mt-6">
            <LifestyleAmenities 
              address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()}
              latitude={property.map?.latitude || null}
              longitude={property.map?.longitude || null}
            />
          </TabsContent>
          <TabsContent value="demographics" className="mt-6">
            <Demographics 
              latitude={property.map?.latitude || null} 
              longitude={property.map?.longitude || null} 
              address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()} 
            />
          </TabsContent>
        </Tabs>
      )
    },
    {
      id: 'calculators',
      label: 'Calculators',
      content: (
        <Tabs defaultValue="mortgage" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1">
            <TabsTrigger value="mortgage" className="py-2 text-sm">Mortgage Calculator</TabsTrigger>
            <TabsTrigger value="affordability" className="py-2 text-sm">Affordability Calculator</TabsTrigger>
          </TabsList>
          <TabsContent value="mortgage" className="mt-6">
            <MortgageCalculator />
          </TabsContent>
          <TabsContent value="affordability" className="mt-6">
            <AffordabilityCalculator propertyPrice={
              property.listPrice || 
              (property.preCon?.startingPrice && property.preCon.startingPrice > 0 ? property.preCon.startingPrice : 0)
            } />
          </TabsContent>
        </Tabs>
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
                      ? 'border-l-4 border-l-primary bg-gradient-to-r from-brand-celestial/10 to-brand-celestial/20 border-b-0' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-xl font-semibold ${
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
                  <div className="px-6 pb-6 mt-4">
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

export default PreConCollapsibleTabs;

