import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import PreConSearchBar from '@/components/common/PreConSearchBar';
import PropertyAlertsDialog from '@/components/common/PropertyAlertsDialog';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
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
  const { data: session } = useSession();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<Record<string, boolean>>({
    newProjects: false,
    newUnits: false,
    priceChanges: false,
    statusUpdates: false,
  });

  // Get location name based on page type
  const locationName = pageType === 'by-location' ? title : undefined;

  // Use property alerts hook for saving alerts
  const { currentAlert, saveAlert } = usePropertyAlerts(
    undefined, // No specific property
    locationName, // City name for location-based alerts
    undefined // No specific neighborhood
  );

  // Load existing alert options when alert is found
  useEffect(() => {
    if (currentAlert) {
      setAlertOptions({
        newProjects: currentAlert.newProperties || false,
        newUnits: false, // Map to appropriate field if available
        priceChanges: false, // Map to appropriate field if available
        statusUpdates: false, // Map to appropriate field if available
      });
    }
  }, [currentAlert]);

  // Toggle alert option
  const toggleAlertOption = (option: string) => {
    setAlertOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

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
                  onClick={() => setAlertsOpen(true)}
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

      {/* Alerts Dialog */}
      <PropertyAlertsDialog
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        alertOptions={alertOptions}
        onToggleOption={toggleAlertOption}
        locationName={locationName}
        propertyType="pre-construction"
        onSave={async (options) => {
          if (!session) {
            toast({
              title: "Sign in required",
              description: "Please sign in to set up property alerts.",
              variant: "destructive",
            });
            setAlertsOpen(false);
            return;
          }

          try {
            // Map pre-con alert options to the alert API format
            await saveAlert({
              cityName: locationName,
              propertyType: 'pre-construction',
              newProperties: options.newProjects || false,
              // Note: The API currently supports newProperties, soldListings, expiredListings
              // For pre-con specific alerts, we'll use newProperties for newProjects
              // and can extend the API later for newUnits, priceChanges, statusUpdates
            });

            toast({
              title: "Alerts Saved",
              description: `Your pre-construction property alerts${locationName ? ` for ${locationName}` : ''} have been saved successfully.`,
              variant: "default",
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to save alerts. Please try again.";
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
};
