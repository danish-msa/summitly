"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import { Loader2, Heart } from 'lucide-react';

interface AlertOptions {
  watchProperty: boolean;
  newProperties: boolean;
  soldListings: boolean;
  expiredListings: boolean;
}

interface PropertyAlertsProps {
  propertyId?: string;
  cityName?: string;
  propertyType?: string;
  neighborhood?: string;
}

const PropertyAlerts: React.FC<PropertyAlertsProps> = ({ 
  propertyId,
  cityName = 'this area',
  propertyType = 'property',
  neighborhood
}) => {
  const { data: session } = useSession();
  const { currentAlert, isLoading, saveAlert, isSaving } = usePropertyAlerts(
    propertyId,
    cityName,
    neighborhood
  );

  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    watchProperty: false,
    newProperties: false,
    soldListings: false,
    expiredListings: false,
  });

  // Load existing alert options
  useEffect(() => {
    if (currentAlert) {
      setAlertOptions({
        watchProperty: currentAlert.watchProperty,
        newProperties: currentAlert.newProperties,
        soldListings: currentAlert.soldListings,
        expiredListings: currentAlert.expiredListings,
      });
    }
  }, [currentAlert]);

  // Format area name (neighborhood or city)
  const areaName = neighborhood || cityName;

  const handleToggleOption = async (option: keyof AlertOptions) => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to set up property alerts.",
        variant: "destructive",
        icon: <Heart className="h-5 w-5 text-red-600" />,
      });
      return;
    }

    const newValue = !alertOptions[option];
    const updatedOptions = {
      ...alertOptions,
      [option]: newValue,
    };

    setAlertOptions(updatedOptions);

    try {
      await saveAlert({
        mlsNumber: propertyId,
        cityName: cityName !== 'this area' ? cityName : undefined,
        neighborhood,
        propertyType,
        ...updatedOptions,
      });

      toast({
        title: "Alert Updated",
        description: `Your alert preferences have been saved.`,
        variant: "success",
        icon: <Heart className="h-5 w-5 text-green-600 fill-green-600" />,
      });
    } catch (error) {
      // Revert on error
      setAlertOptions(alertOptions);
      const errorMessage = error instanceof Error ? error.message : "Failed to update alert. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full shadow-lg border-0 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-white">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2 mb-4">
          {/* Watch Property Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="text-left flex-1">
              <div className="font-semibold text-foreground text-sm mb-1">Watch Property</div>
              <div className="text-xs text-muted-foreground">Get notified about updates for this property</div>
            </div>
            <button
              onClick={() => handleToggleOption('watchProperty')}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                alertOptions.watchProperty ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alertOptions.watchProperty ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* New Properties Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="text-left flex-1">
              <div className="font-semibold text-foreground text-sm mb-1">New Properties</div>
              <div className="text-xs text-muted-foreground">
                 Notify me for new {propertyType} listings in {areaName}.
              </div>
            </div>
            <button
              onClick={() => handleToggleOption('newProperties')}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                alertOptions.newProperties ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alertOptions.newProperties ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sold Listings Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="text-left flex-1">
              <div className="font-semibold text-foreground text-sm mb-1">Sold Listings</div>
              <div className="text-xs text-muted-foreground">
                Notify me when {propertyType} properties are sold in {areaName}.
              </div>
            </div>
            <button
              onClick={() => handleToggleOption('soldListings')}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                alertOptions.soldListings ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alertOptions.soldListings ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Expired Listings Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="text-left flex-1">
              <div className="font-semibold text-foreground text-sm mb-1">Expired Listings</div>
              <div className="text-xs text-muted-foreground">
                Notify me when {propertyType} listings expire in {areaName}.
              </div>
            </div>
            <button
              onClick={() => handleToggleOption('expiredListings')}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                alertOptions.expiredListings ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alertOptions.expiredListings ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyAlerts;

