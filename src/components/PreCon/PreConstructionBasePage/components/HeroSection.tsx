import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import PreConSearchBar from '@/components/common/PreConSearchBar';
import PropertyAlertsDialog from '@/components/common/PropertyAlertsDialog';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import type { PageType, TeamMemberInfo } from '../types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  heroImage: string | null;
  title: string;
  customContent?: string | null;
  lastUpdatedDate: string;
  pageType: PageType;
  teamMemberInfo?: TeamMemberInfo | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  heroImage,
  title,
  customContent,
  lastUpdatedDate: _lastUpdatedDate,
  pageType,
  teamMemberInfo,
}) => {
  const isDevelopmentTeamPage = ['developer', 'architect', 'interior-designer', 'builder', 'landscape-architect', 'marketing'].includes(pageType);
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
          Pre Construction Homes in <span className='text-secondary'>{title}</span>
        </>
      );
    } else if (isDevelopmentTeamPage) {
      // For development team pages, just show the name without project count
      return (
        <>
          <span className='text-secondary'>{title}</span>
        </>
      );
    } else {
      return (
        <>
          <span className='text-secondary'>{title}</span>
        </>
      );
    }
  };

  return (
    <div className="w-full relative bg-white" style={{ background: 'white' }}>
      {/* Content Section - Two Column Layout */}
      <div 
        className="w-full bg-white py-8 md:py-12 px-4 z-10"
        style={{ background: 'white' }}
      >
          <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Breadcrumb Navigation */}
            <div className="mb-4 relative z-20">
              <nav className="flex items-center gap-2 text-sm text-foreground" aria-label="Breadcrumb">
                <Link 
                  href="/pre-con" 
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Pre-Construction
                </Link>
                <ChevronRight className="h-4 w-4 text-foreground" />
                <span className="text-foreground font-medium">{title}</span>
              </nav>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Title and Search Bar */}
              <div className="space-y-4 relative z-20">
                {isDevelopmentTeamPage && teamMemberInfo?.image ? (
                  <div className="space-y-4">
                    <div className="relative w-full max-w-xs h-20 md:h-20">
                      <Image
                        src={teamMemberInfo.image}
                        alt={title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {buildHeading()}
                    </h1>
                  </div>
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {buildHeading()}
                  </h1>
                )}
                
                {/* Search Bar - Positioned below title, self-contained styling */}
                <div className="w-full relative z-30">
                  <PreConSearchBar
                    placeholder="Enter location to search pre-construction properties"
                    className="bg-white/95 backdrop-blur-sm shadow-lg"
                    autoNavigate={true}
                  />
                </div>
              </div>

              {/* Right Column: Alert Card */}
              <div className="flex flex-col items-start md:items-end">
                <div 
                  onClick={() => setAlertsOpen(true)}
                  className="bg-secondary/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full md:w-auto max-w-sm"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-1">Never Miss Out</h4>
                      <p className="text-sm font-light text-muted-foreground">
                        Get instant alerts when new pre-construction criteria  properties match your search criteria
                      </p>
                    </div>
                  </div>
                  <Button variant="default" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
                    <Bell className="w-4 h-4" />
                    <span>Enable Property Alerts</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Additional Content Section (if customContent exists) */}
      {customContent && (
        <header className="border-b bg-white pt-6 pb-4">
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
