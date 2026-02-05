"use client";

import React, { useState } from "react";
import { Home, AlertCircle } from "lucide-react";
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
                Once you add your property, you can list it for free on Zillow,
                Trulia, and HotPads to help find your perfect renter.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="street-address">Street address</Label>
            <Input
              id="street-address"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              placeholder="Enter address"
              className={cn(
                "w-full",
                addressError && "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={addressError}
              aria-describedby={addressError ? "address-error" : undefined}
            />
            {addressError && (
              <p
                id="address-error"
                className="flex items-center gap-1.5 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                Enter an address
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
              onChange={(e) => setUnitNumber(e.target.value)}
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
