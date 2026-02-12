"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Bell,
  Home,
  Tag,
  Clock,
  Check,
  ShieldCheck,
  LayoutGrid,
} from "lucide-react";

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
 * UI matches PropertyAlerts (ItemBody): benefits list + toggle cards.
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
 */
export interface PropertyAlertsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertOptions: Record<string, boolean>;
  onToggleOption: (option: string) => void;
  title?: string;
  locationName?: string;
  propertyType?: string;
  customAlertOptions?: AlertOption[];
  onSave?: (options: Record<string, boolean>) => void;
  isSaving?: boolean;
}

const BENEFITS = [
  "Get instant notifications when properties matching your criteria become available",
  "Stay ahead of the market with real-time price change alerts",
  "Never miss a new listing in your preferred neighborhoods",
  "Track sold properties to understand market trends",
  "Receive updates on expired listings that may be relisted",
  "Save time by getting personalized property recommendations",
];

function getIconForOptionKey(key: string) {
  switch (key) {
    case "watchProperty":
      return Bell;
    case "newProperties":
    case "newProjects":
    case "newUnits":
      return Home;
    case "soldListings":
      return Tag;
    case "expiredListings":
      return Clock;
    case "priceChanges":
      return Tag;
    case "statusUpdates":
      return Bell;
    default:
      return LayoutGrid;
  }
}

const PropertyAlertsDialog: React.FC<PropertyAlertsDialogProps> = ({
  open,
  onOpenChange,
  alertOptions,
  onToggleOption,
  title = "Why enable property notifications?",
  locationName,
  propertyType = "property",
  customAlertOptions,
  onSave,
  isSaving = false,
}) => {
  const handleSave = () => {
    if (onSave) {
      onSave(alertOptions);
    }
    onOpenChange(false);
  };

  const areaName = locationName || "this area";

  const defaultAlertOptions: AlertOption[] =
    propertyType?.toLowerCase().includes("pre-con") ||
    propertyType?.toLowerCase().includes("preconstruction") ||
    propertyType?.toLowerCase().includes("pre construction")
      ? [
          {
            key: "newProjects",
            label: "New Projects",
            description: `Get notified when new pre-construction projects are added${locationName ? ` in ${locationName}` : ""}`,
          },
          {
            key: "newUnits",
            label: "New Units",
            description: `Get notified when new units are released${locationName ? ` in ${locationName}` : ""}`,
          },
          {
            key: "priceChanges",
            label: "Price Changes",
            description: `Get notified when project prices are updated${locationName ? ` in ${locationName}` : ""}`,
          },
          {
            key: "statusUpdates",
            label: "Status Updates",
            description: `Get notified when project status changes (e.g., now selling, coming soon)${locationName ? ` in ${locationName}` : ""}`,
          },
        ]
      : [
          {
            key: "newProperties",
            label: "New Properties",
            description: `Notify me for new ${propertyType} listings in ${areaName}`,
          },
          {
            key: "soldListings",
            label: "Sold Listings",
            description: `Notify me when ${propertyType} properties are sold in ${areaName}`,
          },
          {
            key: "expiredListings",
            label: "Expired Listings",
            description: `Notify me when ${propertyType} listings expire in ${areaName}`,
          },
        ];

  const alertOptionsList = customAlertOptions || defaultAlertOptions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-secondary rounded-xl p-2 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </span>
            <span className="text-xl text-gray-900">{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Benefits */}
            <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-lg border border-secondary/20">
              {BENEFITS.map((benefit, index) => (
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

            {/* Right Column - Alert toggles */}
            <div className="flex flex-col gap-4">
              {alertOptionsList.map((option) => {
                const Icon = getIconForOptionKey(option.key);
                const isWatchProperty = option.key === "watchProperty";
                return (
                  <div
                    key={option.key}
                    className="flex items-center gap-4 p-4 rounded-lg border border-secondary/20"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm mb-1">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 font-light">
                        {option.description}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Toggle
                        checked={!!alertOptions[option.key]}
                        onCheckedChange={() => onToggleOption(option.key)}
                        disabled={isSaving}
                        variant={isWatchProperty ? "secondary" : "primary"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t mt-6">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
            Save Alerts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyAlertsDialog;
