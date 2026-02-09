"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Info, Upload, Image as ImageIcon, Video, Camera, Plus, FileText, Car, Zap, MoreHorizontal, Lightbulb, AlertCircle, Shield, Home, DollarSign, ListChecks, Eye, Send, X } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AddPropertyInitialData } from "./AddPropertyDialog";

const SECTIONS = [
  { id: "property-info", label: "Property info" },
  { id: "rent-details", label: "Rent details" },
  { id: "media", label: "Media" },
  { id: "amenities", label: "Amenities" },
  { id: "costs-fees", label: "Costs & fees" },
  { id: "final-details", label: "Final details" },
  { id: "review", label: "Review & publish" },
] as const;

const TOTAL_STEPS = 17; // ... Final details 7, Review & publish 1
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
  if (stepIndex === 16) {
    return { sectionTitle: "Review & publish", stepLabel: "", sectionId: "review" };
  }
  return { sectionTitle: "Review & publish", stepLabel: "", sectionId: "review" };
}

const BEDROOM_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
const BATHROOM_OPTIONS = ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export interface PendingImage {
  file: File;
  preview: string;
  id: string;
}

export type FeeCategoryId = "admin" | "parking" | "utilities" | "other";

export interface FeeEntry {
  id: string;
  name: string;
  amount: string;
}

