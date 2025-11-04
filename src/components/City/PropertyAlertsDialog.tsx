"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AlertOptions {
  newProperties: boolean;
  soldListings: boolean;
  expiredListings: boolean;
}

interface PropertyAlertsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertOptions: AlertOptions;
  onToggleOption: (option: keyof AlertOptions) => void;
  cityName: string;
  onSave?: (options: AlertOptions) => void;
}

const PropertyAlertsDialog: React.FC<PropertyAlertsDialogProps> = ({
  open,
  onOpenChange,
  alertOptions,
  onToggleOption,
  cityName,
  onSave,
}) => {
  const handleSave = () => {
    if (onSave) {
      onSave(alertOptions);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Get Property Alerts</DialogTitle>
          <DialogDescription>
            Choose what types of property alerts you'd like to receive for {cityName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          {/* New Properties Toggle */}
          <button
            onClick={() => onToggleOption('newProperties')}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              alertOptions.newProperties
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                alertOptions.newProperties
                  ? 'border-primary bg-primary'
                  : 'border-gray-300 bg-white'
              }`}>
                {alertOptions.newProperties && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">New Properties</div>
                <div className="text-sm text-muted-foreground">Get notified when new listings are added</div>
              </div>
            </div>
          </button>

          {/* Sold Listings Toggle */}
          <button
            onClick={() => onToggleOption('soldListings')}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              alertOptions.soldListings
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                alertOptions.soldListings
                  ? 'border-primary bg-primary'
                  : 'border-gray-300 bg-white'
              }`}>
                {alertOptions.soldListings && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Sold Listings</div>
                <div className="text-sm text-muted-foreground">Get notified when properties are sold</div>
              </div>
            </div>
          </button>

          {/* Expired Listings Toggle */}
          <button
            onClick={() => onToggleOption('expiredListings')}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              alertOptions.expiredListings
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                alertOptions.expiredListings
                  ? 'border-primary bg-primary'
                  : 'border-gray-300 bg-white'
              }`}>
                {alertOptions.expiredListings && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Expired Listings</div>
                <div className="text-sm text-muted-foreground">Get notified when listings expire</div>
              </div>
            </div>
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            Save Alerts
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyAlertsDialog;

