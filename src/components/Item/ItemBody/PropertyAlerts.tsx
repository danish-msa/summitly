"use client";

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    watchProperty: false,
    newProperties: false,
    soldListings: false,
    expiredListings: false,
  });

  // Format area name (neighborhood or city)
  const areaName = neighborhood || cityName;

  const handleToggleOption = (option: keyof AlertOptions) => {
    setAlertOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
    // You can add API call here to save the alert preferences when toggled
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-white sticky top-[120px] lg:top-[150px]">
      <CardContent className="p-6">
        
        
        <div className="flex flex-col gap-4 mb-4">
          {/* Watch Property Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="text-left flex-1">
              <div className="font-semibold text-foreground text-sm mb-1">Watch Property</div>
              <div className="text-xs text-muted-foreground">Get notified about updates for this property</div>
            </div>
            <button
              onClick={() => handleToggleOption('watchProperty')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
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