const FEE_CATEGORIES: { id: FeeCategoryId; label: string; icon: typeof FileText }[] = [
  { id: "admin", label: "Administrative", icon: FileText },
  { id: "parking", label: "Parking", icon: Car },
  { id: "utilities", label: "Utilities", icon: Zap },
  { id: "other", label: "Other categories", icon: MoreHorizontal },
];

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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
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
  const [feeCategories, setFeeCategories] = useState<Record<FeeCategoryId, FeeEntry[]>>({
    admin: [],
    parking: [],
    utilities: [],
    other: [],
  });
  const [openFeePopover, setOpenFeePopover] = useState<FeeCategoryId | null>(null);
  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [expandedReviewSection, setExpandedReviewSection] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    step0: false,
    step2: false,
    step3: false,
    step9: false,
    step11: false,
    step12: false,
  });

  const [openSections, setOpenSections] = useState<string[]>([
    "property-info",
    "rent-details",
    "media",
    "amenities",
    "costs-fees",
    "final-details",
    "review",
  ]);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector("[data-sidebar], .sidebar, [class*=\"sidebar\"]") as HTMLElement;
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth);
      } else {
        const mainContainer = document.querySelector("main")?.parentElement;
        if (mainContainer) {
          const sidebarElement = mainContainer.querySelector("[class*=\"w-\"]") as HTMLElement;
          if (sidebarElement && sidebarElement !== mainContainer.querySelector("main")?.parentElement) {
            setSidebarWidth(sidebarElement.offsetWidth);
          }
        }
      }
    };
    updateSidebarWidth();
    window.addEventListener("resize", updateSidebarWidth);
    const interval = setInterval(updateSidebarWidth, 200);
    return () => {
      window.removeEventListener("resize", updateSidebarWidth);
      clearInterval(interval);
    };
  }, []);

  const pendingImagesRef = useRef<PendingImage[]>([]);
  pendingImagesRef.current = pendingImages;
  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const toAdd: PendingImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`File "${file.name}" exceeds 10MB limit.`);
        continue;
      }
      toAdd.push({
        file,
        preview: URL.createObjectURL(file),
        id: `pending-${Date.now()}-${i}-${Math.random()}`,
      });
    }
    if (toAdd.length > 0) {
      setPendingImages((prev) => [...prev, ...toAdd]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const addFee = (categoryId: FeeCategoryId, name: string, amount: string) => {
    if (!name.trim()) return;
    const entry: FeeEntry = {
      id: `fee-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      amount: amount.trim(),
    };
    setFeeCategories((prev) => ({
      ...prev,
      [categoryId]: [...prev[categoryId], entry],
    }));
    setNewFeeName("");
    setNewFeeAmount("");
    setOpenFeePopover(null);
  };

  const removeFee = (categoryId: FeeCategoryId, feeId: string) => {
    setFeeCategories((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((f) => f.id !== feeId),
    }));
  };

  const navigateToSection = (section: string) => {
    if (!openSections.includes(section)) {
      setOpenSections((prev) => [...prev, section]);
    }
    setTimeout(() => {
      const element = sectionRefs.current[section];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

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
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-[#F8FAFC] rounded-2xl relative mt-20 pb-24">
      {/* Fixed Navigation Header - same as PreConProjectForm */}
      <div
        className="fixed z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm"
        style={{ top: "64px", left: `${sidebarWidth}px`, right: "0px" }}
      >
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {SECTIONS.map((section) => (
              <Button
                key={section.id}
                type="button"
                variant={openSections.includes(section.id) ? "default" : "outline"}
                onClick={() => navigateToSection(section.id)}
                className="rounded-lg"
              >
                {section.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Sections - same structure as PreConProjectForm */}
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-4 px-4 pt-4"
      >
        {/* Property info */}
        <div ref={(el) => { sectionRefs.current["property-info"] = el }}>
          <AccordionItem value="property-info">
            <AccordionTrigger className="container text-lg font-semibold px-6 rounded-lg">
              Property info
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Property size</CardTitle>
                    <CardDescription>
                      Add or review details about your property&apos;s size.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Hide property address</CardTitle>
                    <CardDescription>
                      Do you want to hide the property address on this listing?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-8 flex-col sm:flex-row">
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
                      <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4 max-w-sm">
                        <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                        <div className="text-sm text-foreground">
                          <p className="font-medium">Showing the property address</p>
                          <p className="text-muted-foreground mt-1">
                            You can hide the address if privacy is a concern, but the listing may receive fewer views and contacts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Rent details */}
        <div ref={(el) => { sectionRefs.current["rent-details"] = el }}>
          <AccordionItem value="rent-details">
            <AccordionTrigger className="container text-lg font-semibold px-6 rounded-lg">
              Rent details
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly rent and security deposit</CardTitle>
                    <CardDescription>
                      A security deposit isn&apos;t required, but you can choose to collect one.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        The current Rent estimate for this property is:
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">$2,963</p>
                    </div>
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
                      <Button type="button" variant="outline" className="mt-3 gap-2">
                        <span className="text-lg">+</span> Add an offer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Date available</CardTitle>
                    <CardDescription>
                      When is your property available to rent?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Pet policy</CardTitle>
                    <CardDescription>
                      Let renters know if you allow pets and, if so, what kind.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Media */}
        <div ref={(el) => { sectionRefs.current["media"] = el }}>
          <AccordionItem value="media">
            <AccordionTrigger className="container text-lg font-semibold px-6 rounded-lg">
              Media
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Add photos</CardTitle>
                    <CardDescription>
                      Photos help renters imagine living in your place.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUpload">Upload photos</Label>
                      <div className="flex gap-2 flex-wrap items-center">
                        <input
                          ref={fileInputRef}
                          id="imageUpload"
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES.join(",")}
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 rounded-lg"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Choose files
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Max 10MB each (JPEG, PNG, WebP, GIF)
                        </p>
                      </div>
                    </div>
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center gap-2 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (!files?.length) return;
                        const fileList = Array.from(files).filter((f) => ALLOWED_IMAGE_TYPES.includes(f.type));
                        const rejected = files.length - fileList.length;
                        if (rejected > 0) {
                          alert(`${rejected} file(s) skipped. Only JPEG, PNG, WebP, and GIF are allowed.`);
                        }
                        const toAdd: PendingImage[] = fileList
                          .filter((f) => f.size <= MAX_IMAGE_SIZE)
                          .map((f, i) => ({
                            file: f,
                            preview: URL.createObjectURL(f),
                            id: `pending-${Date.now()}-${i}-${Math.random()}`,
                          }));
                        const overSize = fileList.filter((f) => f.size > MAX_IMAGE_SIZE).length;
                        if (overSize > 0) {
                          alert(`${overSize} file(s) skipped. Max size 10MB per file.`);
                        }
                        if (toAdd.length > 0) {
                          setPendingImages((prev) => [...prev, ...toAdd]);
                        }
                      }}
                    >
                      <ImageIcon className="h-12 w-12 text-muted-foreground" aria-hidden />
                      <p className="font-medium text-foreground">Drag photos here</p>
                      <p className="text-sm text-muted-foreground">or click to select from your computer</p>
                    </div>
                    {pendingImages.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected photos ({pendingImages.length})</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {pendingImages.map((pendingImg) => (
                            <div
                              key={pendingImg.id}
                              className="relative group border rounded-lg overflow-hidden aspect-square border-primary/50"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={pendingImg.preview}
                                alt={pendingImg.file.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePendingImage(pendingImg.id);
                                }}
                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                aria-label={`Remove ${pendingImg.file.name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                {pendingImg.file.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
                      <Camera className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                      <div>
                        <p className="font-medium text-foreground">Photo tip</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Renters like to see photos of the room they&apos;ll be renting. Consider adding photos of the room, in addition to photos of the property&apos;s shared areas.
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">3D Tour</Label>
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                        <Video className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                        <span className="text-sm text-muted-foreground flex-1">
                          Add via Zillow 3D Home app or an external link
                        </span>
                        <Button type="button" size="sm">Add tour</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Amenities – single compact section (PreCon-style) */}
        <div ref={(el) => { sectionRefs.current["amenities"] = el }}>
          <AccordionItem value="amenities">
            <AccordionTrigger className="container text-lg font-semibold px-6 rounded-lg">
              Amenities
            </AccordionTrigger>
            <AccordionContent>
              <div className="container">
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                    <CardDescription>
                      Select what&apos;s included in your home. Sharing more helps renters see themselves in your property.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Laundry</Label>
                          <RadioGroup value={laundry} onValueChange={setLaundry} className="flex flex-wrap gap-3">
                            {["Washer-dryer included", "Washer-dryer hookups", "Shared or in building", "No laundry facilities"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`laundry-${opt}`} />
                                <Label htmlFor={`laundry-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Cooling</Label>
                          <RadioGroup value={cooling} onValueChange={setCooling} className="flex flex-wrap gap-3">
                            {["Central", "Wall", "Window", "None"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`cooling-${opt}`} />
                                <Label htmlFor={`cooling-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Heating</Label>
                          <RadioGroup value={heating} onValueChange={setHeating} className="flex flex-wrap gap-3">
                            {["Baseboard", "Forced air", "Heat pump", "Wall"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`heating-${opt}`} />
                                <Label htmlFor={`heating-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Appliances</Label>
                          <div className="flex flex-wrap gap-3">
                            {["Dishwasher", "Freezer", "Microwave", "Oven", "Refrigerator", "Trash compactor"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`appliances-${opt}`}
                                  checked={appliances.includes(opt)}
                                  onCheckedChange={(c) =>
                                    setAppliances((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                                  }
                                />
                                <Label htmlFor={`appliances-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Flooring</Label>
                          <div className="flex flex-wrap gap-3">
                            {["Carpet", "Hardwood", "Tile", "Linoleum", "Concrete", "Laminate"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`flooring-${opt}`}
                                  checked={flooring.includes(opt)}
                                  onCheckedChange={(c) =>
                                    setFlooring((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                                  }
                                />
                                <Label htmlFor={`flooring-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Parking</Label>
                          <div className="flex flex-wrap gap-3">
                            {["Attached garage", "Detached garage", "Off-street parking", "Carport", "Street parking"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`parking-${opt}`}
                                  checked={parking.includes(opt)}
                                  onCheckedChange={(c) =>
                                    setParking((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                                  }
                                />
                                <Label htmlFor={`parking-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Outdoor</Label>
                          <div className="flex flex-wrap gap-3">
                            {["Balcony or deck", "Pool", "Bicycle storage", "Fenced yard", "Garden"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`outdoor-${opt}`}
                                  checked={outdoor.includes(opt)}
                                  onCheckedChange={(c) =>
                                    setOutdoor((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                                  }
                                />
                                <Label htmlFor={`outdoor-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Accessibility</Label>
                          <div className="flex flex-wrap gap-3">
                            {["Disabled access", "Wheelchair accessible"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`accessibility-${opt}`}
                                  checked={accessibility.includes(opt)}
                                  onCheckedChange={(c) =>
                                    setAccessibility((prev) => c ? [...prev, opt] : prev.filter((x) => x !== opt))
                                  }
                                />
                                <Label htmlFor={`accessibility-${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Other amenities</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. Pet area"
                              value={otherAmenity}
                              onChange={(e) => setOtherAmenity(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (otherAmenity.trim()) {
                                    setOtherAmenitiesList((prev) => [...prev, otherAmenity.trim()]);
                                    setOtherAmenity("");
                                  }
                                }
                              }}
                              className="max-w-[200px] h-9 text-sm"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="gap-1.5 h-9"
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
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {otherAmenitiesList.map((item) => (
                                <span
                                  key={item}
                                  className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Costs & fees */}
        <div ref={(el) => { sectionRefs.current["costs-fees"] = el }}>
          <AccordionItem value="costs-fees">
            <AccordionTrigger className="container text-lg font-semibold px-6 rounded-lg">
              Costs &amp; fees
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>What additional costs and fees do you charge?</CardTitle>
                    <CardDescription>
                      We&apos;ve highlighted some of the most common fee categories. These details help renters know the real cost of renting your property before they apply.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {FEE_CATEGORIES.map(({ id, label, icon: Icon }) => (
                        <div
                          key={id}
                          className="rounded-lg border border-border bg-background p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                              </div>
                              <span className="font-medium">{label}</span>
                            </div>
                            <Popover
                              open={openFeePopover === id}
                              onOpenChange={(open) => {
                                setOpenFeePopover(open ? id : null);
                                setNewFeeName("");
                                setNewFeeAmount("");
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button type="button" size="sm" className="gap-1.5">
                                  <Plus className="h-4 w-4" aria-hidden />
                                  Add
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="end">
                                <div className="space-y-3">
                                  <p className="text-sm font-medium">Add {label.toLowerCase()} fee</p>
                                  <div className="space-y-2">
                                    <Label htmlFor={`fee-name-${id}`}>Fee name</Label>
                                    <Input
                                      id={`fee-name-${id}`}
                                      placeholder="e.g. Application fee"
                                      value={openFeePopover === id ? newFeeName : ""}
                                      onChange={(e) => setNewFeeName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") e.preventDefault();
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`fee-amount-${id}`}>Amount (optional)</Label>
                                    <Input
                                      id={`fee-amount-${id}`}
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="e.g. 50"
                                      value={openFeePopover === id ? newFeeAmount : ""}
                                      onChange={(e) => setNewFeeAmount(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          addFee(id, newFeeName, newFeeAmount);
                                        }
                                      }}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => addFee(id, newFeeName, newFeeAmount)}
                                    disabled={!newFeeName.trim()}
                                  >
                                    Add fee
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          {feeCategories[id].length > 0 && (
                            <ul className="space-y-1.5 border-t pt-3 mt-3">
                              {feeCategories[id].map((fee) => (
                                <li
                                  key={fee.id}
                                  className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-md bg-muted/50"
                                >
                                  <span>
                                    {fee.name}
                                    {fee.amount ? ` — $${fee.amount}` : ""}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeFee(id, fee.id)}
                                    aria-label={`Remove ${fee.name}`}
                                  >
                                    <X className="h-3.5 w-3.5" aria-hidden />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          )}
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
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Final details */}
        <div ref={(el) => { sectionRefs.current["final-details"] = el }}>
          <AccordionItem value="final-details">
            <AccordionTrigger className="container text-lg font-semibold px-6 rounded-lg">
              Final details
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Lease duration</CardTitle>
                    <CardDescription>What&apos;s the duration of the lease?</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Lease terms</CardTitle>
                    <CardDescription>What should renters know about the lease terms? Help renters decide if your property&apos;s a good fit.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                <div className="mt-6">
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Who&apos;s listing this property for rent?</CardTitle>
                    <CardDescription>Enter your information, unless you&apos;re creating the listing for someone else.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Verify your phone number</CardTitle>
                    <CardDescription>For your security, we&apos;ll send a one-time verification code to this number.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Allow renters to contact you by phone?</CardTitle>
                    <CardDescription>If you choose No, the listing will display without a phone number. The number displayed on your listing differs from your actual number.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Choose a way to book tours</CardTitle>
                    <CardDescription>You can change your settings anytime. Skip this if you prefer to book tours on your own.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Describe the property</CardTitle>
                    <CardDescription>Write several sentences describing the upgrades and desirable features that will attract renters.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Review & publish */}
        <div ref={(el) => { sectionRefs.current["review"] = el }}>
          <AccordionItem value="review">
            <AccordionTrigger className="container text-lg font-semibold px-6 rounded-lg">
              Review &amp; publish
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Review your listing</CardTitle>
                    <CardDescription>Preview and publish when ready.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="rounded-xl border border-border overflow-hidden bg-muted/30 w-full max-w-sm">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-medium text-foreground">
                      {initialData?.streetAddress ?? "Address"}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {monthlyRent ? `$${Number(monthlyRent).toLocaleString()}/mo` : "$—/mo"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {totalBedrooms || "—"} bd · {totalBathrooms || "—"} ba · {squareFootage ? `${squareFootage} sq. ft.` : "— sq. ft."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 mt-6">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden />
                  <div>
                    <p className="font-medium text-foreground">Your listing is incomplete</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Complete 6 key sections to publish your listing.{" "}
                      <button type="button" className="text-primary underline hover:no-underline">
                        Learn more
                      </button>
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2 mt-4">
                  <Eye className="h-4 w-4" aria-hidden />
                  Preview listing
                </Button>
                <div className="mt-8 space-y-2">
                  {[
                    { id: "property-info", label: "Property information", icon: Home },
                    { id: "rent-details", label: "Rent details", icon: DollarSign },
                    { id: "media", label: "Media", icon: Camera },
                    { id: "amenities", label: "Amenities", icon: ListChecks },
                    { id: "costs-fees", label: "Costs and fees", icon: FileText },
                    { id: "final-details", label: "Final details", icon: FileText },
                  ].map(({ id, label, icon: Icon }) => {
                    const isExpanded = expandedReviewSection === id;
                    return (
                      <div
                        key={id}
                        className="rounded-lg shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center gap-3 p-4 bg-background">
                          <button
                            type="button"
                            onClick={() => setExpandedReviewSection(isExpanded ? null : id)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-muted/50 transition-colors -m-2 p-2 rounded-md"
                            aria-expanded={isExpanded}
                          >
                            <ChevronDown
                              className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                              aria-hidden
                            />
                            <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="font-medium text-foreground truncate">{label}</span>
                          </button>
                          <span className="rounded bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200 shrink-0">
                            INCOMPLETE
                          </span>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="gap-1 shrink-0"
                            onClick={() => navigateToSection(id)}
                          >
                            Edit
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            {id === "property-info" && (
                              <dl className="space-y-1.5">
                                <div><dt className="font-medium text-foreground inline">Address: </dt><dd className="inline">{initialData?.streetAddress || "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Sq ft: </dt><dd className="inline">{squareFootage || "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Beds: </dt><dd className="inline">{totalBedrooms || "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Baths: </dt><dd className="inline">{totalBathrooms || "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Hide address: </dt><dd className="inline">{hideAddress === "yes" ? "Yes" : "No"}</dd></div>
                              </dl>
                            )}
                            {id === "rent-details" && (
                              <dl className="space-y-1.5">
                                <div><dt className="font-medium text-foreground inline">Monthly rent: </dt><dd className="inline">{monthlyRent ? `$${Number(monthlyRent).toLocaleString()}` : "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Security deposit: </dt><dd className="inline">{securityDeposit ? `$${Number(securityDeposit).toLocaleString()}` : "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Date available: </dt><dd className="inline">{dateAvailable || "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Pets: </dt><dd className="inline">{[pets.noPets && "No pets", pets.cats && "Cats", pets.smallDogs && "Small dogs", pets.largeDogs && "Large dogs"].filter(Boolean).join(", ") || "—"}</dd></div>
                              </dl>
                            )}
                            {id === "media" && (
                              <dl className="space-y-1.5">
                                <div><dt className="font-medium text-foreground inline">Photos: </dt><dd className="inline">{pendingImages.length ? `${pendingImages.length} selected` : "None"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">3D tour: </dt><dd className="inline">Not added</dd></div>
                              </dl>
                            )}
                            {id === "amenities" && (
                              <dl className="space-y-1.5">
                                {laundry && <div><dt className="font-medium text-foreground inline">Laundry: </dt><dd className="inline">{laundry}</dd></div>}
                                {cooling && <div><dt className="font-medium text-foreground inline">Cooling: </dt><dd className="inline">{cooling}</dd></div>}
                                {heating && <div><dt className="font-medium text-foreground inline">Heating: </dt><dd className="inline">{heating}</dd></div>}
                                {appliances.length > 0 && <div><dt className="font-medium text-foreground inline">Appliances: </dt><dd className="inline">{appliances.join(", ")}</dd></div>}
                                {flooring.length > 0 && <div><dt className="font-medium text-foreground inline">Flooring: </dt><dd className="inline">{flooring.join(", ")}</dd></div>}
                                {parking.length > 0 && <div><dt className="font-medium text-foreground inline">Parking: </dt><dd className="inline">{parking.join(", ")}</dd></div>}
                                {outdoor.length > 0 && <div><dt className="font-medium text-foreground inline">Outdoor: </dt><dd className="inline">{outdoor.join(", ")}</dd></div>}
                                {accessibility.length > 0 && <div><dt className="font-medium text-foreground inline">Accessibility: </dt><dd className="inline">{accessibility.join(", ")}</dd></div>}
                                {otherAmenitiesList.length > 0 && <div><dt className="font-medium text-foreground inline">Other: </dt><dd className="inline">{otherAmenitiesList.join(", ")}</dd></div>}
                                {!laundry && !cooling && !heating && appliances.length === 0 && flooring.length === 0 && parking.length === 0 && outdoor.length === 0 && accessibility.length === 0 && otherAmenitiesList.length === 0 && (
                                  <p>No amenities selected</p>
                                )}
                              </dl>
                            )}
                            {id === "costs-fees" && (
                              <dl className="space-y-2">
                                {(Object.entries(feeCategories) as [FeeCategoryId, FeeEntry[]][]).map(([catId, entries]) =>
                                  entries.length > 0 ? (
                                    <div key={catId}>
                                      <dt className="font-medium text-foreground capitalize">{catId}</dt>
                                      <dd className="mt-0.5 pl-2 space-y-0.5">
                                        {entries.map((fee) => (
                                          <span key={fee.id} className="block">{fee.name}{fee.amount ? ` — $${fee.amount}` : ""}</span>
                                        ))}
                                      </dd>
                                    </div>
                                  ) : null
                                )}
                                {Object.values(feeCategories).every((arr) => arr.length === 0) && (
                                  <p>No fees added</p>
                                )}
                              </dl>
                            )}
                            {id === "final-details" && (
                              <dl className="space-y-1.5">
                                <div><dt className="font-medium text-foreground inline">Lease duration: </dt><dd className="inline">{leaseDuration || "—"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Renters insurance: </dt><dd className="inline">{rentersInsurance === "yes" ? "Required" : "Not required"}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Listed by: </dt><dd className="inline">{listedBy}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Contact: </dt><dd className="inline">{contactName || "—"} {contactEmail ? `(${contactEmail})` : ""}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Phone: </dt><dd className="inline">{phoneNumber || "—"} {allowPhoneContact === "no" ? "(hidden on listing)" : ""}</dd></div>
                                <div><dt className="font-medium text-foreground inline">Book tours: </dt><dd className="inline">{bookToursMethod === "instantly" ? "Book instantly" : "Review and confirm"}</dd></div>
                                {propertyDescription && <div><dt className="font-medium text-foreground inline">Description: </dt><dd className="inline line-clamp-2">{propertyDescription}</dd></div>}
                              </dl>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  By publishing this listing, you agree to comply with our Terms of Use, Rentals Lister Terms, and Respectful Renting Pledge.
                </p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>
      </Accordion>

      <div className="h-24" />

      <div
        className="fixed bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg"
        style={{ left: `${sidebarWidth}px`, right: "0px" }}
      >
        <div className="px-6 py-4">
          <div className="flex justify-between gap-4 max-w-7xl mx-auto items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveExit}
              className="min-w-[120px]"
            >
              Save &amp; exit
            </Button>
            <Button
              type="button"
              onClick={handleFinish}
              className="min-w-[120px] gap-2"
            >
              Publish
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
