import React, { useState } from 'react';
import { PropertyListing } from '@/lib/types';
import { ChevronDown, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import RatingsOverview from './QualityScore';
import PreConProjectSpecs from '@/components/PreConItem/PreConItemBody/PreConProjectSpecs';

interface DescriptionProps {
  property: PropertyListing;
  isPreCon?: boolean;
  aiAnalysis?: any;
}

const Description: React.FC<DescriptionProps> = ({ property, isPreCon = false, aiAnalysis }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  
  // Get description based on property type
  const description = isPreCon && property.preCon?.description 
    ? property.preCon.description 
    : property.details?.description || property.lot?.legalDescription || 'No description available for this property.';

  // Generate bullet points based on property type
  const allBulletPoints = isPreCon && property.preCon
    ? [
        // Pre-con specific bullet points
        { text: `${property.preCon.details?.bedroomRange || property.details?.numBedrooms || 'Various'} bedroom options available.` },
        { text: `${property.preCon.details?.bathroomRange || property.details?.numBathrooms || 'Multiple'} bathroom configurations.` },
        { text: `Approximately ${property.preCon.details?.sqftRange || (typeof property.details?.sqft === 'number' ? property.details.sqft.toLocaleString() : property.details?.sqft || 'various')} square feet of living space.` },
        { text: `Located in ${property.address?.city || 'a desirable neighborhood'}.` },
        { text: `Developed by ${property.preCon.developer || 'renowned developer'}.` },
        { text: `Project status: ${property.preCon.status === 'selling' ? 'Now Selling' : property.preCon.status === 'coming-soon' ? 'Coming Soon' : 'Sold Out'}.` },
        { text: 'Pre-construction opportunity with modern amenities and design.' },
        { text: 'Energy-efficient features and contemporary finishes.' },
        ...(property.preCon.features && property.preCon.features.length > 0
          ? property.preCon.features.slice(0, 2).map(feature => ({ text: feature }))
          : []
        )
      ]
    : [
        // Regular property bullet points
        { text: `${property.details?.numBedrooms || 0}-bedroom ${property.details?.propertyType?.toLowerCase() || 'property'}.` },
        { text: 'Bright and inviting living area.' },
        { text: `${property.details?.numBathrooms === 1 ? 'One' : property.details?.numBathrooms || 'One'} full ${property.details?.numBathrooms === 1 ? 'washroom' : 'washrooms'}.` },
        { text: `Approximately ${typeof property.details?.sqft === 'number' ? property.details.sqft.toLocaleString() : property.details?.sqft || 'N/A'} square feet of living space.` },
        { text: 'New furnace and hot water tank.' },
        { text: 'Large parking area for multiple vehicles.' },
        { text: `Located in ${property.address?.city || 'a desirable neighborhood'}.` },
        { text: 'Well-maintained property with modern updates.' },
        { text: 'Includes essential appliances: fridge, stove, and dishwasher.' },
        { text: 'Ready for immediate occupancy.' },
        { text: 'Excellent value in the current market.' }
      ];

  const displayedPoints = isExpanded ? allBulletPoints : allBulletPoints.slice(0, 8);

  // Get AI Summary from backend if available
  const aiSummary = aiAnalysis?.ai_summary || aiAnalysis?.insights?.ai_summary;
  const showAISummary = aiSummary && typeof aiSummary === 'string' && aiSummary.length > 10;
  
  // Debug logging
  console.log('📝 [DESCRIPTION] AI Analysis:', aiAnalysis);
  console.log('📝 [DESCRIPTION] AI Summary:', aiSummary ? aiSummary.substring(0, 100) + '...' : 'None');
  console.log('📝 [DESCRIPTION] Show AI Summary:', showAISummary);

  return (
    <div className="bg-white rounded-lg py-4 px-4 sm:py-6 sm:px-6 md:px-8 shadow-sm">
      {/* Pre-Con Project Specs - Only for pre-con pages */}
      {isPreCon && <PreConProjectSpecs property={property} />}
      
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">{isPreCon ? 'About this project' : 'About this property'}</h2>
      {/* Ratings Overview for regular properties */}
      {isPreCon ? null : <RatingsOverview />}
      <div className="w-full flex flex-col mt-3 sm:mt-4 md:flex-row gap-4 sm:gap-6 justify-between">
        <div className="mb-3 sm:mb-4 flex-1 min-w-0">
          <p 
            className={`text-sm sm:text-base text-gray-500 font-light leading-relaxed whitespace-pre-line ${
              !isDescriptionExpanded ? 'line-clamp-4' : ''
            }`}
          >
            {description || 'No description available for this property.'}
          </p>
          {description && description.length > 200 && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="mt-2 flex items-center gap-1 text-primary hover:underline font-medium text-xs sm:text-sm transition-colors"
            >
              {isDescriptionExpanded ? 'Read less' : 'Read more'}
              <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <div className="flex flex-col justify-start bg-muted/20 rounded-lg w-full md:w-[50%] flex-shrink-0 min-w-0">
          <div className="flex items-center gap-2 py-4 px-3 sm:py-6 sm:px-4 rounded-t-lg price-card-gradient">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
            <h3 className="text-base sm:text-xl font-semibold text-white">
              {isPreCon ? 'AI Summary of this project' : 'AI Summary of this property'}
            </h3>
          </div>
          
          {/* Show AI Summary if available, otherwise show bullet points */}
          {showAISummary ? (
            <div className="text-primary font-light text-xs sm:text-sm leading-relaxed pt-3 sm:pt-4 px-3 sm:px-4 pb-2">
              <p className="whitespace-pre-line">{aiSummary}</p>
            </div>
          ) : (
            <>
              <ul className="text-primary font-light text-xs sm:text-sm leading-relaxed space-y-1.5 sm:space-y-2 list-none pt-3 sm:pt-4 px-3 sm:px-4 pb-2">
                {displayedPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <span className="flex-shrink-0">•</span>
                    <span>{point.text}</span>
                  </li>
                ))}
              </ul>
              {allBulletPoints.length > 8 && (
                <div className="mt-2 self-start pt-2 px-3 sm:px-4">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1.5 sm:gap-2 text-primary hover:underline font-medium text-sm sm:text-base transition-colors"
                  >
                    {isExpanded ? 'Read less' : 'Read more'}
                    <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-primary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Feedback Section */}
          <div className="bg-muted/40 rounded-b-lg mt-3 py-3 px-3 sm:px-4 border-t flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center border-muted/20">
            <p className="text-primary font-semibold text-xs sm:text-sm">Was this helpful?</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setFeedback('yes')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg border transition-colors flex-1 sm:flex-initial ${
                  feedback === 'yes'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-transparent border-muted/200 text-primary hover:bg-muted/10'
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Yes</span>
              </button>
              <button
                onClick={() => setFeedback('no')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg border transition-colors flex-1 sm:flex-initial ${
                  feedback === 'no'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-transparent border-muted/200 text-primary hover:bg-muted/10'
                }`}
              >
                <ThumbsDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>No</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Description;

