"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, ChevronLeft, ChevronRight, Info, Upload, Image as ImageIcon, Video, Camera, Plus, FileText, Car, Zap, MoreHorizontal, Lightbulb, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AddPropertyInitialData } from "./AddPropertyDialog";

const SIDEBAR_STEPS = [
  { id: "property-info", label: "Property info" },
  { id: "rent-details", label: "Rent details" },
  { id: "media", label: "Media" },
  { id: "amenities", label: "Amenities" },
  { id: "costs-fees", label: "Costs & fees" },
  { id: "final-details", label: "Final details" },
  { id: "review", label: "Review & publish" },
] as const;

const TOTAL_STEPS = 16; // Property info 2, Rent 3, Media 1, Amenities 2, Costs & fees 1, Final details 7
const PROPERTY_INFO_END = 2;
const RENT_DETAILS_END = 5;
const MEDIA_END = 6;
const AMENITIES_END = 8;
const COSTS_FEES_END = 9;
const FINAL_DETAILS_END = 16;

function getSectionAndStep(stepIndex: number): {
  sectionTitle: string;
  stepLabel: string;
  sectionId: string;
} {
  if (stepIndex < 2) {
    return { sectionTitle: "Property info", stepLabel: `Step ${stepIndex + 1} of 2`, sectionId: "property-info" };
  }
  if (stepIndex < 5) {
    return { sectionTitle: "Rent details", stepLabel: `Step ${stepIndex - 2 + 1} of 3`, sectionId: "rent-details" };
  }
  if (stepIndex === 5) {
    return { sectionTitle: "Media", stepLabel: "", sectionId: "media" };
  }
  if (stepIndex < 8) {
    return { sectionTitle: "Amenities", stepLabel: `Step ${stepIndex - 6 + 1} of 2`, sectionId: "amenities" };
  }
  if (stepIndex === 8) {
    return { sectionTitle: "Costs & fees", stepLabel: "", sectionId: "costs-fees" };
  }
  if (stepIndex >= 9 && stepIndex < 16) {
    return { sectionTitle: "Final details", stepLabel: `Step ${stepIndex - 9 + 1} of 7`, sectionId: "final-details" };
  }
  return { sectionTitle: "Final details", stepLabel: "Step 7 of 7", sectionId: "final-details" };
}

const BEDROOM_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
const BATHROOM_OPTIONS = ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];

type ListingFlowProps = {
  initialData: AddPropertyInitialData | null;
};

