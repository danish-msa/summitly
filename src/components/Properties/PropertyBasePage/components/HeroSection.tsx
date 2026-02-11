import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import PropertyAlertsDialog from '@/components/common/PropertyAlertsDialog';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import type { PropertyPageType } from '../types';
import Image from 'next/image';

interface HeroSectionProps {
  heroImage: string | null;
  title: string;
  customContent?: string | null;
  lastUpdatedDate: string;
  pageType: PropertyPageType;
  displayCount: string;
  cityName?: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  heroImage,
  title,
  customContent,
  lastUpdatedDate: _lastUpdatedDate,
  pageType,
  displayCount,
  cityName,
}) => {
  const imageSrc = heroImage || '/images/HeroBackImage-3.jpg';
  const { data: session } = useSession();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<Record<string, boolean>>({
    newProperties: false,
    soldListings: false,
    expiredListings: false,
  });

  // Use property alerts hook for saving alerts
  const { currentAlert, saveAlert } = usePropertyAlerts(
    undefined, // No specific property
    cityName || undefined, // City name for location-based alerts
    undefined // No specific neighborhood
  );

  // Load existing alert options when alert is found
  useEffect(() => {
    if (currentAlert) {
      setAlertOptions({
        newProperties: currentAlert.newProperties || false,
        soldListings: currentAlert.soldListings || false,
        expiredListings: currentAlert.expiredListings || false,
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
          {displayCount} Homes for Sale in <span className='text-secondary'>{title}</span>
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
          <Image 
            src={imageSrc} 
            alt={title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      </div>
      
      {/* Content Section */}
      <div className="absolute inset-0 flex items-center px-4 z-10">
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Breadcrumb Navigation */}
          <div className="mb-4 relative z-20">
            <nav className="flex items-center gap-2 text-sm text-white/90 drop-shadow-md" aria-label="Breadcrumb">
              <Link 
                href="/properties" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Properties
              </Link>
              <ChevronRight className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">{title}</span>
            </nav>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left Column: Title */}
            <div className="space-y-4 relative z-20">
              <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
                {buildHeading()}
              </h1>
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
        locationName={cityName || undefined}
        propertyType="regular"
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
            await saveAlert({
              cityName: cityName || undefined,
              propertyType: 'regular',
              newProperties: options.newProperties || false,
              soldListings: options.soldListings || false,
              expiredListings: options.expiredListings || false,
            });

            toast({
              title: "Alerts Saved",
              description: `Your property alerts${cityName ? ` for ${cityName}` : ''} have been saved successfully.`,
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

