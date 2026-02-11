"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import { Loader2, Heart, Bell, Home, Tag, Clock, Check, ShieldCheck } from 'lucide-react';

interface AlertOptions {
  watchProperty: boolean;
  newProperties: boolean;
  soldListings: boolean;
  expiredListings: boolean;
}

interface PropertyAlertsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  cityName?: string;
  propertyType?: string;
  neighborhood?: string;
}

const PropertyAlerts: React.FC<PropertyAlertsProps> = ({ 
  open,
  onOpenChange,
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

  const benefits = [
    "Get instant notifications when properties matching your criteria become available",
    "Stay ahead of the market with real-time price change alerts",
    "Never miss a new listing in your preferred neighborhoods",
    "Track sold properties to understand market trends",
    "Receive updates on expired listings that may be relisted",
    "Save time by getting personalized property recommendations"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-secondary rounded-xl p-2 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
            </span>
            <span className="text-xl text-gray-900">Why enable property notifications?</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Benefits */}
              <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-lg border border-secondary/20">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-4 w-4 text-secondary" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right Column - Alerts Section */}
              <div className="flex flex-col">
                <div className="flex flex-col gap-4">
                {/* Watch Property Toggle */}
                <div className="flex items-center gap-4 p-4 rounded-lg border border-secondary/20">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm mb-1">Watch Property</div>
                    <div className="text-xs text-gray-500 font-light">
                      Get notified about price changes and updates for this property
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Toggle
                      checked={alertOptions.watchProperty}
                      onCheckedChange={() => handleToggleOption('watchProperty')}
                      disabled={isSaving}
                      variant="secondary"
                    />
                  </div>
              </div>

              {/* New Properties Toggle */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-secondary/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-1">New Properties</div>
                  <div className="text-xs text-gray-500 font-light">
                    Notify me for new {propertyType} listings in {areaName}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Toggle
                    checked={alertOptions.newProperties}
                    onCheckedChange={() => handleToggleOption('newProperties')}
                    disabled={isSaving}
                    variant="primary"
                  />
                </div>
              </div>

              {/* Sold Listings Toggle */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-secondary/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-1">Sold Listings</div>
                  <div className="text-xs text-gray-500 font-light">
                    Notify me when {propertyType} properties are sold in {areaName}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Toggle
                    checked={alertOptions.soldListings}
                    onCheckedChange={() => handleToggleOption('soldListings')}
                    disabled={isSaving}
                    variant="primary"
                  />
                </div>
              </div>

              {/* Expired Listings Toggle */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-secondary/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-1">Expired Listings</div>
                  <div className="text-xs text-gray-500 font-light">
                    Notify me when {propertyType} listings expire in {areaName}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Toggle
                    checked={alertOptions.expiredListings}
                    onCheckedChange={() => handleToggleOption('expiredListings')}
                    disabled={isSaving}
                    variant="primary"
                  />
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PropertyAlerts;

