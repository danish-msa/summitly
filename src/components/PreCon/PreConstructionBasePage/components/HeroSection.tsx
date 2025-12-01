import React from 'react';
import { Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PreConSearchBar from '@/components/common/PreConSearchBar';
import type { PageType } from '../types';

interface HeroSectionProps {
  heroImage: string | null;
  title: string;
  customContent?: string | null;
  lastUpdatedDate: string;
  pageType: PageType;
  displayCount: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  heroImage,
  title,
  customContent,
  lastUpdatedDate,
  pageType,
  displayCount,
}) => {
  const imageSrc = heroImage || '/images/HeroBackImage.jpg';

  const buildHeading = () => {
    if (pageType === 'by-location') {
      return (
        <>
          {displayCount} Pre Construction Homes in <span className='text-secondary'>{title}</span>
        </>
      );
    } else {
      return (
        <>
          <span className='text-secondary'>{displayCount}</span> {title}
        </>
      );
    }
  };

  return (
    <div className="w-full relative">
      {/* Hero Image with Overlays */}
      <div className="w-full h-48 md:h-64 relative">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={imageSrc} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /> */}
        
        {/* Content Overlay - Two Column Layout */}
        <div className="absolute inset-0 flex items-center px-4 py-6 md:py-8 z-10">
          <div className="container-1400 mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Title and Search Bar */}
              <div className="space-y-4 relative z-20">
                <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
                  {buildHeading()}
                </h1>
                
                {/* Search Bar - Positioned below title, self-contained styling */}
                <div className="w-full relative z-30">
                  <PreConSearchBar
                    placeholder="Enter location to search pre-construction properties"
                    className="bg-white/95 backdrop-blur-sm shadow-lg"
                    autoNavigate={true}
                  />
                </div>
              </div>

              {/* Right Column: Alert Button */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <p className="text-sm text-right drop-shadow-md">
                  Be the first to hear about new properties
                </p>
                <button 
                  onClick={() => {
                    toast({
                      title: "Alerts Coming Soon",
                      description: "Property alerts for pre-construction projects will be available soon.",
                      variant: "default",
                    });
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg font-medium whitespace-nowrap"
                >
                  <Bell className="w-5 h-5" />
                  <span>Alert Me of New Properties</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content Section (if customContent exists) */}
      {customContent && (
        <header className="border-b bg-card pt-6 pb-4">
          <div className="container-1400 mx-auto px-4">
            <div className="space-y-3">
              <div 
                className="text-muted-foreground text-base leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: customContent }}
              />
            </div>
          </div>
        </header>
      )}
    </div>
  );
};
