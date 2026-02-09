"use client";

import React, { useState } from "react";
import { Home, AlertCircle, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutocompleteSearch } from "@/components/common/AutocompleteSearch";
import type { Location } from "@/lib/api/repliers/services/locations";
import { cn } from "@/lib/utils";

export type AddPropertyInitialData = {
  streetAddress: string;
  propertyType: string;
  unitNumber: string;
  isRoomForRent: boolean;
};

const PROPERTY_TYPES = [
  "House",
  "Apartment",
  "Condo",
  "Townhouse",
  "Duplex",
  "Studio",
  "Other",
];

type AddPropertyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddPropertyInitialData) => void;
};

export function AddPropertyDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddPropertyDialogProps) {
  const [streetAddress, setStreetAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [isRoomForRent, setIsRoomForRent] = useState(false);
  const [touched, setTouched] = useState({ address: false, type: false });

  const addressError = touched.address && !streetAddress.trim();
  const typeError = touched.type && !propertyType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ address: true, type: true });
    if (!streetAddress.trim() || !propertyType) return;
    onSubmit({
      streetAddress: streetAddress.trim(),
      propertyType,
      unitNumber: unitNumber.trim(),
      isRoomForRent,
    });
    onOpenChange(false);
    setStreetAddress("");
    setPropertyType("");
    setUnitNumber("");
    setIsRoomForRent(false);
    setTouched({ address: false, type: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Home className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-left">
                  First, let&apos;s add your property
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-1 text-left">
                Add your property to get started.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="neighbourhood-address">Neighbourhood / area</Label>
            {streetAddress ? (
              <div
                id="neighbourhood-address"
                className="flex items-center gap-3 rounded-lg border border-input bg-muted/30 px-4 py-3"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {streetAddress}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-primary hover:text-primary/90"
                  onClick={() => setStreetAddress("")}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div
                onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                className={cn(addressError && "rounded-lg ring-2 ring-destructive ring-offset-2")}
              >
                <AutocompleteSearch
                  placeholder="Search neighbourhood or area..."
                  locationsOnly
                  className="[&_input]:rounded-lg [&_input]:border-input [&_input]:h-11"
                  onSelectLocation={(loc: Location) => {
                    const display =
                      loc.address?.city && loc.address?.state
                        ? `${loc.name}, ${loc.address.city}, ${loc.address.state}`
                        : loc.name;
                    setStreetAddress(display);
                  }}
                />
              </div>
            )}
            {addressError && (
              <p
                id="address-error"
                className="flex items-center gap-1.5 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                Select a neighbourhood or area
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="property-type">Property type</Label>
            <Select
              value={propertyType}
              onValueChange={setPropertyType}
              onOpenChange={(open) => !open && setTouched((t) => ({ ...t, type: true }))}
            >
              <SelectTrigger
                id="property-type"
                className={cn(
                  "w-full",
                  typeError && "border-destructive focus:ring-destructive"
                )}
                aria-invalid={typeError}
              >
                <SelectValue placeholder="Please select" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {typeError && (
              <p
                className="flex items-center gap-1.5 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                Enter a property type
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-number">Unit number (if applicable)</Label>
            <Input
              id="unit-number"
              value={unitNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitNumber(e.target.value)}
              placeholder="# Enter apartment, suite, or unit number."
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="room-for-rent"
              checked={isRoomForRent}
              onCheckedChange={(checked) => setIsRoomForRent(checked === true)}
            />
            <Label
              htmlFor="room-for-rent"
              className="text-sm font-normal cursor-pointer"
            >
              This is a room for rent with a shared living space
            </Label>
          </div>

          <div className="flex flex-col items-end gap-3 pt-2">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
            >
              See all available actions
            </button>
            <Button type="submit">Create listing</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