export function ListingFlow({ initialData }: ListingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Form state (UI only, no schema)
  const [squareFootage, setSquareFootage] = useState("");
  const [totalBedrooms, setTotalBedrooms] = useState("");
  const [totalBathrooms, setTotalBathrooms] = useState("");
  const [hideAddress, setHideAddress] = useState<"no" | "yes">("no");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [dateAvailable, setDateAvailable] = useState("");
  const [pets, setPets] = useState({
    noPets: false,
    cats: false,
    smallDogs: false,
    largeDogs: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [otherAmenity, setOtherAmenity] = useState("");
  const [otherAmenitiesList, setOtherAmenitiesList] = useState<string[]>([]);
  const [laundry, setLaundry] = useState("");
  const [cooling, setCooling] = useState("");
  const [heating, setHeating] = useState("");
  const [appliances, setAppliances] = useState<string[]>([]);
  const [flooring, setFlooring] = useState<string[]>([]);
  const [parking, setParking] = useState<string[]>([]);
  const [outdoor, setOutdoor] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [leaseDuration, setLeaseDuration] = useState("");
  const [leaseTerms, setLeaseTerms] = useState("");
  const [rentersInsurance, setRentersInsurance] = useState<"yes" | "no">("no");
  const [listedBy, setListedBy] = useState<"owner" | "management" | "tenant">("owner");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [allowPhoneContact, setAllowPhoneContact] = useState<"yes" | "no">("yes");
  const [bookToursMethod, setBookToursMethod] = useState<"instantly" | "review">("instantly");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [touched, setTouched] = useState({
    step0: false,
    step2: false,
    step3: false,
    step9: false,
    step11: false,
    step12: false,
  });

  const { sectionTitle, stepLabel, sectionId } = getSectionAndStep(step);
  const completedPropertyInfo = step >= PROPERTY_INFO_END;
  const completedRentDetails = step >= RENT_DETAILS_END;
  const completedMedia = step >= MEDIA_END;
  const completedAmenities = step >= AMENITIES_END;
  const completedCostsFees = step >= COSTS_FEES_END;
  const completedFinalDetails = step >= FINAL_DETAILS_END;

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      setTouched((t) => ({ ...t, step0: true }));
      return !!(squareFootage.trim() && totalBedrooms && totalBathrooms);
    }
    if (s === 2) {
      setTouched((t) => ({ ...t, step2: true }));
      return !!monthlyRent.trim();
    }
    if (s === 3) {
      setTouched((t) => ({ ...t, step3: true }));
      return !!dateAvailable.trim();
    }
    if (s === 9) {
      setTouched((t) => ({ ...t, step9: true }));
      return !!leaseDuration;
    }
    if (s === 11) {
      setTouched((t) => ({ ...t, step11: true }));
      return !!(contactName.trim() && contactEmail.trim());
    }
    if (s === 12) {
      setTouched((t) => ({ ...t, step12: true }));
      return !!phoneNumber.trim();
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const handleSaveExit = () => {
    router.push("/manage-rentals/dashboard/properties");
  };

  const handleFinish = () => {
    if (!validateStep(step)) return;
    router.push("/manage-rentals/dashboard/properties/new");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-[#F8FAFC] rounded-2xl">
      {/* Top row header - full width */}
      <header className="flex items-center justify-between bg-white px-6 py-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold text-foreground">{sectionTitle}</h1>
          {stepLabel && <span className="text-sm text-muted-foreground">{stepLabel}</span>}
        </div>
        <Button variant="outline" onClick={handleSaveExit} className="border-border text-foreground hover:bg-muted/50">
          Save & exit
        </Button>
      </header>

      {/* Below: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar - steps */}
        <aside className="w-56 shrink-0 p-6 overflow-y-auto">
          <nav className="space-y-1" aria-label="Listing steps">
            {SIDEBAR_STEPS.map((item) => {
              const isPropertyInfo = item.id === "property-info";
              const isRentDetails = item.id === "rent-details";
              const isMedia = item.id === "media";
              const isAmenities = item.id === "amenities";
              const isCostsFees = item.id === "costs-fees";
              const isFinalDetails = item.id === "final-details";
              const isCompleted =
                (isPropertyInfo && completedPropertyInfo) ||
                (isRentDetails && completedRentDetails) ||
                (isMedia && completedMedia) ||
                (isAmenities && completedAmenities) ||
                (isCostsFees && completedCostsFees) ||
                (isFinalDetails && completedFinalDetails);
              const isCurrent =
                (isPropertyInfo && step < 2) ||
                (isRentDetails && step >= 2 && step < 5) ||
                (isMedia && step === 5) ||
                (isAmenities && step >= 6 && step < 8) ||
                (isCostsFees && step === 8) ||
                (isFinalDetails && step >= 9 && step < 16);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2",
                    isCurrent && "bg-primary/10"
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-green-600" aria-hidden />
                    ) : (
                      <Circle
                        className={cn(
                          "h-5 w-5",
                          isCurrent ? "text-primary fill-primary/20" : "text-muted-foreground"
                        )}
                        aria-hidden
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl my-6 mr-6">
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl">
              {/* Step 0: Property info – size */}
              {step === 0 && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    Let&apos;s start creating your listing
                  </h2>
                  <p className="text-muted-foreground mt-1 mb-8">
                    Add or review details about your property&apos;s size.
                  </p>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="square-footage">
                        Square footage <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="square-footage"
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 1200"
                          value={squareFootage}
                          onChange={(e) => setSquareFootage(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, step0: true }))}
                          className={cn(
                            "max-w-[140px]",
                            touched.step0 && !squareFootage.trim() && "border-destructive focus-visible:ring-destructive"
                          )}
                          aria-invalid={touched.step0 && !squareFootage.trim()}
                          aria-describedby={touched.step0 && !squareFootage.trim() ? "square-footage-error" : undefined}
                        />
                        <span className="text-sm text-muted-foreground">sq. ft.</span>
                      </div>
                      {touched.step0 && !squareFootage.trim() && (
                        <p id="square-footage-error" className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          Enter square footage
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">
                          Total bedrooms <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={totalBedrooms}
                          onValueChange={setTotalBedrooms}
                          onOpenChange={(open) => !open && setTouched((t) => ({ ...t, step0: true }))}
                        >
                          <SelectTrigger
                            id="bedrooms"
                            className={cn(
                              touched.step0 && !totalBedrooms && "border-destructive focus:ring-destructive"
                            )}
                            aria-invalid={touched.step0 && !totalBedrooms}
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {BEDROOM_OPTIONS.map((n) => (
                              <SelectItem key={n} value={n}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.step0 && !totalBedrooms && (
                          <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                            Select total bedrooms
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">
                          Total bathrooms <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={totalBathrooms}
                          onValueChange={setTotalBathrooms}
                          onOpenChange={(open) => !open && setTouched((t) => ({ ...t, step0: true }))}
                        >
                          <SelectTrigger
                            id="bathrooms"
                            className={cn(
                              touched.step0 && !totalBathrooms && "border-destructive focus:ring-destructive"
                            )}
                            aria-invalid={touched.step0 && !totalBathrooms}
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {BATHROOM_OPTIONS.map((n) => (
                              <SelectItem key={n} value={n}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.step0 && !totalBathrooms && (
                          <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                            Select total bathrooms
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Property info – hide address */}
              {step === 1 && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    Do you want to hide the property address on this listing?
                  </h2>
                  <div className="mt-8 flex gap-8">
                    <div className="space-y-4 flex-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Hide property address
                      </Label>
                      <RadioGroup
                        value={hideAddress}
                        onValueChange={(v) => setHideAddress(v as "no" | "yes")}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="hide-no" />
                          <Label htmlFor="hide-no" className="font-normal cursor-pointer">
                            No (Recommended)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="hide-yes" />
                          <Label htmlFor="hide-yes" className="font-normal cursor-pointer">
                            Yes
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4 max-w-sm">
                      <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                      <div className="text-sm text-foreground">
                        <p className="font-medium">Showing the property address</p>
                        <p className="text-muted-foreground mt-1">
                          You can hide the address if privacy is a concern, but the
                          listing may receive fewer views and contacts than listings
                          that show the property address.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Rent details – rent & deposit */}
              {step === 2 && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    How much are the monthly rent and the security deposit?
                  </h2>
                  <p className="text-muted-foreground mt-1 mb-6">
                    A security deposit isn&apos;t required, but you can choose to
                    collect one.
                  </p>
                  <div className="flex items-center gap-2 justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 mb-8">
                    <p className="text-sm text-muted-foreground">
                      The current Rent Zestimate for this property is:
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">$2,963</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="monthly-rent">
                        Monthly rent <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative max-w-[200px]">
                        <Input
                          id="monthly-rent"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={monthlyRent}
                          onChange={(e) => setMonthlyRent(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, step2: true }))}
                          className={cn(
                            "pr-16",
                            touched.step2 && !monthlyRent.trim() && "border-destructive focus-visible:ring-destructive"
                          )}
                          aria-invalid={touched.step2 && !monthlyRent.trim()}
                          aria-describedby={touched.step2 && !monthlyRent.trim() ? "monthly-rent-error" : undefined}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          /month
                        </span>
                      </div>
                      {touched.step2 && !monthlyRent.trim() && (
                        <p id="monthly-rent-error" className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          Enter monthly rent
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="security-deposit">Security deposit</Label>
                      <Input
                        id="security-deposit"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(e.target.value)}
                        className="max-w-[200px]"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        Do you want to promote a special offer?
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Attract more renters with a move-in special.
                      </p>
                      <Button variant="outline" className="mt-3 gap-2">
                        <span className="text-lg">+</span> Add an offer
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Rent details – date available */}
              {step === 3 && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    When is your property available to rent?
                  </h2>
                  <div className="mt-8 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="date-available">
                        Date available <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="date-available"
                          type="date"
                          value={dateAvailable}
                          onChange={(e) => setDateAvailable(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, step3: true }))}
                          className={cn(
                            "max-w-[180px]",
                            touched.step3 && !dateAvailable.trim() && "border-destructive focus-visible:ring-destructive"
                          )}
                          aria-invalid={touched.step3 && !dateAvailable.trim()}
                          aria-describedby={touched.step3 && !dateAvailable.trim() ? "date-available-error" : undefined}
                        />
                        <span className="text-muted-foreground" aria-hidden>
                          📅
                        </span>
                      </div>
                      {touched.step3 && !dateAvailable.trim() && (
                        <p id="date-available-error" className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          Enter date available
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Quick select:{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setDateAvailable("2026-03-01")}
                      >
                        Set to 03/01/2026
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* Step 4: Rent details – pet policy */}
              {step === 4 && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    What&apos;s your pet policy?
                  </h2>
                  <p className="text-muted-foreground mt-1 mb-8">
                    Let renters know if you allow pets and, if so, what kind.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="no-pets"
                        checked={pets.noPets}
                        onCheckedChange={(c) =>
                          setPets((prev) => ({ ...prev, noPets: c === true }))
                        }
                      />
                      <Label htmlFor="no-pets" className="font-normal cursor-pointer">
                        No pets allowed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cats"
                        checked={pets.cats}
                        onCheckedChange={(c) =>
                          setPets((prev) => ({ ...prev, cats: c === true }))
                        }
                      />
                      <Label htmlFor="cats" className="font-normal cursor-pointer">
                        Cats allowed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="small-dogs"
                        checked={pets.smallDogs}
                        onCheckedChange={(c) =>
                          setPets((prev) => ({ ...prev, smallDogs: c === true }))
                        }
                      />
                      <Label htmlFor="small-dogs" className="font-normal cursor-pointer">
                        Small dogs allowed
                      </Label>
                    </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="large-dogs"
                      checked={pets.largeDogs}
                      onCheckedChange={(c) =>
                        setPets((prev) => ({ ...prev, largeDogs: c === true }))
                      }
                    />
                    <Label htmlFor="large-dogs" className="font-normal cursor-pointer">
                      Large dogs allowed
                    </Label>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Media */}
            {step === 5 && (
              <>
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Add photos</h2>
                    <p className="text-muted-foreground mt-1">
                      Photos help renters imagine living in your place.
                    </p>
                    <div
                      className="mt-6 border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center gap-2 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                    >
                      <ImageIcon className="h-12 w-12 text-muted-foreground" aria-hidden />
                      <p className="font-medium text-foreground">Drag photos here</p>
                      <p className="text-sm text-muted-foreground">or select from your computer</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={() => {}}
                      />
                    </div>
                    <Button variant="outline" className="mt-4 gap-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Select photos
                    </Button>
                    <div className="mt-6 flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
                      <Camera className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                      <div>
                        <p className="font-medium text-foreground">Photo tip</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Renters like to see photos of the room they&apos;ll be renting. Consider adding photos of the room, in addition to photos of the property&apos;s shared areas.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">3D Tour</h2>
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                      <Video className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                      <span className="text-sm text-muted-foreground flex-1">
                        Add via Zillow 3D Home app or an external link
                      </span>
                      <Button size="sm">Add tour</Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 6: Amenities – Step 1 of 2 */}
            {step === 6 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  Showcase what&apos;s included in your home
                </h2>
                <p className="text-muted-foreground mt-1 mb-8">
                  Sharing more will help renters see themselves in your home.
                </p>
                <div className="space-y-8">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Laundry</Label>
                    <RadioGroup value={laundry} onValueChange={setLaundry} className="flex flex-wrap gap-4">
                      {["Washer-dryer included", "Washer-dryer hookups", "Shared or in building", "No laundry facilities"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`laundry-${opt}`} />
                          <Label htmlFor={`laundry-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Cooling</Label>
                    <RadioGroup value={cooling} onValueChange={setCooling} className="flex flex-wrap gap-4">
                      {["Central", "Wall", "Window", "None"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`cooling-${opt}`} />
                          <Label htmlFor={`cooling-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Heating</Label>
                    <RadioGroup value={heating} onValueChange={setHeating} className="flex flex-wrap gap-4">
                      {["Baseboard", "Forced air", "Heat pump", "Wall"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`heating-${opt}`} />
                          <Label htmlFor={`heating-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Appliances</Label>
                    <div className="flex flex-wrap gap-4">
                      {["Dishwasher", "Freezer", "Microwave", "Oven", "Refrigerator", "Trash compactor"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <Checkbox
                            id={`appliances-${opt}`}
                            checked={appliances.includes(opt)}
                            onCheckedChange={(c) =>
                              setAppliances((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                            }
                          />
                          <Label htmlFor={`appliances-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Flooring</Label>
                    <div className="flex flex-wrap gap-4">
                      {["Carpet", "Hardwood", "Tile", "Linoleum", "Concrete", "Laminate"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <Checkbox
                            id={`flooring-${opt}`}
                            checked={flooring.includes(opt)}
                            onCheckedChange={(c) =>
                              setFlooring((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                            }
                          />
                          <Label htmlFor={`flooring-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 7: Amenities – Step 2 of 2 */}
            {step === 7 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  Now tell us more about your property
                </h2>
                <p className="text-muted-foreground mt-1 mb-8">
                  Sharing more will help renters see themselves in your home.
                </p>
                <div className="space-y-8">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Parking</Label>
                    <div className="flex flex-wrap gap-4">
                      {["Attached garage", "Detached garage", "Off-street parking", "Carport", "Street parking"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <Checkbox
                            id={`parking-${opt}`}
                            checked={parking.includes(opt)}
                            onCheckedChange={(c) =>
                              setParking((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                            }
                          />
                          <Label htmlFor={`parking-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Outdoor amenities</Label>
                    <div className="flex flex-wrap gap-4">
                      {["Balcony or deck", "Pool", "Bicycle storage", "Fenced yard", "Garden"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <Checkbox
                            id={`outdoor-${opt}`}
                            checked={outdoor.includes(opt)}
                            onCheckedChange={(c) =>
                              setOutdoor((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                            }
                          />
                          <Label htmlFor={`outdoor-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Accessibility</Label>
                    <div className="flex flex-wrap gap-4">
                      {["Disabled access", "Wheelchair accessible"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <Checkbox
                            id={`accessibility-${opt}`}
                            checked={accessibility.includes(opt)}
                            onCheckedChange={(c) =>
                              setAccessibility((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                            }
                          />
                          <Label htmlFor={`accessibility-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Other amenities</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Example: Pet area"
                        value={otherAmenity}
                        onChange={(e) => setOtherAmenity(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button
                        type="button"
                        variant="default"
                        className="gap-1.5"
                        onClick={() => {
                          if (otherAmenity.trim()) {
                            setOtherAmenitiesList((prev) => [...prev, otherAmenity.trim()]);
                            setOtherAmenity("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    {otherAmenitiesList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {otherAmenitiesList.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Step 8: Costs & fees */}
            {step === 8 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  What additional costs and fees do you charge?
                </h2>
                <p className="text-muted-foreground mt-1 mb-8">
                  We&apos;ve highlighted some of the most common fee categories. These details help renters know the real cost of renting your property before they apply.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {[
                    { id: "admin", label: "Administrative", icon: FileText },
                    { id: "parking", label: "Parking", icon: Car },
                    { id: "utilities", label: "Utilities", icon: Zap },
                    { id: "other", label: "Other categories", icon: MoreHorizontal },
                  ].map(({ id, label, icon: Icon }) => (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{label}</span>
                      </div>
                      <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
                  <Lightbulb className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-medium text-foreground">Tips for adding costs and fees</p>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 list-disc list-inside">
                      <li>Wait to add application fees — we&apos;ll ask about those last.</li>
                      <li>Only add the fees you need, and note which are included in the base rent.</li>
                      <li>Some states require disclosing certain fees — be sure to check what&apos;s required for your area.</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Step 9: Final details – Step 1 of 7 (lease duration) */}
            {step === 9 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  What&apos;s the duration of the lease?
                </h2>
                <div className="mt-8">
                  <Label className="text-sm font-medium mb-3 block">Lease duration</Label>
                  <RadioGroup value={leaseDuration} onValueChange={setLeaseDuration} className="space-y-3">
                    {["1 month", "6 months", "1 year", "Rent to own", "Sublet/temporary"].map((opt) => (
                      <div key={opt} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`lease-${opt}`} />
                        <Label htmlFor={`lease-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {touched.step9 && !leaseDuration && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive mt-2" role="alert">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                      Select lease duration
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 10: Final details – Step 2 of 7 (lease terms + renters insurance) */}
            {step === 10 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  What should renters know about the lease terms?
                </h2>
                <p className="text-muted-foreground mt-1 mb-6">
                  Help renters decide if your property&apos;s a good fit by including key lease details like duration, fees and utility costs, and other policies.
                </p>
                <div className="flex gap-8 flex-col lg:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="lease-terms">Lease terms</Label>
                    <Textarea
                      id="lease-terms"
                      placeholder="Example: Owner pays for water. Renter is responsible for gas and electric. Last month's rent due at signing. No smoking allowed. Up to three pets total allowed."
                      value={leaseTerms}
                      onChange={(e) => setLeaseTerms(e.target.value)}
                      className="min-h-[140px] resize-y"
                    />
                  </div>
                  <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4 lg:max-w-sm shrink-0">
                    <Lightbulb className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Tips for lease descriptions</p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>Include the lease duration.</li>
                        <li>Add your smoking and parking policies, as well as any other pet policy details not already covered.</li>
                        <li>Outline tenant responsibilities for maintenance, if any.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Label className="text-sm font-medium mb-3 block">
                    Do you require tenants to obtain renters insurance?
                  </Label>
                  <RadioGroup value={rentersInsurance} onValueChange={(v) => setRentersInsurance(v as "yes" | "no")} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="insurance-yes" />
                      <Label htmlFor="insurance-yes" className="font-normal cursor-pointer">
                        Yes, I require renters insurance
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="insurance-no" />
                      <Label htmlFor="insurance-no" className="font-normal cursor-pointer">
                        No, I do not require renters insurance
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {/* Step 11: Final details – Step 3 of 7 (who's listing) */}
            {step === 11 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  Who&apos;s listing this property for rent?
                </h2>
                <p className="text-muted-foreground mt-1 mb-6">
                  Enter your information, unless you&apos;re creating the listing for someone else and they should be the main contact person.
                </p>
                <div className="flex gap-8 flex-col lg:flex-row">
                  <div className="flex-1 space-y-6">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Listed by</Label>
                      <RadioGroup
                        value={listedBy}
                        onValueChange={(v) => setListedBy(v as "owner" | "management" | "tenant")}
                        className="space-y-3"
                      >
                        {[
                          { value: "owner", label: "Property owner" },
                          { value: "management", label: "Management company or broker" },
                          { value: "tenant", label: "Tenant" },
                        ].map(({ value, label }) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`listed-${value}`} />
                            <Label htmlFor={`listed-${value}`} className="font-normal cursor-pointer">{label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact-name"
                        placeholder="Your full name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, step11: true }))}
                        className={cn(
                          touched.step11 && !contactName.trim() && "border-destructive focus-visible:ring-destructive"
                        )}
                        aria-invalid={touched.step11 && !contactName.trim()}
                      />
                      {touched.step11 && !contactName.trim() && (
                        <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          Enter your name
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="Add email address"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, step11: true }))}
                        className={cn(
                          touched.step11 && !contactEmail.trim() && "border-destructive focus-visible:ring-destructive"
                        )}
                        aria-invalid={touched.step11 && !contactEmail.trim()}
                      />
                      {touched.step11 && !contactEmail.trim() && (
                        <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          Enter email address
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4 lg:max-w-sm shrink-0">
                    <Lightbulb className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Tips for contact information</p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>We&apos;ll deliver renter inquiries to the email you provide here.</li>
                        <li>Other communications will be sent to your account email.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 12: Final details – Step 4 of 7 (verify phone) */}
            {step === 12 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">Verify your phone number</h2>
                <p className="text-muted-foreground mt-1 mb-6">
                  For your security, we&apos;ll send a one-time verification code to this number to verify that this listing belongs to you.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="phone-number">
                    Phone number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="Add phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, step12: true }))}
                    className={cn(
                      "max-w-[280px]",
                      touched.step12 && !phoneNumber.trim() && "border-destructive focus-visible:ring-destructive"
                    )}
                    aria-invalid={touched.step12 && !phoneNumber.trim()}
                  />
                  {touched.step12 && !phoneNumber.trim() && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                      Enter phone number
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 13: Final details – Step 5 of 7 (allow phone contact) */}
            {step === 13 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  Do you want to allow renters to contact you by phone?
                </h2>
                <p className="text-muted-foreground mt-1 mb-6">
                  If you choose No, the listing will display without a phone number. Please note, to protect your information, the number displayed on your listing differs from your actual number.
                </p>
                <div className="flex gap-8 flex-col lg:flex-row">
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-3 block">Allow renters to contact you by phone</Label>
                    <RadioGroup
                      value={allowPhoneContact}
                      onValueChange={(v) => setAllowPhoneContact(v as "yes" | "no")}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="allow-phone-yes" />
                        <Label htmlFor="allow-phone-yes" className="font-normal cursor-pointer">Yes (Recommended)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="allow-phone-no" />
                        <Label htmlFor="allow-phone-no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4 lg:max-w-sm shrink-0">
                    <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">How is my number used?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        We&apos;ll assign your listing a random number that will automatically route incoming calls to your phone. It&apos;s up to you to share your number directly with an applicant.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 14: Final details – Step 6 of 7 (book tours) */}
            {step === 14 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">Choose a way to book tours</h2>
                <p className="text-muted-foreground mt-1 mb-6">
                  You can change your settings anytime. Skip this if you prefer to book tours on your own.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                  <button
                    type="button"
                    onClick={() => setBookToursMethod("instantly")}
                    className={cn(
                      "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
                      bookToursMethod === "instantly"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex w-full items-start justify-between">
                      <Zap className="h-6 w-6 text-primary shrink-0" aria-hidden />
                      {bookToursMethod === "instantly" && (
                        <Check className="h-5 w-5 text-primary shrink-0" aria-hidden />
                      )}
                    </div>
                    <span className="mt-2 font-medium text-foreground">Book tours instantly</span>
                    <span className="inline-block mt-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      MOST EFFICIENT
                    </span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Renters directly book a time from the availability provided on your listing.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookToursMethod("review")}
                    className={cn(
                      "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
                      bookToursMethod === "review"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex w-full items-start justify-between">
                      <Shield className="h-6 w-6 text-muted-foreground shrink-0" aria-hidden />
                      {bookToursMethod === "review" && (
                        <Check className="h-5 w-5 text-primary shrink-0" aria-hidden />
                      )}
                    </div>
                    <span className="mt-2 font-medium text-foreground">Review and confirm</span>
                    <span className="inline-block mt-1 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      MORE CONTROL
                    </span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Renters request a time from the availability on your listing, then you confirm or decline.
                    </p>
                  </button>
                </div>
              </>
            )}

            {/* Step 15: Final details – Step 7 of 7 (property description) */}
            {step === 15 && (
              <>
                <h2 className="text-2xl font-bold text-foreground">Describe the property.</h2>
                <p className="text-muted-foreground mt-1 mb-6">
                  Write several sentences describing the upgrades and desirable features that will attract renters to your property.
                </p>
                <div className="flex gap-8 flex-col lg:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="property-description">Property description</Label>
                    <Textarea
                      id="property-description"
                      placeholder="Freshly painted home with new appliances and carpeting. Easy walking to public transit and a great neighborhood."
                      value={propertyDescription}
                      onChange={(e) => setPropertyDescription(e.target.value)}
                      className="min-h-[140px] resize-y"
                    />
                  </div>
                  <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4 lg:max-w-sm shrink-0">
                    <Lightbulb className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Tips for property descriptions</p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>Market the property&apos;s proximity to transit, dining, shopping, and other local attractions.</li>
                        <li>Mention upgrades, attractive amenities, and other appealing details.</li>
                        <li>Indicate whether you live on-site.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>
          </main>

          <footer className="flex items-center justify-between px-8 py-4 shrink-0 bg-white">
            <Button variant="outline" onClick={handleBack} disabled={step === 0} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="gap-2">
                Finish
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
