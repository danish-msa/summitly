import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import PropertyAlertsDialog from '@/components/common/PropertyAlertsDialog';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import type { PropertyPageType } from '../types';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  heroImage?: string | null;
  title: string;
  customContent?: string | null;
  lastUpdatedDate: string;
  pageType: PropertyPageType;
  displayCount: string;
  cityName?: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  customContent,
  lastUpdatedDate: _lastUpdatedDate,
  pageType,
  displayCount,
  cityName,
}) => {
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
          {displayCount} Homes for Sale in <span className="font-extrabold">{title}</span>
        </>
      );
    }
    return (
      <>
        <span className="font-extrabold">{displayCount}</span> {title}
      </>
    );
  };

  return (
    <div className="w-full">
      {/* Simple banner - same layout as PreCon HeroSection */}
      <section className="w-full bg-primary text-secondary-foreground mt-16 py-8 md:py-10">
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start justify-between">
          <div className="space-y-4">
            <nav className="flex items-center gap-2 text-sm text-secondary-foreground/90" aria-label="Breadcrumb">
              <Link href="/properties" className="hover:underline font-medium">
                Properties
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-medium">{title}</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold">
              {buildHeading()}
            </h1>
          </div>
          {/* Right Column: Alert Card */}
          <div className="flex flex-col items-start md:items-end">
            <div
              onClick={() => setAlertsOpen(true)}
              className="bg-white/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full md:w-auto max-w-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-secondary" aria-hidden />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-foreground mb-1">Never Miss Out</h4>
                  <p className="text-sm font-light text-muted-foreground">
                    Be the first to hear about new properties that match your search criteria
                  </p>
                </div>
              </div>
              <Button
                variant="default"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Bell className="w-4 h-4" aria-hidden />
                <span>Alert Me of New Properties</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

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

