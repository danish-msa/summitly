import React, { useState } from 'react';
import { PropertyListing } from '@/lib/types';
import { ChevronDown, Sparkles } from 'lucide-react';

interface DescriptionProps {
  property: PropertyListing;
  isPreCon?: boolean;
}

const Description: React.FC<DescriptionProps> = ({ property, isPreCon = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = isPreCon && property.preCon?.description 
    ? property.preCon.description 
    : property.lot.legalDescription;

  const allBulletPoints = [
    { text: `${property.details.numBedrooms || 0}-bedroom ${property.details.propertyType?.toLowerCase() || 'property'}.` },
    { text: 'Bright and inviting living area.' },
    { text: `${property.details.numBathrooms === 1 ? 'One' : property.details.numBathrooms || 'One'} full ${property.details.numBathrooms === 1 ? 'washroom' : 'washrooms'}.` },
    { text: `Approximately ${typeof property.details.sqft === 'number' ? property.details.sqft.toLocaleString() : property.details.sqft} square feet of living space.` },
    { text: 'New furnace and hot water tank.' },
    { text: 'Large parking area for multiple vehicles.' },
    { text: `Located in ${property.address.city || 'a desirable neighborhood'}.` },
    { text: 'Well-maintained property with modern updates.' },
    { text: 'Includes essential appliances: fridge, stove, and dishwasher.' },
    ...(isPreCon 
      ? [
          { text: 'Pre-construction opportunity with modern amenities and design.' },
          { text: 'Energy-efficient features and contemporary finishes.' }
        ]
      : [
          { text: 'Ready for immediate occupancy.' },
          { text: 'Excellent value in the current market.' }
        ]
    )
  ];

  const displayedPoints = isExpanded ? allBulletPoints : allBulletPoints.slice(0, 8);

  return (
    <div className="w-full flex flex-col  md:flex-row gap-4 justify-between mt-10">
      <div className="mb-4 flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {isPreCon ? 'About this project' : 'About this property'}
        </h3>
        <p className="text-gray-500 font-light leading-relaxed whitespace-pre-line">
          {description || 'No description available for this property.'}
        </p>
      </div>
      <div className="flex flex-col bg-[linear-gradient(112deg,#7e3af2_1.66%,#eb7161)] rounded-lg p-8 md:w-[45%]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-white" />
          <h3 className="text-xl font-semibold text-white">AI Summary of this property</h3>
        </div>
        <ul className="text-white font-light leading-relaxed space-y-2 list-none">
          {displayedPoints.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{point.text}</span>
            </li>
          ))}
        </ul>
        {allBulletPoints.length > 8 && (
          <div className="mt-2 self-start">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-white hover:underline font-medium text-base transition-colors"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            <ChevronDown className={`h-5 w-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />

            </button>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default Description;

