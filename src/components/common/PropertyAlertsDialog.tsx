"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * AlertOption interface for defining custom alert types
 */
export interface AlertOption {
  key: string;
  label: string;
  description: string;
}

/**
 * PropertyAlertsDialog - A reusable dialog component for property notifications
 * 
 * Supports both regular properties and pre-construction projects.
 * 
 * @example
 * // For regular properties:
 * <PropertyAlertsDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   alertOptions={{ newProperties: false, soldListings: false, expiredListings: false }}
 *   onToggleOption={(key) => setAlertOptions(prev => ({ ...prev, [key]: !prev[key] }))}
 *   locationName="Toronto"
 *   propertyType="property"
 * />
 * 
 * @example
 * // For pre-construction projects:
 * <PropertyAlertsDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   alertOptions={{ newProjects: false, newUnits: false, priceChanges: false, statusUpdates: false }}
 *   onToggleOption={(key) => setAlertOptions(prev => ({ ...prev, [key]: !prev[key] }))}
 *   locationName="Toronto"
 *   propertyType="pre-construction"
 * />
 * 
 * @example
 * // With custom alert options:
 * <PropertyAlertsDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   alertOptions={{ customAlert1: false, customAlert2: false }}
 *   onToggleOption={(key) => setAlertOptions(prev => ({ ...prev, [key]: !prev[key] }))}
 *   customAlertOptions={[
 *     { key: 'customAlert1', label: 'Custom Alert 1', description: 'Description here' },
 *     { key: 'customAlert2', label: 'Custom Alert 2', description: 'Description here' }
 *   ]}
 * />
 */
export interface PropertyAlertsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertOptions: Record<string, boolean>;
  onToggleOption: (option: string) => void;
  title?: string;
  description?: string;
  locationName?: string;
  propertyType?: string;
  customAlertOptions?: AlertOption[];
  onSave?: (options: Record<string, boolean>) => void;
}

const PropertyAlertsDialog: React.FC<PropertyAlertsDialogProps> = ({
  open,
  onOpenChange,
  alertOptions,
  onToggleOption,
  title,
  description,
  locationName,
  propertyType = 'property',
  customAlertOptions,
  onSave,
}) => {
  const handleSave = () => {
    if (onSave) {
      onSave(alertOptions);
    }
    onOpenChange(false);
  };

  // Default alert options if custom ones aren't provided
  const defaultAlertOptions: AlertOption[] = propertyType?.toLowerCase().includes('pre-con') || propertyType?.toLowerCase().includes('preconstruction') || propertyType?.toLowerCase().includes('pre construction')
    ? [
        // Pre-construction specific alerts
        {
          key: 'newProjects',
          label: 'New Projects',
          description: `Get notified when new pre-construction projects are added${locationName ? ` in ${locationName}` : ''}`,
        },
        {
          key: 'newUnits',
          label: 'New Units',
          description: `Get notified when new units are released${locationName ? ` in ${locationName}` : ''}`,
        },
        {
          key: 'priceChanges',
          label: 'Price Changes',
          description: `Get notified when project prices are updated${locationName ? ` in ${locationName}` : ''}`,
        },
        {
          key: 'statusUpdates',
          label: 'Status Updates',
          description: `Get notified when project status changes (e.g., now selling, coming soon)${locationName ? ` in ${locationName}` : ''}`,
        },
      ]
    : [
        // Regular property alerts
        {
          key: 'newProperties',
          label: 'New Properties',
          description: `Get notified when new ${propertyType} listings are added${locationName ? ` in ${locationName}` : ''}`,
        },
        {
          key: 'soldListings',
          label: 'Sold Listings',
          description: `Get notified when ${propertyType} properties are sold${locationName ? ` in ${locationName}` : ''}`,
        },
        {
          key: 'expiredListings',
          label: 'Expired Listings',
          description: `Get notified when ${propertyType} listings expire${locationName ? ` in ${locationName}` : ''}`,
        },
      ];

  const alertOptionsList = customAlertOptions || defaultAlertOptions;

  const dialogTitle = title || 'Get Property Alerts';
  const dialogDescription = description || 
    (locationName 
      ? `Choose what types of property alerts you'd like to receive for ${locationName}.`
      : 'Choose what types of property alerts you'd like to receive.');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          {alertOptionsList.map((option) => (
            <button
              key={option.key}
              onClick={() => onToggleOption(option.key)}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                alertOptions[option.key]
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  alertOptions[option.key]
                    ? 'border-primary bg-primary'
                    : 'border-gray-300 bg-white'
                }`}>
                  {alertOptions[option.key] && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            Save Alerts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyAlertsDialog;

