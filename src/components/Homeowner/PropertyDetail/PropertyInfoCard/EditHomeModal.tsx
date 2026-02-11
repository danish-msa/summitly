"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Home, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditHomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertySlug?: string;
  addressLine?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  lotSize?: string;
  garage?: number | string;
  yearBuilt?: number | string;
}

function formatSqft(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return `${value.toLocaleString()} Sq.Ft.`;
  const asNumber = Number(String(value).replace(/[^\d.]/g, ""));
  if (!Number.isNaN(asNumber) && asNumber > 0) return `${asNumber.toLocaleString()} Sq.Ft.`;
  return String(value);
}

export default function EditHomeModal({
  open,
  onOpenChange,
  propertySlug,
  addressLine,
  streetNumber,
  streetName,
  city,
  state,
  zip,
  beds,
  baths,
  sqft,
  lotSize,
  garage,
  yearBuilt,
}: EditHomeModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [bedrooms, setBedrooms] = useState("");
  const [fullBathrooms, setFullBathrooms] = useState("");
  const [partialBathrooms, setPartialBathrooms] = useState("");
  const [totalRooms, setTotalRooms] = useState("");
  const [livingArea, setLivingArea] = useState("");
  const [lotSizeValue, setLotSizeValue] = useState("");
  const [basement, setBasement] = useState("");
  const [pool, setPool] = useState<"Yes" | "No">("No");
  const [garageType, setGarageType] = useState("");
  const [condition, setCondition] = useState("Worn but Adequate");

  const initialState = useMemo(() => {
    const sqftFormatted = formatSqft(sqft);
    return {
      bedrooms: beds ? String(beds) : "",
      fullBathrooms: baths ? String(baths) : "",
      partialBathrooms: "",
      totalRooms: "",
      livingArea: sqftFormatted || "",
      lotSizeValue: lotSize ? String(lotSize) : "",
      basement: "",
      pool: "No" as const,
      garageType: garage ? String(garage) : "",
      condition: "Worn but Adequate",
    };
  }, [beds, baths, sqft, lotSize, garage]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      return;
    }

    setBedrooms(initialState.bedrooms);
    setFullBathrooms(initialState.fullBathrooms);
    setPartialBathrooms(initialState.partialBathrooms);
    setTotalRooms(initialState.totalRooms);
    setLivingArea(initialState.livingArea);
    setLotSizeValue(initialState.lotSizeValue);
    setBasement(initialState.basement);
    setPool(initialState.pool);
    setGarageType(initialState.garageType);
    setCondition(initialState.condition);
  }, [open, initialState]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setBedrooms(initialState.bedrooms);
    setFullBathrooms(initialState.fullBathrooms);
    setPartialBathrooms(initialState.partialBathrooms);
    setTotalRooms(initialState.totalRooms);
    setLivingArea(initialState.livingArea);
    setLotSizeValue(initialState.lotSizeValue);
    setBasement(initialState.basement);
    setPool(initialState.pool);
    setGarageType(initialState.garageType);
    setCondition(initialState.condition);
  };

  const handleSaveEdit = () => {
    // Persist to user's profile (requires login; caller already gates)
    if (propertySlug) {
      fetch("/api/v1/my-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: propertySlug,
          addressLine: addressLine || "",
          address: {
            streetNumber,
            streetName,
            city,
            state,
            zip,
          },
          details: {
            bedrooms: bedrooms || undefined,
            fullBathrooms: fullBathrooms || undefined,
            partialBathrooms: partialBathrooms || undefined,
            totalRooms: totalRooms || undefined,
            livingAreaSqft: livingArea || undefined,
            lotSize: lotSizeValue || undefined,
            basement: basement || undefined,
            pool,
            garageType: garageType || undefined,
            condition: condition || undefined,
            yearBuilt: yearBuilt || undefined,
          },
        }),
      }).catch(() => {
        // best-effort; UI can be improved later with toast
      });
    }
    setIsEditing(false);
  };

  const rows: Array<{ label: string; value?: string; add?: boolean }> = [
    { label: "Bedrooms", value: beds ? String(beds) : undefined, add: !beds },
    { label: "Full bathrooms", value: baths ? String(baths) : undefined, add: !baths },
    { label: "Partial bathrooms", value: undefined, add: true },
    { label: "Total rooms", value: undefined, add: true },
    { label: "Living area", value: formatSqft(sqft), add: !sqft },
    { label: "Lot size", value: lotSize ? String(lotSize) : undefined, add: !lotSize },
    { label: "Basement", value: undefined, add: true },
    { label: "Pool", value: "No" },
    {
      label: "Garage Type",
      value: garage ? `${garage} space${String(garage) === "1" ? "" : "s"}` : undefined,
      add: !garage,
    },
    { label: "Year built", value: yearBuilt ? String(yearBuilt) : undefined, add: !yearBuilt },
    { label: "Condition", value: undefined, add: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] max-h-[90vh] p-0 overflow-hidden bg-white flex flex-col [&>button[class*='absolute']]:hidden">
        {/* Header */}
        <div className="bg-sky-500 text-white px-6 py-5 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-base font-semibold">Home details</h2>
              </div>
              <p className="mt-2 text-sm text-white/90 leading-relaxed max-w-2xl">
                Here's what we found in the public record of this home's most recent sale. Does everything look okay? Please verify that all the details we've gathered are accurate.
              </p>
            </div>

            <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Body (scrolls if needed) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Your home at a glance</h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm text-sky-600 hover:underline"
                  aria-label="Edit home details"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </button>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-2">
                <div className="rounded-lg bg-white">
                  {rows.map((row, idx) => (
                    <div
                      key={row.label}
                      className={[
                        "flex items-center justify-between px-5 py-4",
                        idx !== 0 ? "border-t border-gray-100" : "",
                      ].join(" ")}
                    >
                      <div className="text-sm text-gray-600">{row.label}</div>

                      <div className="text-sm font-medium text-gray-900">
                        {row.add ? (
                          <button
                            type="button"
                            className="text-sky-600 hover:underline font-medium inline-flex items-center gap-2"
                            aria-label={`Add ${row.label}`}
                          >
                            <span className="text-base leading-none">+</span>
                            Add now
                          </button>
                        ) : (
                          row.value ?? "-"
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-2">
              <div className="bg-white rounded-lg p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-900">Your home at a glance</h3>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Cancel editing"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="text-emerald-600 hover:text-emerald-700"
                      aria-label="Save edits"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Bedrooms */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Bedrooms</div>
                    <Input
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="h-10 w-[110px] rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
                    />
                  </div>

                  {/* Full bathrooms */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Full bathrooms</div>
                    <Input
                      value={fullBathrooms}
                      onChange={(e) => setFullBathrooms(e.target.value)}
                      className="h-10 w-[110px] rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
                    />
                  </div>

                  {/* Partial bathrooms */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Partial bathrooms</div>
                    <Input
                      value={partialBathrooms}
                      onChange={(e) => setPartialBathrooms(e.target.value)}
                      placeholder="Add value"
                      className="h-10 w-[140px] rounded-lg border border-gray-200 px-3 text-sm"
                    />
                  </div>

                  {/* Total rooms */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Total rooms</div>
                    <Input
                      value={totalRooms}
                      onChange={(e) => setTotalRooms(e.target.value)}
                      placeholder="Add value"
                      className="h-10 w-[140px] rounded-lg border border-gray-200 px-3 text-sm"
                    />
                  </div>

                  {/* Living area */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Living area</div>
                    <Input
                      value={livingArea}
                      onChange={(e) => setLivingArea(e.target.value)}
                      placeholder="Add value"
                      className="h-10 w-[160px] rounded-lg border border-gray-200 px-3 text-sm"
                    />
                  </div>

                  {/* Lot size */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Lot size</div>
                    <Input
                      value={lotSizeValue}
                      onChange={(e) => setLotSizeValue(e.target.value)}
                      placeholder="Add value"
                      className="h-10 w-[160px] rounded-lg border border-gray-200 px-3 text-sm"
                    />
                  </div>

                  {/* Basement */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Basement</div>
                    <Input
                      value={basement}
                      onChange={(e) => setBasement(e.target.value)}
                      placeholder="Add value"
                      className="h-10 w-[160px] rounded-lg border border-gray-200 px-3 text-sm"
                    />
                  </div>

                  {/* Pool */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Pool</div>
                    <div className="w-[110px]">
                      <Select value={pool} onValueChange={(v) => setPool(v as "Yes" | "No")}>
                        <SelectTrigger className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
                          <SelectValue placeholder="No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Garage Type */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Garage Type</div>
                    <Input
                      value={garageType}
                      onChange={(e) => setGarageType(e.target.value)}
                      placeholder="Add value"
                      className="h-10 w-[160px] rounded-lg border border-gray-200 px-3 text-sm"
                    />
                  </div>

                  {/* Condition */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm text-gray-600">Condition</div>
                    <div className="w-[200px]">
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Worn but Adequate">Worn but Adequate</SelectItem>
                          <SelectItem value="Needs work">Needs work</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-6 bg-white">
          <Button
            type="button"
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-6 text-base font-semibold"
            onClick={() => {
              handleSaveEdit();
              onOpenChange(false);
            }}
          >
            Save
          </Button>

          <p className="mt-6 text-xs text-gray-500 leading-relaxed">
            The data we access comes from your county assessor's office. If you have made improvements or renovations absent of permits it will not be reflected here. This is not an official record. The information entered or corrected above will only be visible to you. Please contact your county to ensure the information is available and that the public record is accurate.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

