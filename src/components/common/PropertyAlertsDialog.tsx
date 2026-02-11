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
import { Bell, CheckCircle2, Mail, Smartphone } from 'lucide-react';

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
      : `Choose what types of property alerts you'd like to receive.`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold">{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Information */}
          <div className="space-y-6">
            <div className="bg-secondary/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Stay Informed</h3>
                  <p className="text-sm text-muted-foreground">Never miss an opportunity</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Instant Notifications</p>
                    <p className="text-xs text-muted-foreground">Get alerts as soon as new properties match your criteria</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Email Updates</p>
                    <p className="text-xs text-muted-foreground">Receive detailed alerts directly in your inbox</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Mobile Friendly</p>
                    <p className="text-xs text-muted-foreground">Access your alerts anywhere, anytime</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                {locationName 
                  ? `You'll receive notifications for ${propertyType === 'pre-construction' || propertyType?.toLowerCase().includes('pre-con') ? 'pre-construction projects' : 'properties'} in ${locationName} based on your selected preferences.`
                  : `You'll receive notifications based on your selected preferences.`}
              </p>
            </div>
          </div>

          {/* Right Column: Alert Options */}
          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              {alertOptionsList.map((option) => (
                <button
                  key={option.key}
                  onClick={() => onToggleOption(option.key)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-md border transition-all text-left ${
                    alertOptions[option.key]
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
                    alertOptions[option.key]
                      ? 'border-primary bg-primary'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {alertOptions[option.key] && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground mb-0.5">{option.label}</div>
                    <div className="text-xs text-muted-foreground leading-snug">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
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

